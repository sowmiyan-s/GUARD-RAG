"""
GUARDRAILS LOCAL RAG BOT — FastAPI Backend
==========================================
Replaces the Streamlit frontend with a proper REST API so the app
can be served as a standard web application and deployed anywhere
(Render, Railway, Fly.io, Docker, bare-metal, etc.).

Endpoints
---------
GET  /api/health          → overall health (Ollama status, model list)
GET  /api/config          → server-side config (OLLAMA_HOST env var) sent to frontend
POST /api/ollama/start    → try to start the local Ollama process
POST /api/upload          → upload one or more documents, build / load RAG chain
POST /api/chat            → send a question, get an answer
POST /api/clear           → clear conversation history
GET  /api/storage         → list all persisted FAISS document collections
POST /api/sessions/load   → rehydrate a stored FAISS session (no re-upload needed)
GET  /                    → serve frontend index.html
"""

# ─────────────────────────────────────────────────────────────────────────────
# Server-wide Ollama host — set OLLAMA_HOST env var to pre-configure all users.
# When deployed online (Render, Fly.io, etc.) with a tunnel URL set as
# OLLAMA_HOST, every visitor automatically uses that endpoint with zero
# configuration on their part.
# ─────────────────────────────────────────────────────────────────────────────
# NOTE: This constant is defined AFTER load_dotenv() below.

import asyncio
import anyio.to_thread
import hashlib
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Optional

# Fix OMP error for FAISS (must be before FAISS import)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Proxy bypass — keeps HuggingFace downloads & Ollama calls out of corporate proxies
_NO_PROXY = "huggingface.co,*.huggingface.co,localhost,127.0.0.1"
os.environ.setdefault("NO_PROXY", _NO_PROXY)
os.environ.setdefault("no_proxy", _NO_PROXY)

# ─────────────────────────────────────────────────────────────────────────────
# Python 3.14 Compatibility Patch
# Monkeypatch anyio.to_thread.run_sync to use asyncio.to_thread, bypassing
# anyio's broken threadpool implementation on experimental Python versions.
# ─────────────────────────────────────────────────────────────────────────────
async def _patched_run_sync(func, *args, **kwargs):
    return await asyncio.to_thread(func, *args)

anyio.to_thread.run_sync = _patched_run_sync

import nest_asyncio

try:
    nest_asyncio.apply()
except (ValueError, RuntimeError):
    # nest_asyncio cannot patch uvloop (used by uvicorn[standard] in production).
    # That's fine — uvloop doesn't need the patch; skip silently.
    pass

from dotenv import load_dotenv

load_dotenv()

# Server-wide default Ollama host — reads from environment variable.
# Override at any time by setting OLLAMA_HOST in .env or your PaaS settings.
SERVER_OLLAMA_HOST: str = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")

from fastapi import FastAPI, File, HTTPException, UploadFile, Request, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel

# Internal imports
from guardrag.api import db
from guardrag.rag.core import (
    build_rag_chain,
    load_stored_rag_chain,
)
from guardrag.utils.ollama import (
    get_installed_models,
    get_ollama_version,
    is_ollama_running,
    start_ollama_server,
    stop_ollama_server,
)
from guardrag.utils.redactor import redact_text, rehydrate_text
from guardrag.utils.safety import (
    check_input_safety,
    check_output_safety,
    load_policies,
    save_policies,
    SENSITIVITY_PROFILES,
)

# ─────────────────────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────────────────────
try:
    import guardrag as _guardrag_pkg
    _API_VERSION = _guardrag_pkg.__version__
except Exception:
    _API_VERSION = "1.3.0"

