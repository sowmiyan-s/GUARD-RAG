"""
Core RAG pipeline for document processing and retrieval.
"""

import hashlib
import math
import os
import re
import time
import warnings
from collections import Counter
from pathlib import Path
from typing import Any, List, Optional

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_huggingface import HuggingFaceEmbeddings

with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=DeprecationWarning)
    try:
        from langchain_community.vectorstores import FAISS
    except ImportError:
        FAISS = None
from langchain_ollama import ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from langchain_classic.chains import (
        create_history_aware_retriever,
        create_retrieval_chain,
    )
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain
except ImportError:
    # Fallback for legacy LangChain (< 1.0) environments where chains lived under langchain.chains
    from langchain.chains import (  # type: ignore[import-not-found, no-redef]
        create_history_aware_retriever,
        create_retrieval_chain,
    )
    from langchain.chains.combine_documents import (  # type: ignore[import-not-found, no-redef]
        create_stuff_documents_chain,
    )
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Fix OMP error for FAISS (must be before FAISS import)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Proxy bypass
_NO_PROXY = "huggingface.co,*.huggingface.co,localhost,127.0.0.1"
os.environ.setdefault("NO_PROXY", _NO_PROXY)
os.environ.setdefault("no_proxy", _NO_PROXY)


_embeddings = None

