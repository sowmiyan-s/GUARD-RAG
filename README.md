<div align="center">

# 🛡️ GuardRAG

### Privacy-First, Fully Offline AI Document Assistant
**Secured by a Tiered Safety Guardrails System**

[![PyPI version](https://img.shields.io/pypi/v/guard-rag?style=for-the-badge&color=3b82f6)](https://pypi.org/project/guard-rag/)
![Python](https://img.shields.io/badge/Python-3.9%2B-3b82f6?style=for-the-badge&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=for-the-badge&logo=ollama&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Store-0064A4?style=for-the-badge&logo=meta&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **Upload any document. Ask anything. Get grounded, source-cited answers —  
> entirely on your machine or using secure cloud endpoints.**  
> Every answer is guarded by a tiered safety engine that prevents jailbreaks, PII leaks, and credential exposure.

</div>

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🧠 **RAG Pipeline** | Retrieval-Augmented Generation with FAISS, LangChain, and HuggingFace embeddings |
| 🛡️ **4-Tier Safety Guardrails** | Jailbreak detection, PII protection, credential blocking — fully offline |
| 🌐 **Web UI** | Clean, dark-mode browser interface with chat history, tabs, and document library |
| 💻 **CLI Mode** | Terminal-based interactive chat — no browser needed |
| 📚 **Document Library** | Persist FAISS indices and reload sessions without re-uploading |
| 🔗 **Source Citations** | Every answer cites which document and chunk it came from |
| 🔒 **PII Redaction** | Automatic context-aware redaction of names, emails, SSNs before indexing |
| ✂️ **Manual Redactions** | Specify custom keywords to scrub from documents before embedding |
| 🔄 **Dynamic Model Switching** | Swap LLM model or Ollama host mid-session without restarting |
| ☁️ **Cloud API Support** | Works with Groq, OpenRouter, OpenAI, Anthropic, Cohere via OpenAI-compatible API |
| 🔌 **Pluggable Vector Stores** | FAISS (default), Qdrant, or Chroma — switch from the settings panel |
| 📡 **LAN Sharing** | Access from any device on your local network (auto-detected LAN IP on startup) |
| 🔎 **Smart Retrieval** | Bypasses LLM reformulation on first turn; auto-tunes `k` for local vs cloud LLMs |
| 🧪 **Fully Tested** | 60-test suite covering safety, RAG, CLI parsing, and Ollama utilities |

---

## 💡 Use Cases

GuardRAG is designed for professionals and organizations that handle sensitive data and need the power of LLMs **without sacrificing privacy**.

### 🔒 Secure Contract & Legal Document Analysis
Lawyers and compliance officers can query confidential contracts, NDAs, and legal briefs entirely on a local machine. No data ever leaves your network. The **Confidential** or **Restricted** sensitivity tiers automatically block queries and answers that would expose sensitive clauses.

### 🏥 Healthcare & Clinical Research
Analyze patient records, clinical trial PDFs, or research papers with PII redaction enabled. GuardRAG replaces names, SSNs, and medical identifiers with tokens before indexing — the LLM never sees raw patient data.

### 🏦 Financial & Audit Reports
Query earnings reports, internal financial statements, or audit PDFs. The **Restricted** tier blocks any attempt to extract account numbers, salary data, or financial model details through either the input or output channel.

### 🔐 Enterprise Internal Knowledge Base
Build an internal Q&A system over HR policies, onboarding docs, or engineering runbooks. Run it on a company server (LAN mode) so the entire team can access it from their browsers — no external API calls needed.

### 📖 Research & Academic Literature
Academics can index large corpora of papers and query across them with exact citations. The source-citation feature shows which paper each answer was drawn from.

### 💻 Developer Documentation Assistant
Index local API docs, architecture decision records (ADRs), or README files and ask questions in natural language — much faster than `Ctrl+F` searching.

### 🌐 Air-Gapped Environments
Once HuggingFace embeddings and Ollama models are downloaded, GuardRAG operates with **zero internet dependency**. Perfect for classified or air-gapped systems.

---

## ⚙️ Data Sensitivity Tiers

The 4-tier safety engine runs **entirely offline** — no cloud safety API is called.

| Tier | Badge | What it blocks |
| :--- | :---: | :--- |
| **Public** | 🟢 | Jailbreaks, prompt injections, DAN-mode, `ignore instructions` |
| **Internal** | 🔵 | + API keys, bearer tokens, passwords, credentials |
| **Confidential** | 🟡 | + SSNs, emails, phone numbers, credit card numbers |
| **Restricted** | 🔴 | + Medical records, diagnoses, HIPAA/GDPR data, salary info |

Both **input** (user question) and **output** (LLM answer) are independently checked. A blocked response is replaced with a `[REDACTED]` message and logged in the Security Sandbox Auditor.

---

## 📥 Installation

```bash
pip install guard-rag
```

### Prerequisites

1. **Ollama** *(for local/offline use)*: Install from [ollama.com](https://ollama.com) then pull a model:
   ```bash
   ollama pull gemma3:1b        # lightweight — good for most docs
   ollama pull llama3.1         # more capable — requires more RAM
   ```

2. **Windows Users**: Install the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) — required for PyTorch/FAISS on Windows.

3. **Cloud API** *(optional)*: Set your API key as an environment variable:
   ```bash
   # .env file or shell export
   OPENAI_API_KEY=sk-...
   GROQ_API_KEY=gsk_...
   OPENROUTER_API_KEY=sk-or-...
   ```

---

## 🚀 Quick Start

### Option A — Web Interface (recommended)

Run with no arguments to launch the browser UI:

```bash
guard-rag
```

The terminal will print your access URLs:

```
ACCESS (Local):  http://127.0.0.1:8000
ACCESS (LAN):    http://10.0.0.5:8000       ← share with your team
```

**Web UI Workflow:**
1. **Upload** — drag & drop PDF, TXT, or DOCX files into the drop zone
2. **Configure** — choose your model, sensitivity tier, and optional PII redaction
3. **Process** — click "Process Documents" to build the vector index
4. **Chat** — switch to the Chat tab and start asking questions
5. **Citations** — every answer shows the source document and relevance score
6. **Library** — reopen past document sessions without re-uploading

### Option B — CLI Mode

Chat with a single document directly in your terminal:

```bash
guard-rag --pdf path/to/document.pdf
```

---

## 📖 CLI Reference

```bash
guard-rag [OPTIONS]
```

| Option | Description | Default |
| :--- | :--- | :--- |
| *(no args)* | Launch the Web UI | — |
| `--pdf <file>` | Path to document (PDF, TXT, DOCX) | **Required** for CLI mode |
| `--model <name>` | LLM model name (Ollama or cloud) | `gemma3:1b` |
| `--ollama-host <url>` | Ollama or OpenAI-compatible endpoint | `http://localhost:11434` |
| `--sensitivity <level>` | `Public` / `Internal` / `Confidential` / `Restricted` | `Internal` |
| `--chunk-size <int>` | Token size per document chunk | `1000` |
| `--chunk-overlap <int>` | Overlap tokens between adjacent chunks | `200` |
| `--no-guardrails` | Disable safety checks entirely | `False` |
| `--help` | Show help and exit | — |

### CLI Examples

```bash
# Local model, Confidential-level safety
guard-rag --pdf contracts/nda.pdf --model llama3.1 --sensitivity Confidential

# Cloud model via Groq (fast inference)
guard-rag --pdf research.pdf --model llama-3.1-8b-instant \
    --ollama-host https://api.groq.com --sensitivity Internal

# Cloud model via OpenRouter
guard-rag --pdf report.pdf --model openai/gpt-4o \
    --ollama-host https://openrouter.ai/api --sensitivity Restricted

# Tighter chunking for dense technical documents
guard-rag --pdf api_docs.pdf --chunk-size 500 --chunk-overlap 100
```

---

## 🐍 Python SDK

Use GuardRAG directly in your Python code:

```python
from guardrag import build_rag_chain, load_stored_rag_chain

# ── Build a new RAG chain from documents ─────────────────────────────────────
db_id, chain = build_rag_chain(
    file_paths=["report.pdf", "policy.docx"],
    model="gemma3:1b",
    ollama_host="http://localhost:11434",
    sensitivity="Confidential",      # optional: passed through to check_input_safety
    redact_pii=True,                 # auto-redact names, emails, SSNs before indexing
    manual_redactions=["ProjectX"],  # custom words to scrub from documents
    system_prompt=None,              # use the default GuardRAG prompt
)

# ── Query the chain ───────────────────────────────────────────────────────────
result = chain.invoke({
    "input": "What are the key obligations of the licensee?",
    "chat_history": []
})
print(result["answer"])
for citation in result.get("context", []):
    print(f"  Source: {citation.metadata['source']}")

# ── Reload a persisted session later (no re-upload) ──────────────────────────
chain = load_stored_rag_chain(db_id=db_id, model="gemma3:1b")
```

### Safety Utilities

```python
from guardrag.utils.safety import check_input_safety, check_output_safety

# Returns None if clean, or a block message string if flagged
blocked = check_input_safety(
    user_input="What is the patient's diagnosis?",
    sensitivity="Restricted",
    enabled=True,
    custom_rules=["ProjectX", "salary breakdown"],
)
if blocked:
    print(f"Blocked: {blocked}")
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GuardRAG                             │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Frontend │───▶│  FastAPI API │───▶│  Safety Engine    │  │
│  │ (Web UI) │    │  /api/upload │    │  Input + Output   │  │
│  └──────────┘    │  /api/chat   │    │  4-Tier Guardrail │  │
│                  └──────┬───────┘    └───────────────────┘  │
│                         │                                   │
│                  ┌──────▼────────────────────┐              │
│                  │      RAG Core             │              │
│                  │  ┌─────────────────────┐  │              │
│                  │  │  Document Loaders   │  │              │
│                  │  │  PDF / TXT / DOCX   │  │              │
│                  │  └────────┬────────────┘  │              │
│                  │           │               │              │
│                  │  ┌────────▼────────────┐  │              │
│                  │  │  PII Redactor       │  │              │
│                  │  │  (optional)         │  │              │
│                  │  └────────┬────────────┘  │              │
│                  │           │               │              │
│                  │  ┌────────▼────────────┐  │              │
│                  │  │  Text Splitter      │  │              │
│                  │  │  RecursiveChar      │  │              │
│                  │  └────────┬────────────┘  │              │
│                  │           │               │              │
│                  │  ┌────────▼────────────┐  │              │
│                  │  │  Vector Store       │  │              │
│                  │  │  FAISS / Qdrant /   │  │              │
│                  │  │  Chroma             │  │              │
│                  │  └────────┬────────────┘  │              │
│                  │           │               │              │
│                  │  ┌────────▼────────────┐  │              │
│                  │  │  GuardRAGChain      │  │              │
│                  │  │  LLM (Ollama/Cloud) │  │              │
│                  │  └─────────────────────┘  │              │
│                  └───────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- `GuardRAGChain` bypasses the history-aware LLM reformulation call on the first turn (saves ~1 LLM round-trip)
- Documents are chunked with `source` metadata so citations always show the originating filename
- Cloud LLMs use `k=8` retrieved chunks; local models use `k=4` to avoid context overflow
- Word-boundary pattern matching in the safety engine prevents false positives on substring matches

---

## 🔌 Supported Models & Endpoints

| Provider | Endpoint URL | Example Model |
| :--- | :--- | :--- |
| **Ollama** *(local)* | `http://localhost:11434` | `gemma3:1b`, `llama3.1`, `mistral` |
| **Groq** | `https://api.groq.com` | `llama-3.1-8b-instant` |
| **OpenRouter** | `https://openrouter.ai/api` | `openai/gpt-4o`, `meta-llama/llama-3-8b` |
| **OpenAI** | `https://api.openai.com` | `gpt-4o`, `gpt-4o-mini` |
| **Anthropic** | `https://api.anthropic.com` | `claude-3-5-sonnet` |
| **Cohere** | `https://api.cohere.ai` | `command-r` |
| **Any OpenAI-compatible** | Custom URL | Any model name |

---

## 📄 Supported File Types

| Format | Extension | Notes |
| :--- | :--- | :--- |
| PDF | `.pdf` | Full text extraction via `pypdf` |
| Plain Text | `.txt` | UTF-8 encoding |
| Word Documents | `.docx`, `.doc` | Via `docx2txt` |

---

## 🧪 Running Tests

```bash
# Run the full test suite (60 tests)
python -m pytest

# Verbose output with coverage
python -m pytest -v --cov=guardrag
```

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!  
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

Built with ❤️ by **[Sowmiyan S](https://github.com/sowmiyan-s)**

[GitHub](https://github.com/sowmiyan-s/GUARD-RAG) · [PyPI](https://pypi.org/project/guard-rag/) · [Issues](https://github.com/sowmiyan-s/GUARD-RAG/issues)

</div>
