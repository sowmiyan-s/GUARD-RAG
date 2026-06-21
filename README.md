<div align="center">

# 🛡️ GuardRAG

### Privacy-First, Fully Offline AI Document Assistant
**Secured by a Tiered Safety Guardrails System**  
*v1.2.4 — High-Performance, Secure, and Professional*

<br/>

![Python](https://img.shields.io/badge/Python-3.9%2B-3b82f6?style=for-the-badge&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=for-the-badge&logo=ollama&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Store-0064A4?style=for-the-badge&logo=meta&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **Upload any document. Ask anything. Get answers — entirely on your local machine or using secure cloud endpoints.**  
> Supports offline local models and OpenAI-compatible cloud APIs with fully customized security boundaries.

</div>

---

## 💡 What's New in v1.2.4

*   **🌐 OpenAI-Compatible Cloud Integration**: Easily switch to high-performance cloud endpoints (Groq, OpenRouter, OpenAI, Anthropic, Cohere) with full API key security.
*   **🔄 Dynamic Model & Host Switching**: Swap Ollama hosts or LLM models directly from the frontend UI without restarting the application or re-uploading documents.
*   **🛡️ Tiered Safety Guardrails**: Fully offline safety engine (Public, Internal, Confidential, Restricted) preventing jailbreaks, credential leaks, and PII leaks.
*   **🦁 Brave Shields & CORS Fallback**: Enhanced compatibility featuring automatic backend proxy health checks when direct local browser fetches are blocked by privacy shields.
*   **📚 Document Library**: Persisted document collections with a visual session management panel (rehydrate or delete stored FAISS indices).
*   **⚡ Faster Indexing**: Optimized FAISS batching and retrieval parameters.

---

## 💡 Use Cases

**GuardRAG** is designed for professionals and organizations that handle sensitive data and require the power of LLMs without compromising privacy.

*   **🔒 Secure Document Analysis**: Chat with confidential contracts, internal financial reports, or legal documents without uploading them to a cloud provider.
*   **🏥 Healthcare & Privacy**: Analyze medical records or research data locally, ensuring compliance with privacy standards like HIPAA or GDPR through integrated PII detection.
*   **💻 Offline Research**: Work on-the-go or in air-gapped environments. Once the models are downloaded, no internet connection is required.
*   **🛠️ Developer Productivity**: Quickly query local documentation or large codebases (via text/PDF) using a streamlined CLI or Web interface.

---

## ⚙️ Data Sensitivity Tiers

Protect your information using our built-in safety engine (processed entirely offline):

| Level | Protection Scope |
| :--- | :--- |
| **🟢 Public** | Detects jailbreaks and basic prompt injections. |
| **🔵 Internal** | Adds detection for API keys, credentials, and tokens. |
| **🟡 Confidential** | Protects SSNs, emails, phone numbers, and credit card info. |
| **🔴 Restricted** | Strict protection for medical history, HIPAA/GDPR, and financial data. |

---

## 📥 Installation

Install the package directly from PyPI:

```bash
# Recommended stable version
pip install guard-rag
```

### Prerequisites
1.  **Ollama (Optional for local execution)**: Download and install from [ollama.com](https://ollama.com).
2.  **Model**: Pull a model to use locally (e.g., `ollama pull gemma3:1b`).
3.  **Windows Users**: You **must** have the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) installed to run the AI engine.

---

## 🚀 Commands & Usage

GuardRAG provides a flexible CLI and a web interface to interact with your documents.

### 1. Launch the Web Interface
Simply run the command with no arguments to start the local server and open the UI in your browser:
```bash
guard-rag
```

### 2. Chat with a Document via CLI
Start an interactive chat session directly in your terminal:
```bash
guard-rag --pdf path/to/my_document.pdf
```

### 3. Advanced Configuration & Cloud Endpoints
Set environment variables for cloud LLMs (Groq, OpenRouter, OpenAI, etc.):
```bash
# Optional API Keys for cloud execution
export OPENAI_API_KEY="your-openai-api-key"
export GROQ_API_KEY="your-groq-api-key"
export OPENROUTER_API_KEY="your-openrouter-api-key"
```

Customize the model, server, and safety levels:
```bash
# Custom local model
guard-rag --pdf report.pdf --model llama3 --sensitivity Confidential --chunk-size 1000

# Cloud model via Groq API
guard-rag --pdf report.pdf --model llama-3.1-8b-instant --ollama-host https://api.groq.com/openai/v1 --sensitivity Restricted
```

---

## 📖 Available CLI Options

| Argument | Description | Default |
| :--- | :--- | :--- |
| `--pdf <file>` | Path to the PDF document you want to analyze. | Required for CLI |
| `--model <name>` | The Ollama or OpenAI-compatible model name. | `gemma3:1b` |
| `--ollama-host` | The URL of Ollama or OpenAI-compatible endpoint. | `http://localhost:11434` |
| `--sensitivity` | Safety level: `Public`, `Internal`, `Confidential`, `Restricted`. | `Internal` |
| `--chunk-size` | Size of document chunks for processing. | `1000` |
| `--chunk-overlap` | Overlap between document chunks. | `200` |
| `--no-guardrails` | Disable all safety checks (not recommended). | `False` |
| `--help` | Show all available commands and flags. | - |

---

<div align="center">

Built with ❤️ by **[Sowmiyan S](https://github.com/sowmiyan-s)**

[GitHub](https://github.com/sowmiyan-s/GUARD-RAG) · [PyPI](https://pypi.org/project/guard-rag/)

</div>
