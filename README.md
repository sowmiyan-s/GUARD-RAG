<div align="center">

<img src="assets/banner.png" alt="GuardRAG Enterprise Banner" width="100%" />

# 🛡️ GuardRAG Enterprise

### Privacy-First, 100% Offline AI Document Intelligence & Retrieval
**Powered by Local LLMs, 4-Tier Safety Guardrails, Real-Time Token Streaming & Host-Controlled Multi-Device Sharing**

[![PyPI version](https://img.shields.io/pypi/v/guard-rag?style=for-the-badge&color=00b91e)](https://pypi.org/project/guard-rag/)
![Python](https://img.shields.io/badge/Python-3.9%2B-00b91e?style=for-the-badge&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=for-the-badge&logo=ollama&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Store-0064A4?style=for-the-badge&logo=meta&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-73%20Passing-00b91e?style=for-the-badge&logo=pytest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-00b91e?style=for-the-badge)

<br/>

> **Interact with sensitive enterprise documents with complete privacy and zero data leakage.**  
> GuardRAG runs 100% locally on your hardware. No prompts, documents, or embeddings ever leave your device or internal network.  
> Every AI answer is strictly grounded in verifiable source citations and protected by multi-tier PII scrubbing, credential blocking, anti-jailbreak defenses, and customizable reasoning personas.

</div>

---

## 🌟 Key Features & Updates

GuardRAG is tailored for privacy-sensitive industries—Legal, Healthcare, Finance, and Enterprise IT—where data compliance and zero external telemetry are mandatory.

| **Capability** | **Description** |
| :--- | :--- |
| 🛡️ **100% Offline Inference** | Operates entirely on local CPU/GPU using Ollama models (Gemma, LLaMA, DeepSeek, Mistral, Qwen, Phi) and FastEmbed embeddings. |
| ⚡ **Real-Time Token Streaming** | Instant typewriter responses rendered with Server-Sent Events (SSE) via `/api/chat/stream` for zero perceived latency. |
| 🔒 **4-Tier Safety Guardrails** | Configurable security tiers (*Public*, *Internal*, *Confidential*, *Restricted*) providing real-time credential blocking, PII redaction, and compliance filtering. |
| 🛡️ **Indirect Injection Defense** | Sanitizes ingested documents against prompt injection attacks, zero-width steganography, and markdown exfiltration payloads. |
| 📜 **Persistent Audit Logging** | SQLite WAL-backed structured audit trails with indexed timestamps, event categories, and forensic metadata. |
| 🔐 **Enterprise API Key Auth** | Protect administrative and document upload endpoints using optional `GUARDRAG_API_KEY` header verification. |
| 🐳 **Docker & Compose Ready** | Multi-stage non-root container with persistent `/data` volume and instant one-command orchestration. |
| 📈 **Telemetry & Metrics** | Real-time `/api/metrics` endpoint reporting query throughput, average latency, uptime, and vector store indices. |
| 🎭 **Reasoning & Custom Profiles** | Switch between *Balanced*, *Strict Privacy*, and *Fast Summarizer* reasoning presets, or create and persist **Custom Profiles** with tailored personas. |
| 🌐 **Host-Controlled LAN Sharing** | Share document Q&A across your local network. Host machines retain exclusive admin authority—guests cannot alter security levels or delete collections. |
| 📁 **Broad Document Support** | Ingest and search `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.log`, and `.py` files. |
| 🔌 **Python SDK & Headless CLI** | Full programmatic access via clean Python APIs and headless command-line interface for CI/CD and automated document workflows. |

---

## 🏗️ Architecture & Security Pipeline

GuardRAG guarantees complete data isolation across ingestion, retrieval, and LLM generation:

```mermaid
graph TD
    User([User / Web UI / CLI]) -->|Raw Document| Ingest[Document Parser & Cleaner]
    Ingest -->|Sanitize Injection| SafetyCleaner[Indirect Injection Sanitizer]
    SafetyCleaner -->|Text Chunks| PIIRedactor[PII & Credential Redactor]
    PIIRedactor -->|Clean Chunks| Embedder[FastEmbed ONNX Vectorizer]
    Embedder --> VectorDB[(Local Vector Store: FAISS / Qdrant)]
    
    User -->|Prompt Query| InputGuard[Input Safety Guardrail Engine]
    InputGuard -->|Sanitized Query| Retriever[Semantic Context Retriever]
    Retriever --> VectorDB
    VectorDB -->|Top-K Grounded Chunks| PromptEngine[Persona & Reasoning Prompt Engine]
    PromptEngine -->|Context + Query| LocalLLM[Local LLM via Ollama / Cloud API]
    LocalLLM -->|Live Token Stream (SSE)| OutputGuard[Output Safety & Redaction Filter]
    OutputGuard -->|Verified & Grounded Stream| User
```

---

## 🛡️ 4-Tier Safety Guardrails

Configure your security baseline per-session or when generating shared LAN links:

| Tier | Level | Protection & Masking Scope |
| :---: | :--- | :--- |
| 🟢 | **Public** *(Low)* | Baseline anti-jailbreak, prompt injection defense, and DAN-mode neutralization. Data is not masked. |
| 🔵 | **Internal** *(Medium)* | *Public* + Blocks exposure of API keys, bearer tokens, passwords, database URIs, and corporate credentials. |
| 🟡 | **Confidential** *(High)* | *Internal* + Automatically redacts Personally Identifiable Information (SSNs, credit cards, emails, phone numbers, person names). |
| 🔴 | **Restricted** *(Strict)* | *Confidential* + Certified strict regulatory lock: masks medical records, diagnoses, HIPAA data, salaries, and financial transaction histories. |

---

## 🎭 Reasoning Profiles & Custom Personas

Tailor how GuardRAG processes and responds to document queries:

1. **Balanced (Default)**: General-purpose reasoning delivering helpful, concise, and grounded answers.
2. **Strict Privacy**: Extra-cautious persona with aggressive redaction of sensitive contextual references.
3. **Fast Summarizer**: Direct, high-level executive bullet summaries for rapid document review.
4. **Custom Profile Builder**:
   - Define custom system persona instructions.
   - Configure chunk sizes (e.g. 500 – 4000 chars) and overlap ratios.
   - Specify custom blocked keywords and topics.
   - Settings persist automatically across sessions in the persistent storage directory.

---

## 🌐 Secure Multi-Device LAN Sharing

Host GuardRAG on your workstation or local server and collaborate across your team without exposing data to the public internet:

- **Host Authority Mode**: Only the host machine can alter security policies, switch reasoning profiles, or ingest/delete document indexes.
- **Isolated Guest Experience**: Guests access a streamlined interface with contextual suggested queries tailored to the active document.
- **Granular Share Policies**: Choose a privacy level (*Public*, *Internal*, *Confidential*, *Restricted*) specific to the shared session.
- **Local Network Broadcast**: Displays local IP access URLs (`http://192.168.x.x:8000`) for frictionless LAN connectivity.

---

## 📥 Installation

### 1. Install via pip

```bash
pip install guard-rag
```

Or install from source:

```bash
git clone https://github.com/sowmiyan-s/GUARD-RAG.git
cd GUARD-RAG
pip install -e ".[dev]"
```

### 2. Prerequisites

- **Python 3.9+**
- **Ollama**: For running local LLMs (e.g. `gemma3:1b`, `llama3.1`, `deepseek-r1`, `mistral`). Download from [ollama.com](https://ollama.com).
- **Windows Users**: Ensure the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) is installed.

---

## 🚀 Quick Start

### 1. Launch the Web Interface

Start the GuardRAG server and open the web dashboard:

```bash
guard-rag
```

Or run via Python module:

```bash
python -m guardrag.cli.main
```

The server automatically displays local and LAN access URLs:
```text
============================================================
  🛡️  GuardRAG Server Running
  Local URL:  http://localhost:8000
  LAN URL:    http://192.168.1.100:8000
============================================================
```

### 2. Docker & Container Deployment

Run GuardRAG with persistent volume storage and non-root execution:

```bash
# Using Docker Compose (Bundled GuardRAG + Ollama)
docker-compose up -d

# Or build and run standalone container
docker build -t guardrag:latest .
docker run -d -p 8000:8000 -v guardrag_data:/data guardrag:latest
```

---

### 3. Command Line Interface (CLI)

Run ad-hoc queries in headless environments, CI/CD scripts, or terminal workflows:

```bash
# Query a confidential contract with a local LLM
guard-rag --pdf path/to/contract.pdf --model llama3.1 --sensitivity Confidential
```

**CLI Configuration Flags:**

| Flag | Description | Default |
| :--- | :--- | :--- |
| `--pdf <path>` | Path to document file (PDF, TXT, DOCX, MD, CSV, JSON, LOG, PY) | *Optional* |
| `--model <name>` | Ollama LLM model name | `gemma3:1b` |
| `--ollama-host <url>` | Local or remote Ollama server endpoint | `http://localhost:11434` |
| `--sensitivity <level>` | Safety guardrail tier (`Public`, `Internal`, `Confidential`, `Restricted`) | `Internal` |
| `--chunk-size <int>` | Text chunk character size | `1000` |
| `--chunk-overlap <int>` | Text chunk overlap characters | `200` |
| `--no-guardrails` | Disable safety guardrail inspection | `False` |

---

## 🐍 Python SDK Integration

Integrate GuardRAG into your custom Python services, agents, and data pipelines:

```python
from guardrag import build_rag_chain, load_stored_rag_chain
from guardrag.utils.safety import check_input_safety, check_output_safety

# 1. Build and index document with PII and credential protection
db_id, chain = build_rag_chain(
    file_paths=["quarterly_financial_report.pdf"],
    model="llama3.1",
    sensitivity="Confidential",
    redact_pii=True,
    chunk_size=1000,
    chunk_overlap=200,
)

# 2. Query knowledge base safely
response = chain.invoke({
    "input": "Summarize the EBITDA performance and major risk factors.",
    "chat_history": []
})

print("AI Answer:\n", response["answer"])

# 3. Inspect grounded source citations
print("\n--- Verifiable Citations ---")
for doc in response.get("context", []):
    print(f"File: {doc.metadata.get('source')} | Page: {doc.metadata.get('page', 1)}")
```

---

## 📁 Supported Document Formats

GuardRAG parses, chunks, and indexes a wide range of document types:

- **Documents**: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`
- **Structured Data & Logs**: `.csv`, `.json`, `.log`
- **Source Code**: `.py`

---

## 🧪 Testing & Validation

GuardRAG includes an automated test suite covering safety guardrails, PII redactions, multi-device isolation, background process handling, and API endpoints:

```bash
python -m pytest tests/ -v
```

---

## 🤝 Contributing & License

Contributions are welcome! Please feel free to submit pull requests or file issues.

GuardRAG is open-source software licensed under the **[MIT License](LICENSE)**.

<div align="center">

Built with ❤️ by **[Sowmiyan S](https://github.com/sowmiyan-s)**

[GitHub Repository](https://github.com/sowmiyan-s/GUARD-RAG) · [Bug Reports & Feature Requests](https://github.com/sowmiyan-s/GUARD-RAG/issues)

</div>