app = FastAPI(
    title="Guardrails Local RAG Bot",
    description="Privacy-first, fully offline AI document assistant secured by tiered safety guardrails.",
    version=_API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent / "frontend"
FAISS_STORAGE = db.get_data_dir()
FAISS_STORAGE.mkdir(parents=True, exist_ok=True)

# Meta file that maps db_id → human-readable info (file names, date, model)
FAISS_META_FILE = FAISS_STORAGE / "_meta.json"

# ─────────────────────────────────────────────────────────────────────────────
# Enterprise API Key Security Guard
# ─────────────────────────────────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)

def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Verify API authorization when GUARDRAG_API_KEY is configured in environment."""
    server_key = os.environ.get("GUARDRAG_API_KEY")
    if not server_key:
        return True
    
    token = credentials.credentials if credentials else None
    if token == server_key or x_api_key == server_key:
        return True
    
    raise HTTPException(
        status_code=401,
        detail="Unauthorized: Missing or invalid API key."
    )

# ─────────────────────────────────────────────────────────────────────────────
# Global Metrics Telemetry
# ─────────────────────────────────────────────────────────────────────────────
_app_start_time: float = time.time()
_query_count: int = 0
_total_latency: float = 0.0

# ─────────────────────────────────────────────────────────────────────────────
# FAISS metadata helpers
# ─────────────────────────────────────────────────────────────────────────────
def _load_faiss_meta() -> dict:
    if FAISS_META_FILE.exists():
        try:
            return json.loads(FAISS_META_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def _save_faiss_meta(meta: dict):
    FAISS_META_FILE.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

def _register_faiss_entry(db_id: str, file_names: list, model: str, chunk_size: int, chunk_overlap: int, redact_pii: bool = False, manual_redactions: list = None):
    meta = _load_faiss_meta()
    meta[db_id] = {
        "files": file_names,
        "model": model,
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap,
        "redact_pii": redact_pii,
        "manual_redactions": manual_redactions or [],
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _save_faiss_meta(meta)

# ─────────────────────────────────────────────────────────────────────────────
# Persistent session store (SQLite) and LRU Cache for RAG chains
# ─────────────────────────────────────────────────────────────────────────────
from collections import OrderedDict

class LRUChainCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity
    def get(self, key):
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]
    def put(self, key, value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
            
_rag_chains = LRUChainCache(capacity=5)

def _update_db_session(session: dict):
    db.save_session(
        session_id=session["session_id"],
        db_id=session["db_id"],
        model=session["model"],
        files=session["files"],
        chunk_size=session["chunk_size"],
        redact_pii=session["redact_pii"],
        system_prompt=session.get("system_prompt", ""),
        sensitivity_level=session.get("sensitivity_level", "Internal"),
        enable_guardrails=session.get("enable_guardrails", True),
        temperature=session.get("temperature", 0.0),
        chunk_overlap=session.get("chunk_overlap", 200),
        custom_rules=session.get("custom_rules", []),
        messages=session.get("messages", [])
    )



# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    session_id: str
    question: str
    model: str = "gemma3:1b"
    enable_guardrails: bool = True
    sensitivity_level: str = "Internal"
    # Frontend sends whatever the user has in the Endpoint URL box;
    # if blank the server default (SERVER_OLLAMA_HOST) is used.
    ollama_host: str = ""
    custom_rules: Optional[list[str]] = []
    system_prompt: Optional[str] = ""
    temperature: float = 0.0
    min_confidence: float = 0.0

    def resolved_host(self) -> str:
        return (self.ollama_host or SERVER_OLLAMA_HOST).rstrip("/")


class ShareGenerateRequest(BaseModel):
    session_id: str
    name: Optional[str] = "Share Link"
    show_history: bool = True
    read_only: bool = False
    sync: bool = True
    min_confidence: float = 0.0
    sensitivity_level: Optional[str] = "Internal"

class ClearRequest(BaseModel):
    session_id: str

class LoadSessionRequest(BaseModel):
    db_id: str
    model: str = "gemma3:1b"
    ollama_host: str = ""
    system_prompt: Optional[str] = ""
    temperature: float = 0.0

    def resolved_host(self) -> str:
        return (self.ollama_host or SERVER_OLLAMA_HOST).rstrip("/")


# Ollama utilities are imported from guardrag.utils.ollama


# ─────────────────────────────────────────────────────────────────────────────
# Audit logging system
# ─────────────────────────────────────────────────────────────────────────────
def add_audit_log(event_type: str, message: str, details: dict = None):
    """Persist audit log entry to SQLite storage."""
    db.add_audit_log(event_type, message, details)

# ─────────────────────────────────────────────────────────────────────────────
# Prometheus & Telemetry Endpoint
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/metrics")
async def get_metrics():
    """Expose application health and performance telemetry metrics."""
    global _query_count, _total_latency, _app_start_time
    uptime_sec = round(time.time() - _app_start_time, 2)
    avg_latency = round(_total_latency / max(_query_count, 1), 3) if _query_count > 0 else 0.0
    meta = await asyncio.to_thread(_load_faiss_meta)
    collections_count = len(meta)
    sessions = await asyncio.to_thread(db.list_sessions)
    sessions_count = len(sessions)
    
    return {
        "status": "healthy",
        "uptime_seconds": uptime_sec,
        "total_queries": _query_count,
        "average_latency_seconds": avg_latency,
        "indexed_collections": collections_count,
        "active_sessions": sessions_count,
        "memory_cached_chains": len(_rag_chains.cache),
        "data_directory": str(FAISS_STORAGE),
    }


# RAG functions are now imported from guardrag.rag.core


# ─────────────────────────────────────────────────────────────────────────────
# API routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/config")
async def get_config():
    """Return server-side configuration to the frontend.
    The frontend reads SERVER_OLLAMA_HOST from here on startup so users
    don’t need to configure anything manually when the app is deployed.
    """
    return {
        "server_ollama_host": SERVER_OLLAMA_HOST,
        "is_remote": not ("localhost" in SERVER_OLLAMA_HOST or "127.0.0.1" in SERVER_OLLAMA_HOST),
    }


@app.get("/api/health")
async def health(ollama_host: str = ""):
    """Check Ollama health. Uses SERVER_OLLAMA_HOST when no host is supplied."""
    host = (ollama_host or SERVER_OLLAMA_HOST).rstrip("/")
    running = await asyncio.to_thread(is_ollama_running, host)
    models = await asyncio.to_thread(get_installed_models, host) if running else []
    version = await asyncio.to_thread(get_ollama_version, host) if running else "unknown"
    return {
        "ollama_running": running,
        "ollama_host": host,
        "ollama_version": version,
        "models": models,
        "sensitivity_profiles": {
            k: {"description": v["description"], "badge": v["badge"]}
            for k, v in SENSITIVITY_PROFILES.items()
        },
    }


@app.post("/api/ollama/start")
async def ollama_start():
    """Attempt to start a locally-installed Ollama process."""
    if await asyncio.to_thread(is_ollama_running, SERVER_OLLAMA_HOST, 0.5):
        return {"started": True, "message": "Ollama is already running."}
    ok = await asyncio.to_thread(start_ollama_server)
    if ok:
        return {"started": True, "message": "Ollama started successfully."}
    raise HTTPException(
        status_code=503,
        detail="Failed to start Ollama. Verify it is installed and the OLLAMA_HOST is correct.",
    )


@app.post("/api/ollama/stop")
async def ollama_stop():
    """Attempt to stop the local Ollama process."""
    ok = await asyncio.to_thread(stop_ollama_server)
    if ok:
        return {"stopped": True, "message": "Ollama stopped successfully."}
    is_running = await asyncio.to_thread(is_ollama_running, SERVER_OLLAMA_HOST, 1.0)
    if not is_running:
        return {"stopped": True, "message": "Ollama stopped successfully."}
    raise HTTPException(
        status_code=500,
        detail="Failed to stop Ollama process.",
    )


class SuggestQuestionsRequest(BaseModel):
    session_id: str

def parse_questions_from_response(text: str) -> list[str]:
    import re
    text = text.strip()
    # Find the first '[' and last ']'
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        try:
            questions = json.loads(text[start:end+1])
            if isinstance(questions, list):
                cleaned = [str(q).strip() for q in questions if str(q).strip()]
                if cleaned:
                    return cleaned[:3]
        except Exception:
            pass
            
    # Fallback parsing
    lines = text.split('\n')
    questions = []
    for line in lines:
        line = line.strip()
        cleaned = re.sub(r'^(\d+[\.\)]|[\-\*•])\s*', '', line).strip()
        cleaned = cleaned.strip('"\'')
        if cleaned and len(cleaned) > 10 and cleaned.endswith('?'):
            questions.append(cleaned)
            if len(questions) >= 3:
                break
                
    if len(questions) < 3:
        for line in lines:
            line = line.strip().strip('"\'')
            if line and line.endswith('?') and line not in questions:
                questions.append(line)
                if len(questions) >= 3:
                    break
                    
    if not questions:
        questions = [
            "What is the main topic of this document?",
            "Can you summarize the key findings or clauses?",
            "Are there any specific dates, deadlines, or requirements mentioned?"
        ]
    return questions[:3]

@app.post("/api/suggest_questions")
async def suggest_questions(req: SuggestQuestionsRequest):
    actual_session_id = req.session_id
    share_link = db.get_share_link(req.session_id)
    if share_link and share_link.get("sync"):
        actual_session_id = share_link["parent_session_id"]
        
    session = db.get_session(actual_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    db_id = session.get("db_id")
    model = session.get("model", "gemma3:1b")
    ollama_host = session.get("ollama_host", SERVER_OLLAMA_HOST)
    
    if not db_id:
        raise HTTPException(status_code=400, detail="Invalid session database ID.")
        
    try:
        from guardrag.rag.core import get_stored_vectorstore, _get_llm
        
        # 1. Retrieve the vectorstore
        vectorstore = await asyncio.to_thread(get_stored_vectorstore, db_id)
        
        # 2. Get representative chunks
        docs = await asyncio.to_thread(
            vectorstore.similarity_search, 
            "summary overview main topics highlights key findings timeline requirements", 
            k=3
        )
        
        if not docs:
            # Fallback to first few chunks if similarity search returns nothing
            if hasattr(vectorstore, "docstore") and hasattr(vectorstore.docstore, "_dict"):
                docs = list(vectorstore.docstore._dict.values())[:3]
                
        if not docs:
            raise ValueError("No documents/chunks found in vectorstore.")
            
        context_text = "\n\n".join([d.page_content for d in docs])
        
        # 3. Initialize the raw LLM
        llm = _get_llm(model, ollama_host)
        
        # 4. Prompt the LLM directly
        prompt = (
            "You are a document analyzer. Read the following document excerpt and generate exactly 3 short, "
            "highly specific questions that a user would want to ask about this specific document.\n\n"
            f"Document Excerpt:\n{context_text}\n\n"
            "Format your output as a raw JSON list of strings, containing only the 3 questions. E.g.,\n"
            "[\"First question?\", \"Second question?\", \"Third question?\"]\n"
            "Do not include any intro, explanation, markdown formatting (like ```json), or extra text. Output only the JSON list."
        )
        
        response = await asyncio.to_thread(llm.invoke, prompt)
        
        if hasattr(response, "content"):
            answer = response.content
        else:
            answer = str(response)
            
        questions = parse_questions_from_response(answer)
        
        # Rehydrate question text if document was redacted
        is_redacted = session.get("redact_pii", False)
        if is_redacted:
            mapping_path = FAISS_STORAGE / db_id / "mapping.json"
            if mapping_path.exists():
                try:
                    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
                    questions = [rehydrate_text(q, mapping) for q in questions]
                except Exception:
                    pass
                    
        return {"questions": questions}
        
    except Exception as e:
        print(f"Error generating realtime suggestions: {e}")
        return {
            "questions": [
                "What is the main summary of this document?",
                "Are there any key deadlines or dates mentioned?",
                "What are the main risks or highlights?"
            ]
        }


@app.post("/api/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    model: str = "gemma3:1b",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    ollama_host: str = "",
    redact_pii: bool = False,
    manual_redactions: str = "",
    system_prompt: str = "",
    temperature: float = 0.0,
    _auth: bool = Depends(verify_api_key)
):
    # Use server-configured host if the client didn't supply one
    host = (ollama_host or SERVER_OLLAMA_HOST).rstrip("/")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    allowed_ext = {".pdf", ".txt", ".doc", ".docx", ".md", ".json", ".csv", ".log", ".py"}
    temp_paths = []
    file_names = []

    try:
        for uf in files:
            ext = os.path.splitext(uf.filename)[-1].lower()
            if ext not in allowed_ext:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(await uf.read())
                temp_paths.append(tmp.name)
            file_names.append(uf.filename)

        if not await asyncio.to_thread(is_ollama_running, host):
            raise HTTPException(
                status_code=503,
                detail=f"Ollama is not reachable at {host}. Check the OLLAMA_HOST setting.",
            )

        manual_list = [w.strip() for w in manual_redactions.split(",") if w.strip()]

        try:
            db_id, rag_chain = await asyncio.to_thread(
                build_rag_chain, temp_paths, model, chunk_size, chunk_overlap, host, redact_pii=redact_pii, manual_redactions=manual_list, system_prompt=system_prompt, temperature=temperature
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Error building RAG index: {str(e)}"
            ) from e

        h = hashlib.md5(
            ("|".join(sorted(file_names)) + model + str(chunk_size) + str(chunk_overlap) + str(redact_pii) + manual_redactions).encode()
        ).hexdigest()[:16]

        _rag_chains.put(h, rag_chain)
        
        existing_session = db.get_session(h)
        existing_messages = existing_session.get("messages", []) if existing_session else []

        db.save_session(
            session_id=h,
            db_id=db_id,
            model=model,
            files=file_names,
            chunk_size=chunk_size,
            redact_pii=redact_pii,
            system_prompt=system_prompt,
            sensitivity_level=existing_session.get("sensitivity_level", "Internal") if existing_session else "Internal",
            enable_guardrails=existing_session.get("enable_guardrails", True) if existing_session else True,
            temperature=temperature,
            chunk_overlap=chunk_overlap,
            custom_rules=manual_list,
            messages=existing_messages
        )

        await asyncio.to_thread(_register_faiss_entry, db_id, file_names, model, chunk_size, chunk_overlap, redact_pii, manual_list)
        add_audit_log("upload", f"Indexed {len(files)} file(s) into database {db_id}", {"model": model, "chunk_size": chunk_size, "redact_pii": redact_pii})
        return {"session_id": h, "db_id": db_id, "files": file_names, "model": model, "messages": existing_messages}

    finally:
        for p in temp_paths:
            if os.path.exists(p):
                os.remove(p)


@app.get("/api/storage")
async def list_storage():
    """
    Return all persisted FAISS document collections.
    The frontend uses this to show the Document Library panel.
    """
    meta = await asyncio.to_thread(_load_faiss_meta)
    entries = []
    for db_id, info in meta.items():
        persist_dir = FAISS_STORAGE / db_id
        entries.append({
            "db_id": db_id,
            "files": info.get("files", []),
            "model": info.get("model", "unknown"),
            "chunk_size": info.get("chunk_size", 1000),
            "chunk_overlap": info.get("chunk_overlap", 200),
            "redact_pii": info.get("redact_pii", False),
            "manual_redactions": info.get("manual_redactions", []),
            "created_at": info.get("created_at", ""),
            "available": persist_dir.exists(),
        })
    # Newest first
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    return {"collections": entries}


@app.post("/api/sessions/load")
async def load_session(req: LoadSessionRequest):
    """Rehydrate a stored FAISS collection without re-uploading."""
    host = req.resolved_host()
    meta = await asyncio.to_thread(_load_faiss_meta)
    if req.db_id not in meta:
        raise HTTPException(status_code=404, detail="Collection not found in storage.")

    persist_dir = FAISS_STORAGE / req.db_id
    if not persist_dir.exists():
        raise HTTPException(status_code=404, detail="FAISS index files missing from disk.")

    if not await asyncio.to_thread(is_ollama_running, host):
        raise HTTPException(
            status_code=503,
            detail=f"Ollama is not reachable at {host}.",
        )

    try:
        rag_chain = await asyncio.to_thread(load_stored_rag_chain, req.db_id, req.model, host, system_prompt=req.system_prompt, temperature=req.temperature)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load index: {str(e)}") from e

    info = meta[req.db_id]
    h = hashlib.md5((req.db_id + req.model + host).encode()).hexdigest()[:16]

    _rag_chains.put(h, rag_chain)

    existing_session = db.get_session(h)
    existing_messages = existing_session.get("messages", []) if existing_session else []

    db.save_session(
        session_id=h,
        db_id=req.db_id,
        model=req.model,
        files=info.get("files", []),
        chunk_size=info.get("chunk_size", 1000),
        redact_pii=info.get("redact_pii", False),
        system_prompt=req.system_prompt,
        sensitivity_level=existing_session.get("sensitivity_level", "Internal") if existing_session else "Internal",
        enable_guardrails=existing_session.get("enable_guardrails", True) if existing_session else True,
        temperature=req.temperature,
        chunk_overlap=info.get("chunk_overlap", 200),
        custom_rules=info.get("manual_redactions", []),
        messages=existing_messages
    )

    return {
        "session_id": h,
        "db_id": req.db_id,
        "files": info.get("files", []),
        "model": req.model,
        "messages": existing_messages,
    }

@app.post("/api/share/generate")
async def generate_share_link(req: ShareGenerateRequest):
    parent = db.get_session(req.session_id)
    target_session_id = req.session_id
    if not parent:
        sl = db.get_share_link(req.session_id)
        if sl:
            target_session_id = sl["parent_session_id"]
            parent = db.get_session(target_session_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    import secrets
    share_id = secrets.token_hex(8)
    db.create_share_link(
        share_id=share_id,
        parent_session_id=target_session_id,
        show_history=req.show_history,
        read_only=req.read_only,
        sync=req.sync,
        name=req.name or "Share Link",
        min_confidence=req.min_confidence,
        sensitivity_level=req.sensitivity_level or "Internal"
    )
    return {"share_id": share_id}

@app.get("/api/share/list/{session_id}")
async def list_share_links_endpoint(session_id: str):
    links = db.list_share_links(session_id)
    return {"links": links}

@app.delete("/api/share/revoke/{share_id}")
async def revoke_share_link_endpoint(share_id: str):
    db.delete_share_link(share_id)
    return {"success": True, "share_id": share_id}

@app.get("/api/share/client-chats/{session_id}")
async def list_client_chats_endpoint(session_id: str):
    clients = db.list_client_sessions(session_id)
    return {"clients": clients}

@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    actual_session_id = session_id
    share_link = db.get_share_link(session_id)
    if share_link:
        actual_session_id = share_link["parent_session_id"]
        
    session = db.get_session(actual_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    return {"messages": session.get("messages", [])}

import socket
@app.get("/api/share/network-info")
async def get_network_info():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        ip = "127.0.0.1"
    return {"local_ip": ip, "port": 8000}

@app.post("/api/storage/delete")
async def delete_storage_entry(body: dict):
    """Delete a stored FAISS collection from disk and metadata."""
    db_id = body.get("db_id", "")
    if not db_id:
        raise HTTPException(status_code=400, detail="db_id is required.")

    meta = await asyncio.to_thread(_load_faiss_meta)
    if db_id not in meta:
        raise HTTPException(status_code=404, detail="Collection not found.")

    import shutil
    persist_dir = FAISS_STORAGE / db_id
    if persist_dir.exists():
        await asyncio.to_thread(shutil.rmtree, persist_dir)

    del meta[db_id]
    await asyncio.to_thread(_save_faiss_meta, meta)

    # Evict cached RAG chains from memory
    try:
        keys_to_evict = [k for k in list(_rag_chains.cache.keys()) if db_id in str(k)]
        for k in keys_to_evict:
            _rag_chains.cache.pop(k, None)
    except Exception:
        pass

    return {"deleted": True, "db_id": db_id}


@app.get("/api/sessions/info/{session_id}")
async def get_session_info(session_id: str):
    actual_session_id = session_id
    is_shared = False
    share_settings = None
    
    share_link = db.get_share_link(session_id)
    if share_link:
        actual_session_id = share_link["parent_session_id"]
        is_shared = True
        share_settings = share_link
        
    session = db.get_session(actual_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or has expired.")
        
    return {
        "db_id": session.get("db_id"),
        "files": session.get("files", []),
        "model": session.get("model", "gemma3:1b"),
        "sensitivity_level": session.get("sensitivity_level", "Internal"),
        "enable_guardrails": session.get("enable_guardrails", True),
        "system_prompt": session.get("system_prompt", ""),
        "ollama_host": session.get("ollama_host", ""),
        "custom_rules": session.get("custom_rules", []),
        "is_shared": is_shared,
        "share_settings": share_settings
    }


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Stream LLM tokens in real-time via Server-Sent Events (SSE).
    Dispatches citations before generation starts, followed by live tokens and final latency metadata.
    """
    actual_session_id = req.session_id
    is_read_only = False
    min_confidence = req.min_confidence or 0.0
    
    # Check if this is a direct share link token
    share_link = db.get_share_link(req.session_id)
    if share_link:
        if share_link.get("sync"):
            actual_session_id = share_link["parent_session_id"]
        is_read_only = share_link.get("read_only", False)
        if share_link.get("min_confidence"):
            min_confidence = max(min_confidence, float(share_link.get("min_confidence", 0.0)))
    else:
        # Check if session_id is a registered client session
        client_sess = db.get_client_session(req.session_id)
        if client_sess:
            sl = db.get_share_link(client_sess["share_id"])
            if sl:
                is_read_only = sl.get("read_only", False)
                if sl.get("min_confidence"):
                    min_confidence = max(min_confidence, float(sl.get("min_confidence", 0.0)))
                if sl.get("sync"):
                    actual_session_id = sl["parent_session_id"]
        
    session = db.get_session(actual_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload documents first.")

    if is_read_only or session.get("read_only", False):
        raise HTTPException(status_code=403, detail="This session is read-only. You cannot send messages.")

    # Enforce host privacy controls
    if share_link:
        effective_sensitivity = share_link.get("sensitivity_level") or session.get("sensitivity_level", "Internal")
    elif client_sess:
        c_sl = db.get_share_link(client_sess["share_id"])
        effective_sensitivity = (c_sl.get("sensitivity_level") if c_sl else None) or session.get("sensitivity_level", "Internal")
    else:
        effective_sensitivity = req.sensitivity_level
        session["sensitivity_level"] = effective_sensitivity
        session["enable_guardrails"] = req.enable_guardrails
        if req.custom_rules:
            session["custom_rules"] = req.custom_rules
    req.sensitivity_level = effective_sensitivity

    effective_model = req.model.strip() if req.model and req.model.strip() else session.get("model", "gemma3:1b")
    requested_host = req.resolved_host()

    # Input safety check
    blocked = check_input_safety(req.question, req.sensitivity_level, req.enable_guardrails, custom_rules=req.custom_rules)
    if blocked:
        add_audit_log("safety_alert", f"Input question blocked by {req.sensitivity_level} policy.", {"question": req.question})
        async def blocked_generator():
            yield f"event: blocked\ndata: {json.dumps({'answer': blocked, 'blocked': True, 'source': 'input_guard', 'citations': [], 'latency_sec': 0.0})}\n\n"
        return StreamingResponse(blocked_generator(), media_type="text/event-stream")

    # Mapping for PII redaction
    mapping = {}
    is_redacted = session.get("redact_pii", False)
    db_id = session.get("db_id")
    if is_redacted and db_id:
        mapping_path = FAISS_STORAGE / db_id / "mapping.json"
        if mapping_path.exists():
            try:
                mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
            except Exception:
                pass

    question = req.question
    if is_redacted:
        from guardrag.utils.redactor import redact_and_map
        question, updated_map = redact_and_map(question, redact_names=True, existing_map=mapping)
        if len(updated_map) > len(mapping):
            mapping = updated_map
            if db_id:
                mapping_path = FAISS_STORAGE / db_id / "mapping.json"
                try:
                    mapping_path.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
                except Exception:
                    pass
        add_audit_log("redaction", "Redacted user query before LLM processing.")

    # Retrieve vectorstore and context documents
    from guardrag.rag.core import get_stored_vectorstore, _get_llm
    vectorstore = await asyncio.to_thread(get_stored_vectorstore, session["db_id"], str(FAISS_STORAGE))

    host_lower = requested_host.lower()
    is_cloud = any(x in host_lower for x in ["api.openai.com", "api.groq.com", "openrouter.ai", "api.anthropic.com", "api.cohere.ai"]) or \
               any(x in effective_model.lower() for x in ["gpt-", "claude-", "gemini-", "command-r", "meta-llama"])
    k = 8 if is_cloud else 4

    docs = await asyncio.to_thread(vectorstore.similarity_search, question, k)

    # Compute citation scores
    citations = []
    try:
        import math
        from guardrag.rag.core import _get_embeddings
        embeddings = _get_embeddings()
        query_vector = embeddings.embed_query(question)
        doc_contents = [doc.page_content for doc in docs]
        if doc_contents:
            doc_vectors = embeddings.embed_documents(doc_contents)
            q_norm = math.sqrt(sum(x * x for x in query_vector)) or 1.0
            for doc, doc_vector in zip(docs, doc_vectors):
                d_norm = math.sqrt(sum(x * x for x in doc_vector)) or 1.0
                dot_prod = sum(q * d for q, d in zip(query_vector, doc_vector))
                score_val = max(0.0, min(1.0, round(float(dot_prod / (q_norm * d_norm)), 4)))
                if min_confidence > 0.0 and score_val < min_confidence:
                    continue

                disp_content = rehydrate_text(doc.page_content, mapping) if (is_redacted and mapping) else doc.page_content
                source_path = doc.metadata.get("source", "Unknown")
                source_name = os.path.basename(source_path) if source_path else "Unknown"
                citations.append({
                    "source": source_name,
                    "page": doc.metadata.get("page", 0) + 1 if "page" in doc.metadata else None,
                    "content": disp_content,
                    "score": score_val,
                })
    except Exception as e:
        for doc in docs:
            disp_content = rehydrate_text(doc.page_content, mapping) if (is_redacted and mapping) else doc.page_content
            source_path = doc.metadata.get("source", "Unknown")
            source_name = os.path.basename(source_path) if source_path else "Unknown"
            citations.append({
                "source": source_name,
                "page": doc.metadata.get("page", 0) + 1 if "page" in doc.metadata else None,
                "content": disp_content,
                "score": 0.0,
            })

    system_prompt = req.system_prompt or session.get("system_prompt")
    if not system_prompt:
        system_prompt = (
            "You are GuardRAG, an intelligent, multilingual, and creative agentic document assistant.\n"
            "Your task is to answer the user's query using ONLY the provided document context below.\n"
            "Strictly follow these rules:\n"
            "1. Ground your answer solely in the provided context chunks. Do NOT assume, extrapolate, or bring in outside knowledge.\n"
            "2. If the context does not contain the answer, state clearly and politely that the information is missing from the uploaded documents.\n"
            "3. If different documents or chunks provide contradictory information, point out the discrepancy with their source names.\n"
            "4. IMPORTANT: Always respond in the SAME language the user asks the question in, actively translating context if necessary.\n"
            "5. Be creative in formatting your answer (use markdown, lists, tables, and emojis where appropriate) to make it highly readable and logically structured."
        )

    context_str = "\n\n".join([f"[Source Document: {os.path.basename(d.metadata.get('source', 'Unknown'))}]\n{d.page_content}" for d in docs])
    
    from langchain_core.messages import SystemMessage
    lc_messages = [SystemMessage(content=f"{system_prompt}\n\nContext:\n{context_str}")]
    for h_msg in session["messages"]:
        if h_msg["role"] == "user":
            lc_messages.append(HumanMessage(content=h_msg["content"]))
        elif h_msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=h_msg["content"]))
    lc_messages.append(HumanMessage(content=question))

    llm = _get_llm(effective_model, requested_host, temperature=req.temperature)

    async def sse_generator():
        global _query_count, _total_latency
        start_time = time.time()
        
        # 1. Send initial citations
        yield f"event: citations\ndata: {json.dumps({'citations': citations})}\n\n"
        
        # 2. Stream tokens from LLM
        accumulated_chunks = []
        try:
            async for chunk in llm.astream(lc_messages):
                tok = chunk.content if hasattr(chunk, "content") else str(chunk)
                if tok:
                    accumulated_chunks.append(tok)
                    yield f"event: token\ndata: {json.dumps({'token': tok})}\n\n"
        except Exception as err:
            try:
                res = await asyncio.to_thread(llm.invoke, lc_messages)
                tok = res.content if hasattr(res, "content") else str(res)
                accumulated_chunks.append(tok)
                yield f"event: token\ndata: {json.dumps({'token': tok})}\n\n"
            except Exception as e2:
                yield f"event: error\ndata: {json.dumps({'error': str(e2)})}\n\n"
                return

        raw_answer = "".join(accumulated_chunks)
        latency_sec = time.time() - start_time
        _query_count += 1
        _total_latency += latency_sec

        # Rehydrate placeholder tokens back to real names
        rehydrated_answer = rehydrate_text(raw_answer, mapping) if (is_redacted and mapping) else raw_answer

        # Output safety check
        blocked_out = check_output_safety(rehydrated_answer, req.sensitivity_level, req.enable_guardrails, custom_rules=req.custom_rules)
        if blocked_out:
            final_answer = blocked_out
            yield f"event: blocked_output\ndata: {json.dumps({'answer': final_answer, 'blocked': True})}\n\n"
            session["messages"].append({"role": "user", "content": req.question})
            session["messages"].append({
                "role": "assistant",
                "content": final_answer,
                "blocked": True,
                "citations": [],
                "latency_sec": latency_sec
            })
            _update_db_session(session)
            add_audit_log("safety_alert", f"LLM output blocked and redacted under {req.sensitivity_level} policy.")
        else:
            final_answer = rehydrated_answer
            session["messages"].append({"role": "user", "content": req.question})
            session["messages"].append({
                "role": "assistant",
                "content": final_answer,
                "blocked": False,
                "citations": citations,
                "latency_sec": latency_sec
            })
            _update_db_session(session)
            if client_sess:
                db.touch_client_session(req.session_id)
            add_audit_log("retrieval", f"Successfully completed streaming RAG query in {latency_sec:.3f}s", {
                "latency_sec": latency_sec,
                "citations_count": len(citations),
                "question": req.question
            })

        yield f"event: end\ndata: {json.dumps({'answer': final_answer, 'citations': citations, 'latency_sec': latency_sec, 'done': True})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@app.post("/api/chat")