def _get_embeddings(ollama_host: str = "http://localhost:11434", embedding_model: str = None):
    """Get embeddings model: FastEmbed (ONNX), native Ollama, or HuggingFace fallback."""
    global _embeddings
    provider = os.environ.get("GUARDRAG_EMBEDDING_PROVIDER", "fastembed").lower()
    
    if provider == "ollama" or embedding_model:
        try:
            from langchain_ollama import OllamaEmbeddings
            model_name = embedding_model or os.environ.get("GUARDRAG_EMBEDDING_MODEL", "nomic-embed-text")
            print(f"Using native Ollama embeddings ({model_name}) from {ollama_host}...")
            return OllamaEmbeddings(
                model=model_name,
                base_url=ollama_host.rstrip("/")
            )
        except Exception as e:
            print(f"Ollama embeddings notice: {e}. Falling back to local embeddings...")

    if _embeddings is None:
        try:
            from langchain_community.embeddings import FastEmbedEmbeddings
            # Avoid excessive threads which can thrash CPU and cause slow down in ONNX runtime on Windows
            threads = min(4, max(1, os.cpu_count() // 2)) if os.cpu_count() else None
            _embeddings = FastEmbedEmbeddings(
                model_name="BAAI/bge-small-en-v1.5",
                threads=threads
            )
            print("Using ONNX-accelerated FastEmbed embeddings (BAAI/bge-small-en-v1.5).")
        except Exception as fe_err:
            # Check if Ollama is running and can serve embeddings before trying PyTorch
            try:
                from guardrag.utils.ollama import is_ollama_running
                if is_ollama_running(ollama_host):
                    from langchain_ollama import OllamaEmbeddings
                    model_name = embedding_model or os.environ.get("GUARDRAG_EMBEDDING_MODEL", "nomic-embed-text")
                    print(f"Falling back to Ollama embeddings ({model_name}) from {ollama_host}...")
                    _embeddings = OllamaEmbeddings(
                        model=model_name,
                        base_url=ollama_host.rstrip("/")
                    )
                    return _embeddings
            except Exception:
                pass

            print(f"FastEmbed fallback notice: {fe_err}. Falling back to HuggingFace Embeddings...")
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else ("mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu")
                _embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={"device": device},
                    encode_kwargs={"normalize_embeddings": True, "batch_size": 128},
                )
            except Exception as e:
                raise RuntimeError(
                    f"Failed to initialize embeddings. To run fully offline without PyTorch, start Ollama and run 'ollama pull nomic-embed-text', or install FastEmbed / PyTorch. Details: {e}"
                ) from e
    return _embeddings


def _get_default_storage_dir() -> Path:
    try:
        from guardrag.api.db import get_data_dir
        return get_data_dir()
    except Exception:
        p = Path(".guardrag_storage")
        p.mkdir(parents=True, exist_ok=True)
        return p

def load_vector_settings(storage_dir: str = None) -> dict:
    storage_path = Path(storage_dir) if storage_dir else _get_default_storage_dir()
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
    system_prompt: str = None,
    temperature: float = 0.0
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
        temperature: Creativity level for the LLM
        
    Returns:
        Tuple of (db_id, rag_chain)
    """
    embeddings = _get_embeddings()
    storage_path = Path(storage_dir)
    storage_path.mkdir(exist_ok=True)
    
    # Resolve any directories into individual files
    resolved_file_paths = []
    for fp in file_paths:
        if os.path.isdir(fp):
            for root, _, files in os.walk(fp):
                for f in sorted(files):
                    resolved_file_paths.append(os.path.join(root, f))
        else:
            resolved_file_paths.append(fp)

    # Generate cache key based on file content and settings
    hasher = hashlib.md5()
    for fp in resolved_file_paths:
        if os.path.isfile(fp):
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
        for fp in resolved_file_paths:
            ext = os.path.splitext(fp)[-1].lower()
            try:
                loaded_docs = []
                if ext == ".pdf":
                    try:
                        import pypdf
                        reader = pypdf.PdfReader(fp)
                        for i, page in enumerate(reader.pages):
                            text = page.extract_text()
                            if text:
                                loaded_docs.append(Document(page_content=text, metadata={"page": i}))
                    except ImportError as err:
                        raise ImportError("The 'pypdf' package is required for PDF files. Run 'pip install pypdf'.") from err
                elif ext in [".txt", ".md", ".json", ".csv", ".log", ".py"]:
                    with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                        loaded_docs.append(Document(page_content=f.read(), metadata={}))
                elif ext in [".doc", ".docx"]:
                    try:
                        import docx2txt
                        text = docx2txt.process(fp)
                        if text:
                            loaded_docs.append(Document(page_content=text, metadata={}))
                    except ImportError as err:
                        raise ImportError("The 'docx2txt' package is required for DOCX files. Run 'pip install docx2txt'.") from err
                elif ext in [".xlsx", ".xls"]:
                    try:
                        import openpyxl
                        wb = openpyxl.load_workbook(fp, data_only=True)
                        for sheet_name in wb.sheetnames:
                            sheet = wb[sheet_name]
                            sheet_rows = []
                            for row in sheet.iter_rows(values_only=True):
                                if any(cell is not None for cell in row):
                                    row_str = " | ".join(str(cell) for cell in row if cell is not None)
                                    sheet_rows.append(row_str)
                            if sheet_rows:
                                content = f"Sheet: {sheet_name}\n" + "\n".join(sheet_rows)
                                loaded_docs.append(Document(page_content=content, metadata={"sheet": sheet_name}))
                    except ImportError as err:
                        raise ImportError("The 'openpyxl' package is required for Excel files. Run 'pip install openpyxl'.") from err
                elif ext == ".pptx":
                    try:
                        import pptx
                        prs = pptx.Presentation(fp)
                        for slide_idx, slide in enumerate(prs.slides):
                            slide_texts = []
                            for shape in slide.shapes:
                                if hasattr(shape, "text") and shape.text:
                                    slide_texts.append(shape.text.strip())
                            if slide_texts:
                                content = f"Slide {slide_idx + 1}:\n" + "\n".join(slide_texts)
                                loaded_docs.append(Document(page_content=content, metadata={"page": slide_idx + 1}))
                    except ImportError as err:
                        raise ImportError("The 'python-pptx' package is required for PPTX files. Run 'pip install python-pptx'.") from err
                elif ext in [".html", ".htm"]:
                    try:
                        from bs4 import BeautifulSoup
                        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                            soup = BeautifulSoup(f.read(), "html.parser")
                            for s in soup(["script", "style", "nav", "footer"]):
                                s.decompose()
                            title = soup.title.string.strip() if soup.title and soup.title.string else ""
                            body_text = soup.get_text(separator="\n").strip()
                            if body_text:
                                content = (f"Title: {title}\n" if title else "") + body_text
                                loaded_docs.append(Document(page_content=content, metadata={"title": title}))
                    except Exception:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                            loaded_docs.append(Document(page_content=f.read(), metadata={}))
                else:
                    print(f"Skipping unsupported file type: {ext}")
                    continue
                
                print(f"  {os.path.basename(fp)}")
                for d in loaded_docs:
                    d.metadata["source"] = os.path.basename(fp)
                docs.extend(loaded_docs)
            except Exception as e:
                print(f"  Error loading {os.path.basename(fp)}: {e}")
                # Re-raise to be caught by the outer build_rag_chain caller if critical
                raise e
        
        if not docs:
            raise ValueError("No documents were successfully loaded.")
        
        # Sanitize against adversarial indirect prompt injections
        from guardrag.utils.safety import sanitize_document_content
        for doc in docs:
            doc.page_content = sanitize_document_content(doc.page_content)

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
        batch_size = 500
        for i in range(0, len(splits), batch_size):
            batch = splits[i : i + batch_size]
            vectorstore.add_documents(batch)
        
        # Save token mapping dictionary to disk (always stored locally under storage_dir/db_id)
        import json
        mapping_path = Path(storage_path) / db_id / "mapping.json"
        mapping_path.parent.mkdir(exist_ok=True, parents=True)
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2, ensure_ascii=False)
        print(f"Saved token mapping dictionary to {mapping_path}")
    
    # Build RAG chain with hybrid ranking if document chunks available
    bm25_idx = BM25Index(splits) if (not is_cached and 'splits' in locals()) else None
    rag_chain = _build_chain_from_vectorstore(
        vectorstore,
        model,
        ollama_host,
        system_prompt=system_prompt,
        temperature=temperature,
        bm25_index=bm25_idx
    )
    
    print("RAG chain ready!")
    return db_id, rag_chain


def _get_llm(model: str, ollama_host: str, temperature: float = 0.0):
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
            temperature=temperature
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
            temperature=temperature,
            headers=headers
        )


class BM25Index:
    """Pure-Python offline Okapi BM25 keyword index for exact matching and hybrid retrieval."""
    def __init__(self, documents: List[Document], k1: float = 1.5, b: float = 0.75):
        self.documents = documents
        self.k1 = k1
        self.b = b
        self.corpus_size = len(documents)
        self.doc_lens = [len(self._tokenize(d.page_content)) for d in documents]
        self.avg_doc_len = sum(self.doc_lens) / (self.corpus_size or 1)
        self.doc_freqs = Counter()
        self.doc_term_freqs = []
        for d in documents:
            tf = Counter(self._tokenize(d.page_content))
            self.doc_term_freqs.append(tf)
            for tok in tf:
                self.doc_freqs[tok] += 1

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r'\w+', text.lower())

    def search(self, query: str, top_k: int = 5) -> List[Document]:
        if not self.corpus_size:
            return []
        tokens = self._tokenize(query)
        scores = [0.0] * self.corpus_size
        for tok in tokens:
            df = self.doc_freqs.get(tok, 0)
            if not df:
                continue
            idf = math.log((self.corpus_size - df + 0.5) / (df + 0.5) + 1.0)
            for i in range(self.corpus_size):
                tf = self.doc_term_freqs[i].get(tok, 0)
                if tf:
                    denom = tf + self.k1 * (1 - self.b + self.b * (self.doc_lens[i] / (self.avg_doc_len or 1)))
                    scores[i] += idf * (tf * (self.k1 + 1)) / denom
        ranked = sorted(range(self.corpus_size), key=lambda i: scores[i], reverse=True)[:top_k]
        return [self.documents[i] for i in ranked if scores[i] > 0]


class HybridRetriever(BaseRetriever):
    """Combines Dense Vector similarity search with BM25 keyword search via Reciprocal Rank Fusion (RRF).
    Inherits from BaseRetriever to be fully compatible with LangChain LCEL pipelines and history-aware chains.
    """
    dense_retriever: Any = None
    bm25_index: Optional[Any] = None
    k: int = 4
    rrf_k: int = 60

    def __init__(
        self,
        vectorstore_or_retriever: Any = None,
        bm25_index: Optional[BM25Index] = None,
        k: int = 4,
        rrf_k: int = 60,
        **kwargs
    ):
        if "dense_retriever" in kwargs:
            dense_retriever = kwargs.pop("dense_retriever")
        elif vectorstore_or_retriever is not None and hasattr(vectorstore_or_retriever, "as_retriever"):
            dense_retriever = vectorstore_or_retriever.as_retriever(search_kwargs={"k": k * 2})
        else:
            dense_retriever = vectorstore_or_retriever

        super().__init__(
            dense_retriever=dense_retriever,
            bm25_index=bm25_index,
            k=k,
            rrf_k=rrf_k,
            **kwargs
        )

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[CallbackManagerForRetrieverRun] = None
    ) -> List[Document]:
        dense_docs = self.dense_retriever.invoke(query) if (self.dense_retriever and hasattr(self.dense_retriever, "invoke")) else []
        if not self.bm25_index:
            return dense_docs[:self.k]
            
        bm25_docs = self.bm25_index.search(query, top_k=self.k * 2)
        if not bm25_docs:
            return dense_docs[:self.k]
            
        rrf_scores = {}
        doc_map = {}
        
        for rank, doc in enumerate(dense_docs):
            key = doc.page_content.strip()
            doc_map[key] = doc
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (self.rrf_k + rank + 1))
            
        for rank, doc in enumerate(bm25_docs):
            key = doc.page_content.strip()
            doc_map[key] = doc
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (self.rrf_k + rank + 1))
            
        sorted_keys = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        return [doc_map[k] for k in sorted_keys[:self.k]]


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


def _build_chain_from_vectorstore(
    vectorstore,
    model: str,
    ollama_host: str,
    system_prompt: str = None,
    temperature: float = 0.0,
    bm25_index: Optional[BM25Index] = None
):
    """Build a LangChain RAG chain from a vectorstore with optional BM25 hybrid ranking."""
    # Adjust context size (k) based on whether we are using a local or cloud LLM
    # to avoid context window overflow on small local models.
    host_lower = ollama_host.lower()
    is_cloud = any(x in host_lower for x in ["api.openai.com", "api.groq.com", "openrouter.ai", "api.anthropic.com", "api.cohere.ai"]) or \
               any(x in model.lower() for x in ["gpt-", "claude-", "gemini-", "command-r", "meta-llama"])
    
    k = 8 if is_cloud else 4
    if bm25_index:
        retriever = HybridRetriever(vectorstore, bm25_index=bm25_index, k=k)
    else:
        retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    
    llm = _get_llm(model, ollama_host, temperature=temperature)
    
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
            "You are GuardRAG, an intelligent, multilingual, and creative agentic document assistant.\n"
            "Your task is to answer the user's query using ONLY the provided document context below.\n"
            "Strictly follow these rules:\n"
            "1. Ground your answer solely in the provided context chunks. Do NOT assume, extrapolate, or bring in outside knowledge.\n"
            "2. If the context does not contain the answer, state clearly and politely that the information is missing from the uploaded documents.\n"
            "3. If different documents or chunks provide contradictory information, point out the discrepancy with their source names.\n"
            "4. IMPORTANT: Always respond in the SAME language the user asks the question in, actively translating context if necessary.\n"
            "5. Be creative in formatting your answer (use markdown, lists, tables, and emojis where appropriate) to make it highly readable and logically structured."
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
    system_prompt: str = None,
    temperature: float = 0.0
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
    return _build_chain_from_vectorstore(vectorstore, model, ollama_host, system_prompt=system_prompt, temperature=temperature)
