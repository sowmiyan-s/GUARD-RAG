# Guardrails Local RAG Bot — Docker Image
#
# Build:   docker build -t rag-bot .
# Run:     docker run -p 8000:8000 --add-host=host.docker.internal:host-gateway rag-bot
#
# The container serves the FastAPI backend + pre-bundled frontend on port 8000.
# Ollama must be running on the HOST machine (or in a linked container) and the
# OLLAMA_HOST env-var should point to it:
#   docker run -e OLLAMA_HOST=http://host.docker.internal:11434 -p 8000:8000 rag-bot

FROM python:3.10-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 git curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install package
COPY pyproject.toml ./
COPY README.md ./
COPY LICENSE ./
COPY backend/ ./backend/
COPY chatbot.py ./

RUN pip install --no-cache-dir .

# FAISS vector store will be written to ~/.guard_rag_storage at runtime
# which is why we don't need a local directory for it.

# Expose API port
EXPOSE 8000

# Launch professionally via the package entry point
CMD ["guard-rag-web"]