async def chat(req: ChatRequest):
    actual_session_id = req.session_id
    is_read_only = False
    min_confidence = req.min_confidence or 0.0
    
    # Check if this is a direct share link token
    share_link = db.get_share_link(req.session_id)
    if share_link:
        if share_link.get("sync"):
            actual_session_id = share_link["parent_session_id"]
        is_read_only = share_link.get("read_only", False)
        if share_link.get("min_confidence"):
            min_confidence = max(min_confidence, float(share_link.get("min_confidence", 0.0)))
    else:
        # Check if session_id is a registered client session
        client_sess = db.get_client_session(req.session_id)
        if client_sess:
            sl = db.get_share_link(client_sess["share_id"])
            if sl:
                is_read_only = sl.get("read_only", False)
                if sl.get("min_confidence"):
                    min_confidence = max(min_confidence, float(sl.get("min_confidence", 0.0)))
                if sl.get("sync"):
                    actual_session_id = sl["parent_session_id"]
        
    session = db.get_session(actual_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload documents first.")

    if is_read_only or session.get("read_only", False):
        raise HTTPException(status_code=403, detail="This session is read-only. You cannot send messages.")

    # Enforce host privacy controls: guests cannot change host privacy/guardrail levels
    if share_link:
        effective_sensitivity = share_link.get("sensitivity_level") or session.get("sensitivity_level", "Internal")
    elif client_sess:
        c_sl = db.get_share_link(client_sess["share_id"])
        effective_sensitivity = (c_sl.get("sensitivity_level") if c_sl else None) or session.get("sensitivity_level", "Internal")
    else:
        effective_sensitivity = req.sensitivity_level
        session["sensitivity_level"] = effective_sensitivity
        session["enable_guardrails"] = req.enable_guardrails
        if req.custom_rules:
            session["custom_rules"] = req.custom_rules
    req.sensitivity_level = effective_sensitivity

    # Fallback to session model or default if client sent empty string
    effective_model = req.model.strip() if req.model and req.model.strip() else session.get("model", "gemma3:1b")

    # Load rag_chain from LRU cache or rehydrate
    rag_chain = _rag_chains.get(actual_session_id)
    requested_host = req.resolved_host()
    
    if (not rag_chain or
        effective_model != session.get("model") or 
        requested_host != session.get("ollama_host", SERVER_OLLAMA_HOST) or 
        req.system_prompt != session.get("system_prompt", "")):
        try:
            rag_chain = await asyncio.to_thread(
                load_stored_rag_chain, session["db_id"], effective_model, requested_host, system_prompt=req.system_prompt
            )
            _rag_chains.put(actual_session_id, rag_chain)
            session["model"] = effective_model
            session["ollama_host"] = requested_host
            session["system_prompt"] = req.system_prompt
            _update_db_session(session)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load or dynamically switch RAG chain to model '{effective_model}': {str(e)}"
            ) from e

    # Input safety on the original question
    blocked = check_input_safety(req.question, req.sensitivity_level, req.enable_guardrails, custom_rules=req.custom_rules)
    if blocked:
        add_audit_log("safety_alert", f"Input question blocked by {req.sensitivity_level} policy.", {"question": req.question})
        return {"answer": blocked, "blocked": True, "source": "input_guard", "citations": [], "latency_sec": 0.0}

    # Load session mapping if redact_pii is active
    mapping = {}
    is_redacted = session.get("redact_pii", False)
    db_id = session.get("db_id")
    if is_redacted and db_id:
        mapping_path = FAISS_STORAGE / db_id / "mapping.json"
        if mapping_path.exists():
            try:
                mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
            except Exception:
                pass

    # Map user question to tokens to align with redacted database splits
    question = req.question
    if is_redacted:
        from guardrag.utils.redactor import redact_and_map
        question, updated_map = redact_and_map(question, redact_names=True, existing_map=mapping)
        if len(updated_map) > len(mapping):
            mapping = updated_map
            # Save updated mapping back to disk
            if db_id:
                mapping_path = FAISS_STORAGE / db_id / "mapping.json"
                try:
                    mapping_path.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
                except Exception:
                    pass
        add_audit_log("redaction", f"Redacted user query before LLM processing.")

    # Build chat history using redacted inputs/outputs from session
    history = []
    for msg in session["messages"]:
        if msg["role"] == "user":
            history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            history.append(AIMessage(content=msg["content"]))

    start_time = time.time()
    try:
        result = await asyncio.to_thread(
            rag_chain.invoke, {"input": question, "chat_history": history}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}") from e
    latency_sec = time.time() - start_time

    if isinstance(result, dict) and "answer" in result:
        answer = result["answer"]
    elif isinstance(result, str):
        answer = result
    else:
        answer = str(result)

    # Rehydrate placeholder tokens back to real names for final output
    rehydrated_answer = rehydrate_text(answer, mapping) if (is_redacted and mapping) else answer

    # Output safety check on rehydrated answer
    blocked_out = check_output_safety(rehydrated_answer, req.sensitivity_level, req.enable_guardrails, custom_rules=req.custom_rules)
    if blocked_out:
        answer = blocked_out
        session["messages"].append({"role": "user", "content": req.question})
        session["messages"].append({
            "role": "assistant",
            "content": answer,
            "blocked": True,
            "citations": [],
            "latency_sec": latency_sec
        })
        _update_db_session(session)
        add_audit_log("safety_alert", f"LLM output blocked and redacted under {req.sensitivity_level} policy.")
        return {"answer": answer, "blocked": True, "source": "output_guard", "citations": [], "latency_sec": latency_sec}

    # Extract citations & calculate cosine similarity confidence scores
    citations = []
    if isinstance(result, dict) and "context" in result:
        context_docs = result["context"]
        try:
            import math
            from guardrag.rag.core import _get_embeddings
            embeddings = _get_embeddings()
            query_vector = embeddings.embed_query(question)
            doc_contents = [doc.page_content for doc in context_docs]
            if doc_contents:
                doc_vectors = embeddings.embed_documents(doc_contents)
                q_norm = math.sqrt(sum(x * x for x in query_vector)) or 1.0
                for doc, doc_vector in zip(context_docs, doc_vectors):
                    d_norm = math.sqrt(sum(x * x for x in doc_vector)) or 1.0
                    dot_prod = sum(q * d for q, d in zip(query_vector, doc_vector))
                    score_val = max(0.0, min(1.0, round(float(dot_prod / (q_norm * d_norm)), 4)))
                    if min_confidence > 0.0 and score_val < min_confidence:
                        # Skip context chunk below min_confidence threshold
                        continue

                    disp_content = rehydrate_text(doc.page_content, mapping) if (is_redacted and mapping) else doc.page_content
                    source_path = doc.metadata.get("source", "Unknown")
                    source_name = os.path.basename(source_path) if source_path else "Unknown"
                    citations.append({
                        "source": source_name,
                        "page": doc.metadata.get("page", 0) + 1 if "page" in doc.metadata else None,
                        "content": disp_content,
                        "score": score_val,
                    })
        except Exception as e:
            print(f"Error computing citation scores: {e}")
            for doc in context_docs:
                disp_content = rehydrate_text(doc.page_content, mapping) if (is_redacted and mapping) else doc.page_content
                source_path = doc.metadata.get("source", "Unknown")
                source_name = os.path.basename(source_path) if source_path else "Unknown"
                citations.append({
                    "source": source_name,
                    "page": doc.metadata.get("page", 0) + 1 if "page" in doc.metadata else None,
                    "content": disp_content,
                    "score": 0.0,
                })

    session["messages"].append({"role": "user", "content": req.question})
    session["messages"].append({
        "role": "assistant",
        "content": rehydrated_answer,
        "blocked": False,
        "citations": citations,
        "latency_sec": latency_sec
    })
    _update_db_session(session)
    if client_sess:
        db.touch_client_session(req.session_id)

    add_audit_log("retrieval", f"Successfully completed RAG query in {latency_sec:.3f}s", {
        "latency_sec": latency_sec,
        "citations_count": len(citations),
        "question": req.question
    })

    return {
        "answer": rehydrated_answer,
        "blocked": False,
        "source": "llm",
        "citations": citations,
        "latency_sec": latency_sec
    }


