<div align="center">

<br/>

<img src="https://img.shields.io/badge/LangChain-RAG-311b92?style=for-the-badge&logo=chainlink&logoColor=white"/>
&nbsp;
<img src="https://img.shields.io/badge/Ollama-Local%20LLM-black?style=for-the-badge&logo=ollama&logoColor=white"/>
&nbsp;
<img src="https://img.shields.io/badge/FAISS-Vector%20Store-0064A4?style=for-the-badge&logo=meta&logoColor=white"/>
&nbsp;
<img src="https://img.shields.io/badge/CLI-Command%20Line-000000?style=for-the-badge&logo=terminal&logoColor=white"/>

<br/><br/>

# GuardRAG

### A privacy-first, fully offline AI document assistant — secured by a tiered safety guardrails system

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3b82f6?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![PyPI](https://img.shields.io/pypi/v/guard-rag?style=flat-square)](https://pypi.org/project/guard-rag/)
[![Offline](https://img.shields.io/badge/Mode-100%25%20Offline-76b900?style=flat-square)](#)

<br/>

> Upload any document. Ask anything. Get answers — **entirely on your machine.**  
> No cloud. No API keys. No data leaves your device.

<div align="center">
    <h3>
        <a href="docs/INSTALL.md">📦 Installation</a>
        <span> · </span>
        <a href="https://github.com/sowmiyan-s/GUARD-RAG">📖 Documentation</a>
        <span> · </span>
        <a href="CONTRIBUTING.md">🤝 Contribute</a>
    </h3>
</div>

<br/>

---

## 🚀 Overview

**GuardRAG** is a powerful, production-ready command-line tool that lets you chat with your documents offline. By combining **LangChain**, **Ollama**, and **FAISS**, it provides a private alternative to cloud-based RAG solutions. It includes a built-in safety engine that protects sensitive data using a tiered sensitivity system.

---

## 🛠 Why GuardRAG?

Most RAG chatbots rely on cloud APIs, which creates **privacy risks** for sensitive documents — contracts, medical records, internal reports. GuardRAG solves that by:

- **Local Inference**: Runs models locally via Ollama.
- **Offline Embeddings**: Uses HuggingFace transformers strictly on your device.
- **Tiered Safety**: 4 levels of guardrails (Public → Restricted).
- **Pro Design**: Clean, modern CLI and Web interfaces.

---

## ✨ Features

- **100% Offline** — No network calls at runtime.
- **Multi-format Support** — PDF, TXT, DOCX.
- **Persistent Memory** — Disk-cached FAISS indexes for rapid re-queries.
- **Privacy-First Guardrails** — Integrated protection against jailbreaks and PII leaks.
- **Built-in Web UI** — Optional browser-based interface included in the package.

---

## ⚙️ Data Sensitivity Tiers

| Level | Badge | Protection Scope |
|---|---|---|
| **Public** | ![](https://img.shields.io/badge/-Public-22c55e?style=flat-square) | Jailbreak & prompt injection detection. |
| **Internal** | ![](https://img.shields.io/badge/-Internal-3b82f6?style=flat-square) | + API keys, credentials, tokens. |
| **Confidential** | ![](https://img.shields.io/badge/-Confidential-eab308?style=flat-square) | + SSN, email, phone, DOB, credit cards. |
| **Restricted** | ![](https://img.shields.io/badge/-Restricted-ef4444?style=flat-square) | + Medical, HIPAA/GDPR, financial data. |

---

## 📥 Installation

Install GuardRAG directly from PyPI:

```bash
pip install guard-rag
```

**Prerequisites**:
- [Ollama](https://ollama.com) installed and running.
- Pull a model (e.g., `ollama pull gemma3:1b`).

---

## 🏁 Quick Start

Once installed, simply run the `guard-rag` command:

### 1. Simple Interactive Chat
```bash
guard-rag --pdf my_doc.pdf
```

### 2. Custom Model & Sensitivity
```bash
guard-rag --pdf secret_report.pdf --model llama3.1 --sensitivity Confidential
```

### 3. Launch Web Interface
```bash
# Running without arguments launches the built-in Web UI
guard-rag
```

This will start an interactive chat session with your document.

### CLI Options

```
guard-rag --pdf <file>             Load and chat with a PDF document
          --model <model>          Ollama model to use (default: gemma3:1b)
          --ollama-host <url>      Ollama server URL (default: http://localhost:11434)
          --chunk-size <int>       Document chunk size (default: 1000)
          --chunk-overlap <int>    Chunk overlap (default: 200)
          --sensitivity <level>    Data sensitivity: Public | Internal | Confidential | Restricted
          --no-guardrails          Disable safety guardrails
          --help                   Show this help message
```

### Example Session

```bash
# Start with a PDF using Llama 3.1
guard-rag --pdf report.pdf --model llama3.1 --sensitivity Confidential

# You: What are the key findings?
# Chatbot: Based on the document, the key findings are...
```

---

## Project Structure

```
GUADRAILS-RAG-CHAT-TOOL/
│
├── guardrag/                 # Main installable package
│   ├── api/                  # FastAPI local server
│   ├── cli/                  # Command-line interface
│   ├── rag/                  # RAG pipeline logic
│   └── utils/                # General utilities
│
├── docs/                     # Documentation (INSTALL, QUICK_REFERENCE)
├── tests/                    # Unit and integration tests
├── scripts/                  # Development and maintenance scripts
├── extras/                   # Experimental / legacy components
│
├── pyproject.toml             # Modern build configuration
├── setup.py                   # Legacy support configuration
├── README.md                  # Project overview
├── CONTRIBUTING.md            # Contribution guidelines
├── CODE_OF_CONDUCT.md         # Community standards
└── LICENSE                    # MIT License open source
```

> `.guardrag_storage/` is auto-generated on first document load (FAISS cache).

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API endpoint |
| `NO_PROXY` | `huggingface.co,...` | Bypass proxy for local+HF calls |
| `PORT` | `8000` | Server port (auto-set by PaaS) |

### Chunking Parameters

Adjustable per-session via the sidebar in the UI:
- **Chunk Size** (default 1000 chars)
- **Chunk Overlap** (default 200 chars)

Different chunk settings for the same file produce a separate FAISS index automatically.

---

## Deployment

### From PyPI (recommended)

```bash
pip install guard-rag
```

### From Source

```bash
git clone https://github.com/sowmiyan-s/GUADRAILS-RAG-CHAT-TOOL.git
cd GUADRAILS-RAG-CHAT-TOOL
pip install .
```

### In a virtual environment (best practice)

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install guard-rag
```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/sowmiyan-s/GUADRAILS-RAG-CHAT-TOOL/issues).

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by **[Sowmiyan S](https://github.com/sowmiyan-s)**

*FastAPI · LangChain · Ollama · HuggingFace · FAISS · Vanilla JS*

</div>
