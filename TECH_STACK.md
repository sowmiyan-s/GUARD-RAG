# 🛠️ GuardRAG Technology Stack & Technical Rationale

> **Comprehensive Technical Inventory, Dependency Architecture, and Design Decisions**  
> *Production-Grade Air-Gapped AI Architecture • Version 1.3.x*

---

## 📑 Table of Contents

- [1. Technology Stack Matrix](#1-technology-stack-matrix)
- [2. Component Layer Deep Dive](#2-component-layer-deep-dive)
  - [2.1 Runtime & Core Language](#21-runtime--core-language)
  - [2.2 Web Framework & Asynchronous API Gateway](#22-web-framework--asynchronous-api-gateway)
  - [2.3 Front-End Architecture (Embedded Web Dashboard)](#23-front-end-architecture-embedded-web-dashboard)
  - [2.4 LLM Orchestration & Pipeline Automation](#24-llm-orchestration--pipeline-automation)
  - [2.5 Local Vectorization & Embedding Acceleration](#25-local-vectorization--embedding-acceleration)
  - [2.6 Vector Database & Similarity Search Engines](#26-vector-database--similarity-search-engines)
  - [2.7 Local LLM Inference Daemon](#27-local-llm-inference-daemon)
  - [2.8 Document Parsing & Structure Extraction](#28-document-parsing--structure-extraction)
  - [2.9 Security, Sanitization & PII Redaction Engines](#29-security-sanitization--pii-redaction-engines)
  - [2.10 Persistence, State & Forensic Auditing](#210-persistence-state--forensic-auditing)
  - [2.11 Testing, Linting & Quality Assurance](#211-testing-linting--quality-assurance)
  - [2.12 Packaging, Containerization & Orchestration](#212-packaging-containerization--orchestration)
- [3. Architectural Trade-offs & Decision Rationale](#3-architectural-trade-offs--decision-rationale)
- [4. Hardware Acceleration & System Compatibility](#4-hardware-acceleration--system-compatibility)

---

## 1. Technology Stack Matrix

| Layer | Primary Technology | Version / Specification | Role in GuardRAG |
| :--- | :--- | :--- | :--- |
| **Language & Runtime** | Python | `>= 3.9, <= 3.12` | Core backend runtime, asynchronous task scheduling, CLI |
| **API Gateway** | FastAPI + Uvicorn | `FastAPI >= 0.111.0`, `Uvicorn >= 0.29.0` | Asynchronous REST endpoints, Server-Sent Events (SSE) streaming |
| **Production Server** | Gunicorn | `>= 22.0.0` | Multi-worker process manager for containerized environments |
| **Front-End Dashboard** | Vanilla ES6+ / Modern CSS | Native Browser APIs | Zero-dependency, lightweight, reactive single-page interface |
| **RAG Orchestration** | LangChain Core & Splitters | `langchain >= 0.3.0`, `langchain-core >= 0.3.0` | Document chaining, chunking, history-aware retriever |
| **Embedding Model** | FastEmbed (ONNX Runtime) | `fastembed >= 0.2.7` | High-throughput CPU vectorization (`BAAI/bge-small-en-v1.5`) |
| **Embedding Fallback** | Sentence-Transformers | `sentence-transformers >= 2.7.0` | CUDA/MPS-capable fallback (`all-MiniLM-L6-v2`) |
| **Vector Store (Default)** | FAISS (CPU) | `faiss-cpu >= 1.8.0` | In-memory and disk-persisted vector similarity indexing |
| **Vector Store (Scalable)** | Qdrant Client | `qdrant-client` (Pluggable) | Networked vector database with partitioned collections |
| **Local LLM Daemon** | Ollama Engine | Standalone Binary (`11434`) | Quantized local LLM inference (Llama 3.3, DeepSeek-R1, Gemma 3) |
| **PDF Extraction** | PyPDF | `pypdf >= 4.2.0` | Pure-Python PDF parsing with page-level metadata retention |
| **Word Doc Extraction** | Docx2txt | `docx2txt >= 0.8` | XML structure extraction from `.docx` and `.doc` files |
| **Data Validation** | Pydantic V2 | `pydantic >= 2.7.0` | Strict schema validation, configuration parsing, API typing |
| **Terminal CLI** | Rich | `rich >= 13.0.0` | Syntax highlighting, terminal tables, progress animations |
| **Database & Auditing** | SQLite 3 | WAL Mode (Write-Ahead Logging) | Session persistence, message history, security audit trail |
| **Container Engine** | Docker & Compose | Multi-Stage Non-Root | Isolated, air-gapped production containerization |
| **Code Quality & Tests** | Pytest, Ruff, Mypy | `pytest >= 8.0`, `ruff >= 0.3` | Test suite, linting, code formatting, static type checking |

---

## 2. Component Layer Deep Dive

### 2.1 Runtime & Core Language
- **Python 3.9+**: Selected for universal cross-platform compatibility across enterprise Linux distributions (RHEL, Ubuntu LTS, Debian), Windows Server, and macOS.
- **`asyncio` Core**: Drives concurrent request dispatching, non-blocking SSE streaming, and Ollama model polling without thread lock contention.

---

### 2.2 Web Framework & Asynchronous API Gateway
- **FastAPI**: Provides asynchronous endpoint handling, automatic OpenAPI/Swagger documentation generation, dependency injection, and sub-millisecond route dispatching.
- **Uvicorn**: Lightning-fast ASGI server built on `uvloop` and `httptools`.
- **Server-Sent Events (SSE)**: Delivers token-by-token typewriter streaming (`text/event-stream`) without the architectural complexity, stateful ping-pong overhead, or proxy-buffering issues associated with WebSockets.

---

### 2.3 Front-End Architecture (Embedded Web Dashboard)
- **Vanilla ES6+ JavaScript**: Zero external npm build dependencies, zero Webpack/Vite build steps. The frontend is embedded directly within [`guardrag/api/frontend/`](file:///d:/PROJECTS/GUARD%20RAG/guardrag/api/frontend/) and served via FastAPI static mounts.
- **Modern CSS3 Design System**: Custom dark-mode theme utilizing CSS variables, responsive CSS Grid/Flexbox layouts, glassmorphism accents, and hardware-accelerated animations.
- **Instant Client-Side State**: Synchronizes active sessions, selected security tiers, reasoning personas, and live metrics via native `fetch` and `EventSource` APIs.

---

### 2.4 LLM Orchestration & Pipeline Automation
- **LangChain 0.3+ Modular Core**:
  - `langchain-text-splitters`: Implements `RecursiveCharacterTextSplitter` configured for semantic boundary preservation (paragraphs, newlines, sentences).
  - `langchain-ollama`: Clean asynchronous integration with the Ollama local runtime.
  - `langchain-classic` / `langchain.chains`: Combines retrieved document context with conversation history using `create_history_aware_retriever` and `create_retrieval_chain`.

---

### 2.5 Local Vectorization & Embedding Acceleration
- **FastEmbed (`fastembed`) with ONNX Runtime**:
  - Model: `BAAI/bge-small-en-v1.5` (384-dimensional dense vectors).
  - ONNX runtime executes optimized C++ kernels with CPU SIMD instructions (AVX-512, AVX2, NEON).
  - Configured with thread limits (`min(4, cpu_count // 2)`) to eliminate CPU thrashing on Windows and multi-core Linux hosts.
- **HuggingFace Fallback**:
  - Model: `sentence-transformers/all-MiniLM-L6-v2`.
  - Automatically engages GPU acceleration (`cuda` or `mps`) if PyTorch and compatible hardware are detected.

---

### 2.6 Vector Database & Similarity Search Engines
- **FAISS-CPU (`faiss-cpu`)**:
  - Developed by Meta AI Research. Provides extreme cosine and L2 similarity search performance using flat indexing (`IndexFlatIP` / `IndexFlatL2`).
  - Serializes directly to `.guardrag_storage/<db_id>/index.faiss` and `index.pkl`.
  - Zero daemon configuration required: perfect for single-workstation offline environments.
- **Qdrant (`qdrant-client`)**:
  - Enterprise alternative configured via `/api/vector/config`.
  - Offers payload filtering, multi-tenancy, and distributed vector clustering for team deployments.

---

### 2.7 Local LLM Inference Daemon
- **Ollama**:
  - Manages GGUF quantization formats (Q4_K_M, Q5_K_M, Q8_0), GPU VRAM allocation, and Apple Silicon Metal acceleration.
  - Decoupled from Python process space: if an LLM crashes due to Out-Of-Memory (OOM), the GuardRAG web server and indexed vectors remain unaffected.
  - Supports automatic lifecycle control from GuardRAG via `POST /api/ollama/start` and `POST /api/ollama/stop`.

---

### 2.8 Document Parsing & Structure Extraction
- **PyPDF (`pypdf`)**: Pure-Python PDF parser that extracts embedded text streams, outlines, and page counts with zero C-library dependencies (e.g., Poppler/Tesseract not required).
- **Docx2txt (`docx2txt`)**: Decompresses Word `.docx` ZIP archives and parses `word/document.xml` into structured text while discarding formatting artifacts.
- **Native Structured Ingestion**: Custom streaming readers for `.csv`, `.json`, `.md`, `.txt`, `.log`, and `.py`.

---

### 2.9 Security, Sanitization & PII Redaction Engines
- **Indirect Prompt Injection Sanitizer**: Heuristic ruleset scanning for adversarial prompts, DAN delimiters, instruction-override directives, and zero-width Unicode joiners (`\u200B`, `\u200C`, `\uFEFF`).
- **Context-Aware PII Tokenizer**: Regex and token replacement engine modeling Presidio anonymization patterns for SSNs, credit cards, telephone numbers, emails, and names (`[PERSON_N]`, `[EMAIL_N]`).
- **Secret & Credential Masking Engine**: Scans against high-entropy patterns matching JWT tokens, AWS access keys (`AKIA...`), GitHub personal access tokens (`ghp_...`), private keys (`-----BEGIN PRIVATE KEY-----`), and database connection URIs.

---

### 2.10 Persistence, State & Forensic Auditing
- **SQLite 3 in WAL Mode**:
  - High-concurrency relational store embedded in `sessions.db`.
  - Maintains `sessions`, `messages`, `share_tokens`, and `audit_logs` tables.
  - WAL (Write-Ahead Logging) enables non-blocking concurrent reads during active token streaming writes.
- **Forensic Audit Logger**: Records every security tier change, document upload, query event, and LAN share resolution with ISO-8601 timestamps and client IP addresses.

---

### 2.11 Testing, Linting & Quality Assurance
- **Pytest (`pytest`) & Pytest-Cov (`pytest-cov`)**: Comprehensive test suite verifying safety guardrails, PII redaction, API routing, multi-device LAN tokens, and CLI arguments.
- **Ruff (`ruff`)**: Ultra-fast Rust-based Python linter and formatter enforcing PEP 8 and modern Python idioms.
- **Mypy (`mypy`)**: Static type checking ensuring type safety across core interfaces.

---

### 2.12 Packaging, Containerization & Orchestration
- **PyPI Distribution**: Compliant `pyproject.toml` configuration targeting Setuptools with metadata for easy `pip install guard-rag`.
- **Multi-Stage Docker**:
  - Slim base image (`python:3.11-slim`).
  - Dedicated non-root user (`appuser:1000`).
  - Persistent volume at `/data`.
- **Docker Compose**: Orchestrates GuardRAG alongside an optional bundled Ollama service with internal bridge networking.

---

## 3. Architectural Trade-offs & Decision Rationale

### Decision 1: FastEmbed ONNX vs. Heavy PyTorch Embeddings
* **Alternative Considered**: Standard `sentence-transformers` relying on PyTorch CUDA runtimes.
* **Why FastEmbed ONNX Won**: PyTorch packages consume 2GB–4GB of disk space and require complex CUDA driver matching. FastEmbed utilizes lightweight ONNX Runtime (~60MB), initializes in under 200ms, and embeds chunks at near-GPU speeds on modern multi-core CPUs.

### Decision 2: Embedded Vanilla Web UI vs. React/Next.js/Node Stack
* **Alternative Considered**: Dedicated React / Next.js SPA with Node.js backend.
* **Why Vanilla ES6+ Won**: Packaging Node.js or requiring users to install npm, Node, and build steps creates substantial friction for Python developers and offline air-gapped systems. Serving clean Vanilla ES6+ directly from FastAPI ensures GuardRAG remains a **single command (`pip install guard-rag && guard-rag`)** zero-friction product.

### Decision 3: Server-Sent Events (SSE) vs. WebSockets for Streaming
* **Alternative Considered**: Bidirectional WebSockets (`ws://`).
* **Why SSE Won**: Document Q&A is fundamentally unidirectional during generation (client queries once; server streams continuous tokens). SSE runs over standard HTTP/1.1 and HTTP/2, requires no special reverse-proxy handshake configurations, and natively reconnects upon dropped connections.

### Decision 4: Decoupled Ollama Daemon vs. Direct llama.cpp C-Bindings
* **Alternative Considered**: In-process `llama-cpp-python` bindings.
* **Why Ollama Daemon Won**: In-process C++ LLM bindings frequently trigger segmentation faults, CUDA driver version mismatches, or high RAM usage that can crash the parent Python web process. Ollama provides rock-solid process isolation, automatic model downloading, and seamless hardware acceleration across Windows, macOS Metal, and Linux CUDA.

### Decision 5: SQLite WAL vs. PostgreSQL / Redis
* **Alternative Considered**: External PostgreSQL database and Redis cache.
* **Why SQLite WAL Won**: GuardRAG's mission is **100% self-contained offline deployment**. Requiring users to spin up external PostgreSQL or Redis instances adds unnecessary maintenance overhead. SQLite with WAL mode delivers thousands of transactions per second on local SSDs with zero operational overhead.

---

## 4. Hardware Acceleration & System Compatibility

| Hardware Platform | Embedding Acceleration | LLM Acceleration | Min RAM | Recommended RAM |
| :--- | :--- | :--- | :--- | :--- |
| **Windows x86_64 (CPU)** | ONNX Runtime (AVX2/AVX-512) | Ollama CPU Threads | 8 GB | 16 GB |
| **Windows x86_64 + NVIDIA** | ONNX Runtime (CPU) | Ollama CUDA Acceleration | 16 GB | 32 GB + 8GB VRAM |
| **macOS Apple Silicon (M1/M2/M3/M4)** | ONNX Runtime (ARM NEON) | Ollama Metal Unified Memory | 8 GB | 16 GB - 36 GB |
| **Linux x86_64 (Server)** | ONNX Runtime (AVX-512) | Ollama CUDA / ROCm | 8 GB | 32 GB |
| **Air-Gapped Edge Box (No GPU)** | ONNX Runtime (Multi-Thread) | Ollama Small Quant (`gemma3:1b`, `qwen2.5:1.5b`) | 8 GB | 16 GB |

---

<div align="center">

**[Return to Readme](README.md)** • **[System Architecture](ARCHITECTURE.md)** • **[API Reference](docs/API_REFERENCE.md)** • **[Deployment Guide](DEPLOYMENT.md)**

</div>