@app.post("/api/clear")
async def clear_chat(req: ClearRequest):
    session = db.get_session(req.session_id)
    if session:
        session["messages"] = []
        _update_db_session(session)
        add_audit_log("system", "Conversation cleared for session.", {"session_id": req.session_id})
    return {"cleared": True}


# ─────────────────────────────────────────────────────────────────────────────
# Dynamic Policies & Vector Store Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/policies")
async def get_policies():
    return load_policies()

@app.post("/api/policies")
async def update_policies(policies: dict):
    try:
        save_policies(policies)
        return {"success": True, "policies": policies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save policies: {str(e)}")

@app.get("/api/vector/config")
async def get_vector_config():
    from guardrag.rag.core import load_vector_settings
    return load_vector_settings()

@app.post("/api/vector/config")
async def update_vector_config(config: dict):
    try:
        storage_path = FAISS_STORAGE
        settings_file = storage_path / "vector_settings.json"
        settings_file.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")
        return {"success": True, "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save vector config: {str(e)}")

@app.post("/api/vector/test")
async def test_vector_connectivity(config: dict):
    store_type = config.get("type", "FAISS").upper()
    if store_type == "FAISS":
        return {"success": True, "message": "Local FAISS storage is always available."}
    
    host = config.get("host", "")
    if not host:
        raise HTTPException(status_code=400, detail="Host URL is required for remote vector stores.")
        
    if store_type == "QDRANT":
        try:
            from qdrant_client import QdrantClient
            client = QdrantClient(url=host, api_key=config.get("api_key"), timeout=3.0)
            client.get_collections()
            return {"success": True, "message": "Successfully connected to Qdrant server!"}
        except ImportError:
            raise HTTPException(
                status_code=400,
                detail="The 'qdrant-client' package is not installed on the server. Please run 'pip install qdrant-client'."
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Qdrant: {str(e)}")
            
    elif store_type == "CHROMA":
        try:
            import chromadb
            parsed = host.replace("http://", "").replace("https://", "").split(":")
            h = parsed[0]
            p = int(parsed[1]) if len(parsed) > 1 else 8000
            client = chromadb.HttpClient(host=h, port=p)
            client.heartbeat()
            return {"success": True, "message": "Successfully connected to Chroma server!"}
        except ImportError:
            raise HTTPException(
                status_code=400,
                detail="The 'chromadb' package is not installed on the server. Please run 'pip install chromadb'."
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Chroma: {str(e)}")
            
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported vector store type: {store_type}")

@app.get("/api/audit/logs")
async def get_audit_logs(limit: int = 200, offset: int = 0):
    return {"logs": db.get_audit_logs(limit=limit, offset=offset)}


import uuid

@app.get("/api/share/resolve/{share_id}")
async def resolve_share_link(
    share_id: str,
    request: Request,
    client_id: Optional[str] = Query(None)
):
    link = db.get_share_link(share_id)
    if not link:
        raise HTTPException(status_code=404, detail="Share link invalid or expired.")
    
    parent_session = db.get_session(link["parent_session_id"])
    if not parent_session:
        raise HTTPException(status_code=404, detail="Original session no longer exists.")

    # Determine client IP and User-Agent
    client_ip = "Unknown"
    if request.client and request.client.host:
        client_ip = request.client.host
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
        
    user_agent = request.headers.get("user-agent", "Unknown")
    messages = parent_session["messages"] if link["show_history"] else []

    shared_sensitivity = link.get("sensitivity_level") or parent_session.get("sensitivity_level", "Internal")

    if link["sync"]:
        client_session_id = client_id if (client_id and client_id.startswith("client_sync_")) else f"client_sync_{uuid.uuid4().hex[:8]}"
        db.register_client_session(client_session_id, share_id, link["parent_session_id"], client_ip, user_agent)
        return {
            "session_id": link["parent_session_id"],
            "client_session_id": client_session_id,
            "share_id": share_id,
            "parent_session_id": link["parent_session_id"],
            "db_id": parent_session["db_id"],
            "files": parent_session["files"],
            "model": parent_session["model"],
            "read_only": link["read_only"],
            "show_history": link["show_history"],
            "sync": True,
            "min_confidence": link["min_confidence"],
            "name": link["name"],
            "sensitivity_level": shared_sensitivity,
            "messages": parent_session["messages"]
        }
    else:
        # Isolated thread per client device
        existing_session = None
        if client_id:
            client_record = db.get_client_session(client_id)
            if client_record and client_record.get("share_id") == share_id:
                existing_session = db.get_session(client_id)

        if existing_session:
            client_session_id = client_id
            db.register_client_session(client_session_id, share_id, link["parent_session_id"], client_ip, user_agent)
            return {
                "session_id": client_session_id,
                "client_session_id": client_session_id,
                "share_id": share_id,
                "parent_session_id": link["parent_session_id"],
                "db_id": parent_session["db_id"],
                "files": parent_session["files"],
                "model": parent_session["model"],
                "read_only": link["read_only"],
                "show_history": link["show_history"],
                "sync": False,
                "min_confidence": link["min_confidence"],
                "name": link["name"],
                "sensitivity_level": shared_sensitivity,
                "messages": existing_session.get("messages", [])
            }

        # Create new dedicated client session
        client_session_id = f"client_{uuid.uuid4().hex[:12]}"
        db.save_session(
            session_id=client_session_id,
            db_id=parent_session["db_id"],
            model=parent_session["model"],
            files=parent_session["files"],
            chunk_size=parent_session["chunk_size"],
            redact_pii=parent_session["redact_pii"],
            system_prompt=parent_session["system_prompt"],
            sensitivity_level=shared_sensitivity,
            enable_guardrails=parent_session["enable_guardrails"],
            temperature=parent_session["temperature"],
            chunk_overlap=parent_session["chunk_overlap"],
            custom_rules=parent_session["custom_rules"],
            messages=messages,
            read_only=link["read_only"]
        )
        db.register_client_session(client_session_id, share_id, link["parent_session_id"], client_ip, user_agent)
        return {
            "session_id": client_session_id,
            "client_session_id": client_session_id,
            "share_id": share_id,
            "parent_session_id": link["parent_session_id"],
            "db_id": parent_session["db_id"],
            "files": parent_session["files"],
            "model": parent_session["model"],
            "read_only": link["read_only"],
            "show_history": link["show_history"],
            "sync": False,
            "min_confidence": link["min_confidence"],
            "name": link["name"],
            "sensitivity_level": shared_sensitivity,
            "messages": messages
        }


# ─────────────────────────────────────────────────────────────────────────────
# Static file serving (frontend) — must be registered AFTER all API endpoints
# ─────────────────────────────────────────────────────────────────────────────
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        requested = FRONTEND_DIR / full_path
        if requested.exists() and requested.is_file():
            return FileResponse(str(requested))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
