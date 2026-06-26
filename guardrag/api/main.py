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

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel

# Internal imports
from guardrag.rag.core import (
    build_rag_chain,
    load_stored_rag_chain,
)
from guardrag.utils.ollama import (
    get_installed_models,
    get_ollama_version,
    is_ollama_running,
    start_ollama_server,
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
    _API_VERSION = "1.2.6"

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
FAISS_STORAGE = Path.cwd() / ".guardrag_storage"
FAISS_STORAGE.mkdir(exist_ok=True)

# Meta file that maps db_id → human-readable info (file names, date, model)
FAISS_META_FILE = FAISS_STORAGE / "_meta.json"

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
# In-memory session store (single-user; extend with Redis for multi-user)
# ─────────────────────────────────────────────────────────────────────────────
_sessions: dict = {}   # session_id → { rag_chain, messages, settings }


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

    def resolved_host(self) -> str:
        return (self.ollama_host or SERVER_OLLAMA_HOST).rstrip("/")

class ClearRequest(BaseModel):
    session_id: str

class LoadSessionRequest(BaseModel):
    db_id: str
    model: str = "gemma3:1b"
    ollama_host: str = ""
    system_prompt: Optional[str] = ""

    def resolved_host(self) -> str:
        return (self.ollama_host or SERVER_OLLAMA_HOST).rstrip("/")


# Ollama utilities are imported from guardrag.utils.ollama


# ─────────────────────────────────────────────────────────────────────────────
# Audit logging system
# ─────────────────────────────────────────────────────────────────────────────
_audit_logs = []

def add_audit_log(event_type: str, message: str, details: dict = None):
    log_entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event_type": event_type,
        "message": message,
        "details": details or {}
    }
    _audit_logs.append(log_entry)
    if len(_audit_logs) > 200:
        _audit_logs.pop(0)


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
    if await asyncio.to_thread(is_ollama_running, SERVER_OLLAMA_HOST):
        return {"started": True, "message": "Ollama is already running."}
    ok = await asyncio.to_thread(start_ollama_server)
    if ok:
        return {"started": True, "message": "Ollama started successfully."}
    raise HTTPException(
        status_code=503,
        detail="Failed to start Ollama. Verify it is installed and the OLLAMA_HOST is correct.",
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
    session = _sessions.get(req.session_id)
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
):
    # Use server-configured host if the client didn't supply one
    host = (ollama_host or SERVER_OLLAMA_HOST).rstrip("/")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    allowed_ext = {".pdf", ".txt", ".doc", ".docx"}
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
                build_rag_chain, temp_paths, model, chunk_size, chunk_overlap, host, redact_pii=redact_pii, manual_redactions=manual_list, system_prompt=system_prompt
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

        _sessions[h] = {
            "rag_chain": rag_chain,
            "messages": [],
            "model": model,
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "files": file_names,
            "db_id": db_id,
            "ollama_host": host,
            "redact_pii": redact_pii,
            "manual_redactions": manual_list,
            "system_prompt": system_prompt,
            "sensitivity_level": "Internal",
            "enable_guardrails": True,
        }

        await asyncio.to_thread(_register_faiss_entry, db_id, file_names, model, chunk_size, chunk_overlap, redact_pii, manual_list)
        add_audit_log("upload", f"Indexed {len(files)} file(s) into database {db_id}", {"model": model, "chunk_size": chunk_size, "redact_pii": redact_pii})
        return {"session_id": h, "db_id": db_id, "files": file_names, "model": model}

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
        rag_chain = await asyncio.to_thread(load_stored_rag_chain, req.db_id, req.model, host, system_prompt=req.system_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load index: {str(e)}") from e

    info = meta[req.db_id]
    h = hashlib.md5((req.db_id + req.model + host).encode()).hexdigest()[:16]

    _sessions[h] = {
        "rag_chain": rag_chain,
        "messages": [],
        "model": req.model,
        "chunk_size": info.get("chunk_size", 1000),
        "chunk_overlap": info.get("chunk_overlap", 200),
        "files": info.get("files", []),
        "db_id": req.db_id,
        "ollama_host": host,
        "redact_pii": info.get("redact_pii", False),
        "manual_redactions": info.get("manual_redactions", []),
        "system_prompt": req.system_prompt,
        "sensitivity_level": "Internal",
        "enable_guardrails": True,
    }

    return {
        "session_id": h,
        "db_id": req.db_id,
        "files": info.get("files", []),
        "model": req.model,
    }


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
    return {"deleted": True, "db_id": db_id}


@app.get("/api/sessions/info/{session_id}")
async def get_session_info(session_id: str):
    session = _sessions.get(session_id)
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
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload documents first.")

    session["sensitivity_level"] = req.sensitivity_level
    session["enable_guardrails"] = req.enable_guardrails
    if req.custom_rules:
        session["custom_rules"] = req.custom_rules

    # Dynamically switch model / host / system prompt if they changed in the UI
    requested_host = req.resolved_host()
    if (req.model != session.get("model") or 
        requested_host != session.get("ollama_host") or 
        req.system_prompt != session.get("system_prompt", "")):
        try:
            new_chain = await asyncio.to_thread(
                load_stored_rag_chain, session["db_id"], req.model, requested_host, system_prompt=req.system_prompt
            )
            session["rag_chain"] = new_chain
            session["model"] = req.model
            session["ollama_host"] = requested_host
            session["system_prompt"] = req.system_prompt
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to dynamically switch RAG chain to model '{req.model}': {str(e)}"
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
            session["rag_chain"].invoke, {"input": question, "chat_history": history}
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
        session["messages"].append({"role": "user", "content": question})
        session["messages"].append({"role": "assistant", "content": answer})
        add_audit_log("safety_alert", f"LLM output blocked and redacted under {req.sensitivity_level} policy.")
        return {"answer": answer, "blocked": True, "source": "output_guard", "citations": [], "latency_sec": latency_sec}

    # Extract citations & calculate similarity scores
    citations = []
    if isinstance(result, dict) and "context" in result:
        context_docs = result["context"]
        try:
            from guardrag.rag.core import _get_embeddings
            embeddings = _get_embeddings()
            query_vector = embeddings.embed_query(question)
            doc_contents = [doc.page_content for doc in context_docs]
            if doc_contents:
                doc_vectors = embeddings.embed_documents(doc_contents)
                for doc, doc_vector in zip(context_docs, doc_vectors):
                    score = sum(q * d for q, d in zip(query_vector, doc_vector))
                    disp_content = rehydrate_text(doc.page_content, mapping) if (is_redacted and mapping) else doc.page_content
                    source_path = doc.metadata.get("source", "Unknown")
                    source_name = os.path.basename(source_path) if source_path else "Unknown"
                    citations.append({
                        "source": source_name,
                        "page": doc.metadata.get("page", 0) + 1 if "page" in doc.metadata else None,
                        "content": disp_content,
                        "score": round(float(score), 4),
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

    session["messages"].append({"role": "user", "content": question})
    session["messages"].append({"role": "assistant", "content": answer})

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
    session = _sessions.get(req.session_id)
    if session:
        session["messages"] = []
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
async def get_audit_logs():
    return {"logs": _audit_logs}


# ─────────────────────────────────────────────────────────────────────────────
# Static file serving (frontend)
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
