"""
Core RAG pipeline for document processing and retrieval.
"""

import os
import time
import hashlib
from pathlib import Path
from typing import Tuple, Dict, Any, List

from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
try:
    from langchain.chains import create_retrieval_chain, create_history_aware_retriever
    from langchain.chains.combine_documents import create_stuff_documents_chain
except ImportError:
    # Handle future versions (1.0+) where chains moved to langchain_classic
    from langchain_classic.chains import create_retrieval_chain, create_history_aware_retriever
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Fix OMP error for FAISS (must be before FAISS import)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Proxy bypass
_NO_PROXY = "huggingface.co,*.huggingface.co,localhost,127.0.0.1"
os.environ.setdefault("NO_PROXY", _NO_PROXY)
os.environ.setdefault("no_proxy", _NO_PROXY)


def _get_embeddings():
    """Get HuggingFace embeddings model."""
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def build_rag_chain(
    file_paths: List[str],
    model: str = "gemma3:1b",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    ollama_host: str = "http://localhost:11434",
    storage_dir: str = ".guardrag_storage"
) -> Tuple[str, Any]:
    """
    Build a RAG chain from document files.
    
    Args:
        file_paths: List of paths to documents (PDF, TXT, DOCX)
        model: Ollama model name
        chunk_size: Text chunk size for splitting
        chunk_overlap: Overlap between chunks
        ollama_host: Ollama server URL
        storage_dir: Directory to store FAISS indices
        
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
    db_id = f"{hasher.hexdigest()}_{chunk_size}_{chunk_overlap}_Offline"
    persist_dir = str(storage_path / db_id)
    
    # Load from cache if available
    if os.path.exists(persist_dir):
        print(f"Loading cached embeddings from {persist_dir}...")
        vectorstore = FAISS.load_local(
            persist_dir,
            embeddings,
            allow_dangerous_deserialization=True
        )
    else:
        print("Loading documents...")
        docs = []
        for fp in file_paths:
            ext = os.path.splitext(fp)[-1].lower()
            if ext == ".pdf":
                loader = PyPDFLoader(fp)
            elif ext == ".txt":
                loader = TextLoader(fp, encoding="utf-8")
            elif ext in [".doc", ".docx"]:
                loader = Docx2txtLoader(fp)
            else:
                print(f"Skipping unsupported file type: {ext}")
                continue
            print(f"  {os.path.basename(fp)}")
            docs.extend(loader.load())
        
        print(f"Splitting {len(docs)} documents into chunks...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        splits = splitter.split_documents(docs)
        
        print(f"Creating embeddings for {len(splits)} chunks...")
        vectorstore = None
        for i in range(0, len(splits), 8):
            batch = splits[i : i + 8]
            if vectorstore is None:
                vectorstore = FAISS.from_documents(documents=batch, embedding=embeddings)
            else:
                vectorstore.add_documents(documents=batch)
            time.sleep(0.05)
        
        print(f"Saving FAISS index to {persist_dir}...")
        vectorstore.save_local(persist_dir)
    
    # Build RAG chain
    rag_chain = _build_chain_from_vectorstore(vectorstore, model, ollama_host)
    
    print("RAG chain ready!")
    return db_id, rag_chain


def _build_chain_from_vectorstore(vectorstore, model: str, ollama_host: str):
    """Build a LangChain RAG chain from a FAISS vectorstore."""
    retriever = vectorstore.as_retriever()
    llm = ChatOllama(model=model, base_url=ollama_host.rstrip("/"))
    
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
    
    # Q&A chain
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are an assistant for question-answering tasks. "
         "Use the following pieces of retrieved context to answer the question. "
         "If you don't know the answer, say that you don't know. "
         "Keep the answer as concise as possible based on the context.\n\n"
         "Context:\n{context}"),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    qa_chain = create_stuff_documents_chain(llm, qa_prompt)
    
    return create_retrieval_chain(history_retriever, qa_chain)


def load_stored_rag_chain(
    db_id: str,
    model: str = "gemma3:1b",
    ollama_host: str = "http://localhost:11434",
    storage_dir: str = ".guardrag_storage"
):
    """
    Load a previously persisted FAISS index and build the RAG chain.
    
    Args:
        db_id: The database/index ID
        model: Ollama model name
        ollama_host: Ollama server URL
        storage_dir: Directory where FAISS indices are stored
        
    Returns:
        The RAG chain
    """
    persist_dir = Path(storage_dir) / db_id
    if not persist_dir.exists():
        raise FileNotFoundError(f"No stored index for db_id: {db_id}")
    
    embeddings = _get_embeddings()
    vectorstore = FAISS.load_local(
        str(persist_dir),
        embeddings,
        allow_dangerous_deserialization=True
    )
    
    return _build_chain_from_vectorstore(vectorstore, model, ollama_host)
