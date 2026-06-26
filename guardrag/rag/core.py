"""
Core RAG pipeline for document processing and retrieval.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Any

from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from langchain.chains import create_history_aware_retriever, create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
except ImportError:
    # Handle future versions (1.0+) where chains moved to langchain_classic
    from langchain_classic.chains import (
        create_history_aware_retriever,
        create_retrieval_chain,
    )
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Fix OMP error for FAISS (must be before FAISS import)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Proxy bypass
_NO_PROXY = "huggingface.co,*.huggingface.co,localhost,127.0.0.1"
os.environ.setdefault("NO_PROXY", _NO_PROXY)
os.environ.setdefault("no_proxy", _NO_PROXY)


_embeddings = None

def _get_embeddings():
    """Get HuggingFace embeddings model (cached)."""
    global _embeddings
    if _embeddings is None:
        try:
            _embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        except Exception as e:
            raise RuntimeError(
                f"Failed to initialize HuggingFace embeddings. "
                f"Ensure 'sentence-transformers', 'torch', and 'transformers' are installed correctly. "
                f"Error: {str(e)}"
            ) from e
    return _embeddings


def load_vector_settings() -> dict:
    storage_path = Path(".guardrag_storage")
    settings_file = storage_path / "vector_settings.json"
    if settings_file.exists():
        try:
            import json
            return json.loads(settings_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"type": "FAISS", "persist_directory": None}


def is_db_registered(db_id: str, storage_dir: str) -> bool:
    meta_file = Path(storage_dir) / "_meta.json"
    if meta_file.exists():
        try:
            import json
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            return db_id in meta
        except Exception:
            pass
    return False


def build_rag_chain(
    file_paths: list[str],
    model: str = "gemma3:1b",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    ollama_host: str = "http://localhost:11434",
    storage_dir: str = ".guardrag_storage",
    redact_pii: bool = False,
    manual_redactions: list[str] = None,
    system_prompt: str = None
) -> tuple[str, Any]:
    """
    Build a RAG chain from document files.
    
    Args:
        file_paths: List of paths to documents (PDF, TXT, DOCX)
        model: Ollama model name
        chunk_size: Text chunk size for splitting
        chunk_overlap: Overlap between chunks
        ollama_host: Ollama server URL
        storage_dir: Directory to store FAISS indices
        redact_pii: Whether to redact sensitive details (PII) from document text
        
    Returns:
        Tuple of (db_id, rag_chain)
    """
    embeddings = _get_embeddings()
    storage_path = Path(storage_dir)
    storage_path.mkdir(exist_ok=True)
    
    # Generate cache key based on file content and settings
    hasher = hashlib.md5()
    for fp in file_paths:
        with open(fp, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hasher.update(chunk)
    redact_suffix = "_Redacted" if redact_pii else "_Raw"
    db_id = f"{hasher.hexdigest()}_{chunk_size}_{chunk_overlap}{redact_suffix}_Offline"
    persist_dir = str(storage_path / db_id)
    
    # Load pluggable configuration
    config = load_vector_settings()
    is_faiss = config.get("type", "FAISS").upper() == "FAISS"
    if is_faiss:
        config["persist_directory"] = persist_dir
        is_cached = os.path.exists(persist_dir) and os.path.exists(os.path.join(persist_dir, "index.faiss"))
    else:
        config["collection_name"] = db_id
        is_cached = is_db_registered(db_id, storage_dir)
        
    # Load from cache if available
    if is_cached:
        print(f"Loading cached embeddings for {db_id}...")
        from guardrag.rag.vector_factory import get_vector_store
        vectorstore = get_vector_store(config, embeddings)
    else:
        print("Loading documents...")
        docs = []
        for fp in file_paths:
            ext = os.path.splitext(fp)[-1].lower()
            try:
                if ext == ".pdf":
                    try:
                        import pypdf
                    except ImportError as err:
                        raise ImportError("The 'pypdf' package is required for PDF files. Run 'pip install pypdf'.") from err
                    loader = PyPDFLoader(fp)
                elif ext == ".txt":
                    loader = TextLoader(fp, encoding="utf-8")
                elif ext in [".doc", ".docx"]:
                    try:
                        import docx2txt
                    except ImportError as err:
                        raise ImportError("The 'docx2txt' package is required for DOCX files. Run 'pip install docx2txt'.") from err
                    loader = Docx2txtLoader(fp)
                else:
                    print(f"Skipping unsupported file type: {ext}")
                    continue
                
                print(f"  {os.path.basename(fp)}")
                loaded_docs = loader.load()
                for d in loaded_docs:
                    d.metadata["source"] = os.path.basename(fp)
                docs.extend(loaded_docs)
            except Exception as e:
                print(f"  Error loading {os.path.basename(fp)}: {e}")
                # Re-raise to be caught by the outer build_rag_chain caller if critical
                raise e
        
        if not docs:
            raise ValueError("No documents were successfully loaded.")
        
        print(f"Splitting {len(docs)} documents into chunks...")
        mapping = {}
        if redact_pii:
            from guardrag.utils.redactor import redact_and_map
            print("Applying context-aware PII token mapping to document contents...")
            for doc in docs:
                doc.page_content, mapping = redact_and_map(doc.page_content, redact_names=True, existing_map=mapping)
        if manual_redactions:
            import re
            print(f"Applying custom manual redactions to document contents...")
            for doc in docs:
                for word in manual_redactions:
                    if not word:
                        continue
                    pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
                    doc.page_content = pattern.sub("[MANUAL_REDACTED]", doc.page_content)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        splits = splitter.split_documents(docs)
        
        if not splits:
            raise ValueError("No text could be extracted from the uploaded documents.")

        print(f"Creating embeddings for {len(splits)} chunks...")
        from guardrag.rag.vector_factory import get_vector_store
        vectorstore = get_vector_store(config, embeddings)
        for i in range(0, len(splits), 100):
            batch = splits[i : i + 100]
            vectorstore.add_documents(batch)
        
        # Save token mapping dictionary to disk (always stored locally under storage_dir/db_id)
        import json
        mapping_path = Path(storage_path) / db_id / "mapping.json"
        mapping_path.parent.mkdir(exist_ok=True, parents=True)
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2, ensure_ascii=False)
        print(f"Saved token mapping dictionary to {mapping_path}")
    
    # Build RAG chain
    rag_chain = _build_chain_from_vectorstore(vectorstore, model, ollama_host, system_prompt=system_prompt)
    
    print("RAG chain ready!")
    return db_id, rag_chain


def _get_llm(model: str, ollama_host: str):
    """Initialize the LLM based on ollama_host (supports Ollama and OpenAI-compatible endpoints)."""
    host_lower = ollama_host.lower()
    is_openai_style = any(x in host_lower for x in ["api.openai.com", "api.groq.com", "openrouter.ai", "api.anthropic.com", "api.cohere.ai"])
    is_cloud_model = any(x in model.lower() for x in ["gpt-", "claude-", "gemini-", "command-r", "meta-llama"])
    
    if is_openai_style or is_cloud_model:
        from langchain_openai import ChatOpenAI
        api_base = ollama_host.rstrip("/")
        if not api_base.endswith("/v1") and "localhost" not in api_base and "127.0.0.1" not in api_base:
            if "groq" in api_base:
                api_base = api_base + "/openai/v1"
            else:
                api_base = api_base + "/v1"
                
        api_key = os.environ.get("OLLAMA_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if "groq" in host_lower:
            api_key = os.environ.get("GROQ_API_KEY") or api_key
        elif "openrouter" in host_lower:
            api_key = os.environ.get("OPENROUTER_API_KEY") or api_key
            
        return ChatOpenAI(
            model=model,
            openai_api_base=api_base,
            openai_api_key=api_key,
            temperature=0.0
        )
    else:
        headers = {}
        api_key = os.environ.get("OLLAMA_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            
        return ChatOllama(
            model=model,
            base_url=ollama_host.rstrip("/"),
            num_ctx=4096,
            headers=headers
        )


class GuardRAGChain:
    """A custom LangChain-compatible RAG chain wrapper that optimizes retrieval.
    It bypasses the query reformulation step when the chat history is empty,
    which saves a slow LLM call and prevents the model from distorting the initial question.
    """
    def __init__(self, history_retriever, qa_chain, retriever):
        self.history_retriever = history_retriever
        self.qa_chain = qa_chain
        self.retriever = retriever

    def invoke(self, inputs: dict) -> dict:
        input_query = inputs["input"]
        chat_history = inputs.get("chat_history", [])
        
        if not chat_history:
            # Bypass history-aware retrieval entirely on empty history
            docs = self.retriever.invoke(input_query)
            res = self.qa_chain.invoke({
                "input": input_query, 
                "chat_history": chat_history, 
                "context": docs
            })
            answer = res if isinstance(res, str) else res.get("answer", str(res))
            return {
                "input": input_query, 
                "chat_history": chat_history, 
                "context": docs, 
                "answer": answer
            }
        else:
            # Run normal history-aware retrieval
            docs = self.history_retriever.invoke({
                "input": input_query, 
                "chat_history": chat_history
            })
            res = self.qa_chain.invoke({
                "input": input_query, 
                "chat_history": chat_history, 
                "context": docs
            })
            answer = res if isinstance(res, str) else res.get("answer", str(res))
            return {
                "input": input_query, 
                "chat_history": chat_history, 
                "context": docs, 
                "answer": answer
            }


def _build_chain_from_vectorstore(vectorstore, model: str, ollama_host: str, system_prompt: str = None):
    """Build a LangChain RAG chain from a FAISS vectorstore."""
    # Adjust context size (k) based on whether we are using a local or cloud LLM
    # to avoid context window overflow on small local models.
    host_lower = ollama_host.lower()
    is_cloud = any(x in host_lower for x in ["api.openai.com", "api.groq.com", "openrouter.ai", "api.anthropic.com", "api.cohere.ai"]) or \
               any(x in model.lower() for x in ["gpt-", "claude-", "gemini-", "command-r", "meta-llama"])
    
    k = 8 if is_cloud else 4
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    
    llm = _get_llm(model, ollama_host)
    
    # History-aware retriever
    ctx_q_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Given a chat history and the latest user question which might reference "
         "context in the chat history, formulate a standalone question which can be "
         "understood without the chat history. Do NOT answer the question, just "
         "reformulate it if needed and otherwise return it as is."),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    history_retriever = create_history_aware_retriever(llm, retriever, ctx_q_prompt)
    from langchain_core.prompts import PromptTemplate

    if not system_prompt:
        system_prompt = (
            "You are GuardRAG, a professional and extremely precise AI document assistant.\n"
            "Your task is to answer the user's query using ONLY the provided document context below.\n"
            "Strictly follow these rules:\n"
            "1. Ground your answer solely in the provided context chunks. Do NOT assume, extrapolate, or bring in outside knowledge.\n"
            "2. If the context does not contain the answer, or if the retrieved information is not relevant to the query, state clearly and politely that the information is missing from the uploaded documents.\n"
            "3. If different documents or chunks provide contradictory information, point out the discrepancy with their source names.\n"
            "4. Keep your response clear, factual, and concise."
        )

    # Q&A chain
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt + "\n\nContext:\n{context}"),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    document_prompt = PromptTemplate(
        input_variables=["page_content", "source"],
        template="[Source Document: {source}]\n{page_content}"
    )
    qa_chain = create_stuff_documents_chain(llm, qa_prompt, document_prompt=document_prompt)
    
    return GuardRAGChain(history_retriever, qa_chain, retriever)


def get_stored_vectorstore(db_id: str, storage_dir: str = ".guardrag_storage"):
    """Load a previously persisted vectorstore index."""
    embeddings = _get_embeddings()
    config = load_vector_settings()
    is_faiss = config.get("type", "FAISS").upper() == "FAISS"
    
    if is_faiss:
        persist_dir = Path(storage_dir) / db_id
        if not persist_dir.exists():
            raise FileNotFoundError(f"No stored index for db_id: {db_id}")
        config["persist_directory"] = str(persist_dir)
    else:
        config["collection_name"] = db_id
        
    from guardrag.rag.vector_factory import get_vector_store
    return get_vector_store(config, embeddings)


def load_stored_rag_chain(
    db_id: str,
    model: str = "gemma3:1b",
    ollama_host: str = "http://localhost:11434",
    storage_dir: str = ".guardrag_storage",
    system_prompt: str = None
):
    """
    Load a previously persisted FAISS index and build the RAG chain.
    
    Args:
        db_id: The database/index ID
        model: Ollama model name
        ollama_host: Ollama server URL
        storage_dir: Directory where FAISS indices are stored
        system_prompt: Custom system prompt to override default instruction
        
    Returns:
        The RAG chain
    """
    vectorstore = get_stored_vectorstore(db_id, storage_dir=storage_dir)
    return _build_chain_from_vectorstore(vectorstore, model, ollama_host, system_prompt=system_prompt)
