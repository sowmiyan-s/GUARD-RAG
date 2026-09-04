"""
Pluggable Vector Store Factory for GuardRAG.
Supports Local FAISS (default), Qdrant, and Chroma databases.
"""

import os
from typing import List, Any, Dict, Optional
from pathlib import Path
from langchain_core.documents import Document

class BaseVectorStore:
    """Standard interface for pluggable vector stores in GuardRAG."""
    def add_documents(self, documents: List[Document]) -> None:
        raise NotImplementedError("Subclasses must implement add_documents")

    def similarity_search(self, query: str, k: int = 10) -> List[Document]:
        raise NotImplementedError("Subclasses must implement similarity_search")

    def as_retriever(self, search_kwargs: dict = None) -> Any:
        """Wrap the store in a LangChain-compatible retriever interface."""
        from langchain_core.retrievers import BaseRetriever
        from langchain_core.callbacks import CallbackManagerForRetrieverRun

        class CustomVectorStoreRetriever(BaseRetriever):
            vectorstore: Any
            k: int = 10

            def _get_relevant_documents(
                self, query: str, *, run_manager: CallbackManagerForRetrieverRun = None
            ) -> List[Document]:
                return self.vectorstore.similarity_search(query, k=self.k)

        k_val = search_kwargs.get("k", 10) if search_kwargs else 10
        return CustomVectorStoreRetriever(vectorstore=self, k=k_val)


class FAISSVectorStore(BaseVectorStore):
    """Local FAISS vector store wrapper."""
    def __init__(self, persist_dir: str, embeddings: Any):
        self.persist_dir = persist_dir
        self.embeddings = embeddings
        self.db = None
        if os.path.exists(persist_dir) and os.path.exists(os.path.join(persist_dir, "index.faiss")):
            try:
                from guardrag.rag.core import FAISS
            except (ImportError, AttributeError):
                from langchain_community.vectorstores import FAISS
            self.db = FAISS.load_local(
                persist_dir,
                embeddings,
                allow_dangerous_deserialization=True
            )

    def add_documents(self, documents: List[Document]) -> None:
        try:
            from guardrag.rag.core import FAISS
        except (ImportError, AttributeError):
            from langchain_community.vectorstores import FAISS
        if self.db is None:
            self.db = FAISS.from_documents(documents, self.embeddings)
        else:
            self.db.add_documents(documents)
        os.makedirs(self.persist_dir, exist_ok=True)
        self.db.save_local(self.persist_dir)

    def similarity_search(self, query: str, k: int = 10) -> List[Document]:
        if self.db is None:
            return []
        return self.db.similarity_search(query, k=k)


class QdrantVectorStore(BaseVectorStore):
    """Qdrant vector store wrapper."""
    def __init__(self, host: str, collection_name: str, embeddings: Any, api_key: Optional[str] = None):
        self.host = host
        self.collection_name = collection_name
        self.embeddings = embeddings
        self.api_key = api_key
        # Verify the library is importable
        try:
            import qdrant_client
        except ImportError as err:
            raise ImportError(
                "The 'qdrant-client' package is required for Qdrant storage. "
                "Please run 'pip install qdrant-client' to use this feature."
            ) from err

    def _get_db(self) -> Any:
        from qdrant_client import QdrantClient
        from langchain_community.vectorstores import Qdrant
        client = QdrantClient(url=self.host, api_key=self.api_key)
        return Qdrant(
            client=client,
            collection_name=self.collection_name,
            embeddings=self.embeddings
        )

    def add_documents(self, documents: List[Document]) -> None:
        db = self._get_db()
        db.add_documents(documents)

    def similarity_search(self, query: str, k: int = 10) -> List[Document]:
        db = self._get_db()
        return db.similarity_search(query, k=k)


class ChromaVectorStore(BaseVectorStore):
    """Chroma vector store wrapper."""
    def __init__(self, host: str, collection_name: str, embeddings: Any, persist_directory: Optional[str] = None):
        self.host = host
        self.collection_name = collection_name
        self.embeddings = embeddings
        self.persist_directory = persist_directory
        # Verify the library is importable
        try:
            import chromadb
        except ImportError as err:
            raise ImportError(
                "The 'chromadb' package is required for Chroma storage. "
                "Please run 'pip install chromadb' to use this feature."
            ) from err

    def _get_db(self) -> Any:
        import chromadb
        from langchain_community.vectorstores import Chroma
        
        if self.host and ("http" in self.host or ":" in self.host):
            parsed = self.host.replace("http://", "").replace("https://", "").split(":")
            h = parsed[0]
            p = int(parsed[1]) if len(parsed) > 1 else 8000
            client = chromadb.HttpClient(host=h, port=p)
            return Chroma(
                client=client,
                collection_name=self.collection_name,
                embedding_function=self.embeddings
            )
        else:
            return Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )

    def add_documents(self, documents: List[Document]) -> None:
        db = self._get_db()
        db.add_documents(documents)

    def similarity_search(self, query: str, k: int = 10) -> List[Document]:
        db = self._get_db()
        return db.similarity_search(query, k=k)


def get_vector_store(config: Dict[str, Any], embeddings: Any) -> BaseVectorStore:
    """Factory function to instantiate the selected pluggable vector store."""
    store_type = config.get("type", "FAISS").upper()
    if store_type == "QDRANT":
        host = config.get("host", "http://localhost:6333")
        collection_name = config.get("collection_name", "guardrag_collection")
        api_key = config.get("api_key")
        return QdrantVectorStore(host=host, collection_name=collection_name, embeddings=embeddings, api_key=api_key)
    elif store_type == "CHROMA":
        host = config.get("host", "")
        collection_name = config.get("collection_name", "guardrag_collection")
        persist_dir = config.get("persist_directory")
        return ChromaVectorStore(host=host, collection_name=collection_name, embeddings=embeddings, persist_directory=persist_dir)
    else:
        persist_dir = config.get("persist_directory", ".guardrag_storage/faiss_index")
        return FAISSVectorStore(persist_dir=persist_dir, embeddings=embeddings)
