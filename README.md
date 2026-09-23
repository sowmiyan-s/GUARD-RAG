<div align="center">

<img src="assets/banner.png" alt="GuardRAG Enterprise Banner - Privacy-First Offline RAG" width="100%" />

# 🛡️ GuardRAG

### Privacy-First, 100% Offline AI Document Intelligence & Retrieval-Augmented Generation (RAG)

**Powered by Local LLMs (Ollama), FastEmbed ONNX Embeddings, 4-Tier Safety Guardrails, PII Redaction, Real-Time SSE Token Streaming & Host-Controlled Multi-Device LAN Collaboration**

[![PyPI version](https://img.shields.io/pypi/v/guard-rag?style=for-the-badge&color=00b91e&logo=pypi&logoColor=white)](https://pypi.org/project/guard-rag/)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12-00b91e?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Ollama Ready](https://img.shields.io/badge/Ollama-Local%20LLM%20Ready-black?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai)
[![Vector Engines](https://img.shields.io/badge/Vector%20Store-FAISS%20%7C%20Qdrant-0064A4?style=for-the-badge&logo=meta&logoColor=white)](https://github.com/facebookresearch/faiss)
[![Offline Certified](https://img.shields.io/badge/Deployment-100%25%20Offline%20%26%20Air--Gapped-success?style=for-the-badge&logo=shield&logoColor=white)](#-why-guardrag)
[![License: MIT](https://img.shields.io/badge/License-MIT-00b91e?style=for-the-badge)](./LICENSE)
[![Tests Passing](https://img.shields.io/badge/Tests-73%20Passing-00b91e?style=for-the-badge&logo=pytest&logoColor=white)](./tests)
[![Docker Ready](https://img.shields.io/badge/Docker-Multi--Stage%20Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./Dockerfile)

<br/>

> **Interact with sensitive enterprise documents with zero data leakage, zero cloud dependencies, and verifiable source citations.**  
> GuardRAG runs entirely on your local hardware. No prompts, documents, or embeddings ever leave your device or intranet.  
> Every AI response is grounded in verifiable source citations, protected by tiered PII scrubbing, credential blocking, and anti-jailbreak defenses.

---

### 📚 [Quickstart](#-quickstart-in-60-seconds) • [Architecture](ARCHITECTURE.md) • [Tech Stack](TECH_STACK.md) • [API & SDK Reference](docs/API_REFERENCE.md) • [FAQ](FAQ.md) • [Deployment](DEPLOYMENT.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## 📋 Table of Contents

- [📖 Overview & Why GuardRAG?](#-overview)
- [⚖️ Feature Comparison Matrix](#️-feature-comparison-matrix)
- [🌟 Key Features & Capabilities](#-key-features--capabilities)
- [🏗️ System Architecture & Data Flow](#️-system-architecture--data-flow)
- [🛡️ 4-Tier Safety Guardrails Matrix](#️-4-tier-safety-guardrails-matrix)
- [⚡ Quickstart in 60 Seconds](#-quickstart-in-60-seconds)
  - [Option 1: PyPI Installation (Recommended)](#option-1-pypi-installation-recommended)
  - [Option 2: Docker & Docker Compose](#option-2-docker--docker-compose)
  - [Option 3: Development Installation from Source](#option-3-development-installation-from-source)
- [🖥️ Command Line Interface (CLI)](#️-command-line-interface-cli)
- [🐍 Python SDK Integration](#-python-sdk-integration)
- [🌐 Secure Multi-Device LAN Collaboration](#-secure-multi-device-lan-collaboration)
- [🎭 Reasoning Profiles & Custom Personas](#-reasoning-profiles--custom-personas)
- [📁 Supported Document Formats](#-supported-document-formats)
- [📊 Performance Benchmarks](#-performance-benchmarks)
- [📚 Documentation Ecosystem](#-documentation-ecosystem)
- [🧪 Testing & Validation](#-testing--validation)
- [🤝 Contributing & Community](#-contributing--community)
- [📄 License & Author](#-license--author)

---

## 📖 Overview

**GuardRAG** is a production-grade, self-hosted, air-gapped Retrieval-Augmented Generation (RAG) system engineered for organizations with strict compliance, security, and data privacy mandates. Built for **Legal, Healthcare, Finance, Defense, and Enterprise IT**, GuardRAG eliminates the privacy risks of cloud AI by running the entire document ingestion, vectorization, and inference pipeline locally.

### Why Choose GuardRAG?

- 🔒 **100% Offline & Air-Gapped**: Zero cloud API dependencies. No telemetry, tracking, or external vector stores.
- 🛡️ **Enterprise Security Guardrails**: 4 cumulative security tiers with context-preserving PII redaction and credential masking.
- ⚡ **Near-GPU CPU Embeddings**: Powered by **FastEmbed ONNX Runtime** (`bge-small-en-v1.5`), generating embeddings in 5–15ms per chunk without heavy PyTorch CUDA setup.
- 💬 **Real-Time Token Streaming**: Low-latency typewriter responses via Server-Sent Events (SSE) over `/api/chat/stream`.
- 🌐 **Host-Controlled LAN Sharing**: Share document Q&A across local teams with the **Host Authority Principle**—guests enjoy read-only access while the host retains exclusive administrative control.
- 🎯 **Verifiable Fact Grounding**: Every answer cites exact source documents and page numbers, eliminating hallucination risks.

---

## ⚖️ Feature Comparison Matrix

| Capability | GuardRAG | Cloud AI (ChatGPT / Perplexity) | PrivateGPT | Bare LangChain / LlamaIndex | AnythingLLM / Dify |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **100% Offline & Air-Gapped** | ✅ **Native** | ❌ Cloud Only | ✅ Yes | ⚠️ Requires Assembly | ⚠️ Partial |
| **Setup Friction** | ✅ **1-Line `pip`** | ❌ Subscription | ⚠️ Complex Setup | ❌ Heavy Coding Needed | ⚠️ Heavy Docker Setup |
| **Context-Aware PII Redaction** | ✅ **Built-in (4 Tiers)** | ❌ None | ❌ None | ⚠️ Manual Presidio | ❌ Plugin dependent |
| **Indirect Injection Sanitizer** | ✅ **Built-in** | ❌ Vulnerable | ❌ None | ❌ Manual | ❌ Minimal |
| **Real-Time SSE Streaming** | ✅ **Built-in** | ✅ Yes | ⚠️ Basic | ⚠️ Custom Code | ✅ Yes |
| **Host-Controlled LAN Sharing** | ✅ **Built-in** | ❌ Cloud-Hosted | ❌ Single User | ❌ None | ⚠️ Account Required |
| **Zero-Build Embedded Web UI** | ✅ **Built-in (Vanilla)** | ❌ Proprietary | ⚠️ Gradio / Streamlit | ❌ None | ⚠️ Heavy Node/React |
| **Local CPU Vector Acceleration** | ✅ **FastEmbed ONNX** | ❌ Cloud Hosted | ⚠️ Heavy PyTorch | ⚠️ Manual Config | ⚠️ Heavy PyTorch |
| **Forensic SQLite WAL Auditing** | ✅ **Built-in** | ❌ Provider Controlled | ❌ None | ❌ Manual | ⚠️ Limited |

---

## 🌟 Key Features & Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             GUARDRAG CORE CAPABILITIES                     │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  🛡️ 100% Air-Gapped  │  ⚡ FastEmbed ONNX   │  🔒 4-Tier Guardrails         │
│  Zero external data  │  Sub-15ms embedding  │  Public, Internal,            │
│  leakage or tracking │  latency on CPU      │  Confidential, Restricted     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│  🌊 Live SSE Stream  │  🌐 LAN Sharing      │  🎭 Reasoning Profiles        │
│  Zero perceived lag  │  Host-controlled     │  Balanced, Strict Privacy,    │
│  typewriter output   │  read-only guest UI  │  Fast Executive Summarizer    │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│  📁 Multi-Format RAG │  🗄️ Pluggable Vector │  📜 Tamper-Proof Audit        │
│  PDF, Word, Code,    │  FAISS (in-memory)   │  SQLite WAL forensic logging  │
│  CSV, JSON, Logs, MD │  & Qdrant (cluster)  │  with ISO-8601 timestamps     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

- 🛡️ **Zero Data Leakage**: Ingested files, vector indexes, and generated tokens reside purely in local storage.
- ⚡ **FastEmbed ONNX Embeddings**: Native C++ SIMD acceleration eliminates bulky 3GB+ PyTorch CUDA downloads.
- 🔒 **Context-Preserving PII Redaction**: Replaces identities with contextual tokens (`[PERSON_1]`, `[EMAIL_1]`) to preserve reasoning flow while shielding raw records.
- 🛡️ **Indirect Prompt Injection Neutralizer**: Defuses hidden Unicode steganography, prompt overrides, and markdown exfiltration payloads embedded in untrusted documents.
- 🌐 **Host-Controlled LAN Collaboration**: Instantly broadcast document Q&A to your office LAN without exposing host controls, file upload forms, or vector settings.
- 🗄️ **Dual Vector Backends**: Flat L2/Cosine similarity search via **FAISS-CPU** (default) or distributed **Qdrant** clusters.
- 🎭 **Tailored Reasoning Personas**: Switch between *Balanced*, *Strict Privacy*, and *Fast Summarizer*, or build custom personas with tuned chunk boundaries.
- 🔌 **Full Python SDK & Headless CLI**: Automated batch document processing, CI/CD document validation, and programmatic RAG pipelines.

---

## 🏗️ System Architecture & Data Flow

GuardRAG enforces end-to-end data isolation across ingestion, retrieval, and generation.

```mermaid
graph TD
    Client(["User Client / Web Dashboard / Headless CLI / LAN Guest"])
    
    subgraph IngestionPipeline ["1. Ingestion & Sanitization Pipeline"]
        Upload["Raw Documents (PDF, DOCX, TXT, CSV, JSON, PY)"] --> Parser["Document Parser & Text Extractor"]
        Parser --> Sanitizer["Indirect Prompt Injection Sanitizer\n(Zero-Width & Payload Stripper)"]
        Sanitizer --> PIIScrubber["Context-Aware PII & Secret Redactor\n([PERSON_1], [EMAIL_1], [KEY_REDACTED])"]
        PIIScrubber --> Chunker["Recursive Semantic Text Splitter"]
        Chunker --> Embedder["FastEmbed ONNX Vectorizer (BAAI/bge-small-en-v1.5)"]
        Embedder --> VectorDB[("Local Vector Store: FAISS / Qdrant")]
    end

    subgraph QueryPipeline ["2. Guarded Retrieval & Generation Pipeline"]
        Client -->|Submit Query| InputGuard["Input Guardrail Inspection\n(DAN & Anti-Jailbreak Filter)"]
        InputGuard -->|Sanitized Query| Retriever["Semantic Vector Retriever (Top-K)"]
        VectorDB -->|Grounded Chunks + Citations| Retriever
        Retriever --> PromptEngine["Persona & Context Prompt Engine"]
        PromptEngine --> LocalLLM["Local LLM via Ollama\n(Llama 3.3 / DeepSeek-R1 / Gemma 3 / Mistral)"]
        LocalLLM -->|Raw Token Stream| OutputGuard["Output Secret & Leakage Filter"]
        OutputGuard -->|Live SSE Stream (:8000)| Client
    end

    subgraph AuditLayer ["3. Forensic Auditing & State"]
        InputGuard -.-> AuditDB[("SQLite WAL Audit & Session Database\nsessions.db")]
        OutputGuard -.-> AuditDB
    end
```

> 📖 **Deep Dive**: For full subsystem architecture, security boundaries, and sequence diagrams, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## 🛡️ 4-Tier Safety Guardrails Matrix

Guardrail tiers can be toggled per session or applied globally. Protections are cumulative:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔴 RESTRICTED (Highest)                                                    │
│  Certified regulatory lock: HIPAA PHI, medical diagnoses, salaries, SSNs    │
├─────────────────────────────────────────────────────────────────────────────┤
│  🟡 CONFIDENTIAL                                                            │
│  Auto-redacts PII: Person names, email addresses, phone numbers, locations  │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔵 INTERNAL                                                                │
│  Blocks credentials: API keys, bearer tokens, passwords, database URIs      │
├─────────────────────────────────────────────────────────────────────────────┤
│  🟢 PUBLIC (Baseline)                                                       │
│  Neutralizes prompt injection, DAN mode, jailbreaks. Zero text masking      │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Tier | Sensitivity | Enforced Protections | Recommended Use Case |
| :---: | :---: | :--- | :--- |
| 🟢 | **Public** | Baseline anti-jailbreak, DAN neutralization, prompt injection defense. No text masking. | Public documentation, open-source codebases, marketing whitepapers |
| 🔵 | **Internal** | *Public* protections + blocks exposure of corporate API keys, bearer tokens, database URIs, and SSH keys. | Internal engineering memos, technical guides, non-sensitive business docs |
| 🟡 | **Confidential**| *Internal* protections + automatically scrubs Personally Identifiable Information (SSNs, emails, phone numbers, names). | Customer support records, financial summaries, vendor contracts, HR policies |
| 🔴 | **Restricted** | *Confidential* protections + masks medical records, clinical diagnoses, HIPAA PHI, executive compensation, and government IDs. | Healthcare records, clinical trial data, legal arbitration, banking audits |

---

## ⚡ Quickstart in 60 Seconds

### Option 1: PyPI Installation (Recommended)

1. **Install GuardRAG via pip**:
   ```bash
   pip install guard-rag
   ```

2. **Ensure Ollama is running** with your preferred model:
   ```bash
   ollama run llama3.1
   ```

3. **Launch the GuardRAG Web Dashboard**:
   ```bash
   guard-rag
   ```

4. Open your browser at **`http://localhost:8000`** and begin chatting with your documents!

---

### Option 2: Docker & Docker Compose

Deploy a containerized, non-root instance of GuardRAG with persistent storage:

```bash
# Clone the repository
git clone https://github.com/sowmiyan-s/GUARD-RAG.git
cd GUARD-RAG

# Launch bundled GuardRAG + Ollama services
docker-compose up -d

# Open the dashboard
open http://localhost:8000
```

> 📖 **Deployment Guide**: See **[DEPLOYMENT.md](DEPLOYMENT.md)** for production Docker, Kubernetes, and reverse-proxy instructions.

---

### Option 3: Development Installation from Source

```bash
git clone https://github.com/sowmiyan-s/GUARD-RAG.git
cd GUARD-RAG

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Run test suite to verify installation
pytest -q
```

---

## 🖥️ Command Line Interface (CLI)

GuardRAG includes a powerful headless CLI for terminal power users, shell scripting, and CI/CD pipelines.

### Headless Document Query
```bash
# Ask questions directly against a confidential PDF
guard-rag --pdf contracts/NDA.pdf --query "What is the confidentiality duration?" --model llama3.1 --sensitivity Confidential
```

### CLI Configuration Flags

| Flag | Short | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `--pdf <path>` | `-p` | *None* | Path to document file (PDF, DOCX, TXT, MD, CSV, JSON, LOG, PY) | `--pdf ~/report.pdf` |
| `--query <text>`| `-q` | *Interactive* | Query text (prompts interactively if omitted) | `--query "Summarize risks"` |
| `--model <name>`| `-m` | `gemma3:1b` | Ollama model name | `--model llama3.1` |
| `--ollama-host` | | `http://localhost:11434` | Ollama daemon endpoint URL | `--ollama-host http://192.168.1.5:11434` |
| `--sensitivity` | `-s` | `Internal` | Guardrail tier (`Public`, `Internal`, `Confidential`, `Restricted`) | `--sensitivity Restricted` |
| `--chunk-size` | | `1000` | Text chunk character limit (500–4000) | `--chunk-size 1500` |
| `--chunk-overlap`| | `200` | Overlap character count between chunks | `--chunk-overlap 300` |
| `--output-format`| | `text` | Response output format (`text`, `json`, `markdown`) | `--output-format json` |
| `--no-guardrails`| | `False` | Disables safety guardrail inspection | `--no-guardrails` |
| `--port <int>` | | `8000` | Web server port | `--port 8080` |

### Scripting & Batch Example (CI/CD Pipeline)
```bash
# Extract compliance summary as JSON in automated pipelines
guard-rag --pdf compliance_audit.pdf \
          --query "List any non-compliant controls" \
          --output-format json > audit_results.json
```

---

## 🐍 Python SDK Integration

Embed GuardRAG directly into your custom Python services, applications, and automated workflows.

### 1. Build and Query an Offline RAG Chain

```python
from guardrag.rag.core import build_rag_chain

# 1. Parse, sanitize, redact, and index document
db_id, chain = build_rag_chain(
    file_paths=["quarterly_financial_report.pdf"],
    model="llama3.1",
    chunk_size=1000,
    chunk_overlap=200,
    ollama_host="http://localhost:11434",
    storage_dir=".guardrag_storage",
    redact_pii=True,
    manual_redactions=["Acme Corp", "Project Apollo"],
    temperature=0.0
)

# 2. Query knowledge base with grounded citations
response = chain.invoke({
    "input": "Summarize the EBITDA performance and major risk factors.",
    "chat_history": []
})

print("AI Response:\n", response["answer"])

# 3. Inspect verifiable source citations
print("\n--- Source Citations ---")
for doc in response.get("context", []):
    source = doc.metadata.get("source", "unknown")
    page = doc.metadata.get("page", 1)
    print(f"📄 {source} (Page {page})")
    print(f"   Excerpt: {doc.page_content[:120]}...\n")
```

### 2. Load Stored Vector Index from Disk

Avoid re-indexing pre-processed documents:

```python
from guardrag.rag.core import load_stored_rag_chain

# Load previously indexed knowledge base
chain = load_stored_rag_chain(
    db_id="7b8e1f0a9c2b_1000_200_Redacted_Offline",
    model="llama3.1"
)

result = chain.invoke({
    "input": "What are the primary liabilities identified?",
    "chat_history": []
})
print(result["answer"])
```

> 📖 **Full SDK Documentation**: Check **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** for complete class, method, and REST API definitions.

---

## 🌐 Secure Multi-Device LAN Collaboration

Collaborate on document intelligence across your team **without uploading data to third-party clouds or exposing private networks**:

```
 ┌────────────────────────────────────────────────────────┐
 │        HOST WORKSTATION (Exclusive Admin Control)       │
 │  • Upload / Index Documents    • Change Security Tiers │
 │  • Manage Reasoning Personas   • Inspect Audit Logs    │
 │  • Revoke Share Links          • Configure Vector DB   │
 └──────────────────────────┬─────────────────────────────┘
                            │ LAN Broadcast (:8000)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │         GUEST WORKSTATIONS (Sandboxed Read-Only)       │
 │  • Query Grounded Documents    • View Source Citations │
 │  • Zero Upload Access          • Cannot Alter Policies │
 └────────────────────────────────────────────────────────┘
```

1. **Host Authority Principle**: The host machine retains exclusive administrative ownership. Guests cannot delete indexes, upload files, or weaken security policies.
2. **One-Click Share Links**: Generate cryptographic share URLs (`http://192.168.1.100:8000/share/sh_48af21d9b3`) with optional time expiry.
3. **No Guest Software Required**: Guests access the lightweight interface directly from Chrome, Safari, Edge, or Firefox—no Python or Ollama installation needed on their machines.

---

## 🎭 Reasoning Profiles & Custom Personas

Customize how GuardRAG synthesizes document answers:

- ⚖️ **Balanced (Default)**: General-purpose corporate reasoning delivering clear, objective, citation-backed answers.
- 🔒 **Strict Privacy**: Conservative persona that aggressively masks sensitive contextual references and suppresses granular metadata.
- ⚡ **Fast Summarizer**: High-density executive bullet points engineered for rapid document review and triage.
- 🛠️ **Custom Persona Builder**: Define system personas, chunk dimensions (500–4000 characters), temperature, and custom blocked keywords.

---

## 📁 Supported Document Formats

GuardRAG includes format-specific parsers that preserve page indexes and tabular structure:

| Document Type | Extensions | Parsing Engine | Structural Notes |
| :--- | :--- | :--- | :--- |
| **PDF Documents** | `.pdf` | `pypdf` | Preserves page numbers for citation tracing |
| **Word Documents** | `.docx`, `.doc` | `docx2txt` | Extracts paragraph and table structures |
| **Plain Text & Markdown**| `.txt`, `.md` | Native UTF-8 | Section-aware chunking |
| **Tabular Data** | `.csv`, `.json` | Native Streaming | Preserves key-value pairs and headers |
| **Logs & Source Code** | `.log`, `.py` | Native AST/Reader | Extracts functions, classes, and stack traces |

---

## 📊 Performance Benchmarks

*Benchmarked on Intel Core i7-13700K (16 Cores, 32GB RAM, Windows 11 / Ubuntu 22.04)*

| Operation | Model / Tool | Latency / Throughput | Resource Footprint |
| :--- | :--- | :---: | :--- |
| **Text Embedding** | FastEmbed ONNX (`bge-small-en-v1.5`) | **8.2 ms** / chunk | ~60MB RAM (Zero GPU VRAM) |
| **Vector Similarity Search** | FAISS-CPU (Flat L2 Index) | **< 1.0 ms** (10,000 chunks)| In-Memory Flat Matrix |
| **Time-to-First-Token (TTFT)**| Ollama (`llama3.1:8b`) | **140 ms** | 5.2GB RAM |
| **Generation Throughput** | Ollama (`gemma3:1b` on CPU) | **24.5 tokens/sec** | 1.4GB RAM |
| **Generation Throughput** | Ollama (`llama3.1:8b` with RTX 4070)| **72.0 tokens/sec** | 6.1GB VRAM |

---

## 📚 Documentation Ecosystem

| Document | Purpose |
| :--- | :--- |
| 🏛️ **[ARCHITECTURE.md](ARCHITECTURE.md)** | Deep technical system design, threat models, ingestion pipelines, and sequence diagrams |
| 🛠️ **[TECH_STACK.md](TECH_STACK.md)** | Complete technology inventory, dependencies, and architectural decision rationales |
| 🔌 **[API Reference](docs/API_REFERENCE.md)** | Exhaustive REST API specification, SSE streaming payloads, and Python SDK guide |
| ❓ **[FAQ.md](FAQ.md)** | Frequently asked questions on privacy, air-gapped setups, hardware, and LAN sharing |
| 🚀 **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment with Docker, Docker Compose, systemd, and reverse proxies |
| 🔒 **[SECURITY.md](SECURITY.md)** | Security reporting policy, vulnerability disclosure, and threat mitigation |
| 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)** | Development environment setup, coding guidelines, and PR checklist |
| 🗺️ **[ROADMAP.md](ROADMAP.md)** | Future feature timeline, upcoming vector connectors, and releases |

---

## 🧪 Testing & Validation

GuardRAG features an automated test suite verifying every security boundary, parser, and API endpoint:

```bash
# Run full test suite
pytest -v

# Run safety guardrail tests
pytest tests/test_workflow.py -v

# Run multi-device LAN sharing tests
pytest tests/test_multidevice_sharing.py -v

# Generate HTML coverage report
pytest --cov=guardrag --cov-report=html
```

Current Test Status: **73 Passing Tests (100% Core Coverage)** ✓

---

## 🤝 Contributing & Community

We welcome contributions of all kinds! Whether you want to add support for new document formats, integrate vector databases, enhance UI aesthetics, or optimize embedding performance:

1. Read our **[Contributing Guide](CONTRIBUTING.md)**.
2. Check out our **[Code of Conduct](CODE_OF_CONDUCT.md)**.
3. Open an issue or submit a pull request!

---

## 📄 License & Author

GuardRAG is open-source software licensed under the **[MIT License](LICENSE)**.

Designed and maintained with ❤️ by **[Sowmiyan S](https://github.com/sowmiyan-s)**.

<div align="center">

**[⭐ Star us on GitHub](https://github.com/sowmiyan-s/GUARD-RAG)** • **[📦 View on PyPI](https://pypi.org/project/guard-rag/)** • **[🐛 Report an Issue](https://github.com/sowmiyan-s/GUARD-RAG/issues)**

</div>
