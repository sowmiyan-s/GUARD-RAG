<div align="center">

# 🛡️ GuardRAG

### Privacy-First, Fully Offline AI Document Assistant
**Secured by a Tiered Safety Guardrails System**  
*v1.1.5 — High-Performance, Secure, and Minimalist*

<br/>

![Python](https://img.shields.io/badge/Python-3.9%2B-3b82f6?style=for-the-badge&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=for-the-badge&logo=ollama&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Store-0064A4?style=for-the-badge&logo=meta&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **Upload any document. Ask anything. Get answers — entirely on your local machine.**  
> No cloud dependencies. No API keys. No data ever leaves your device.

</div>

---

## 💡 Use Cases

**GuardRAG** is designed for professionals and organizations that handle sensitive data and require the power of LLMs without compromising privacy.

*   **🔒 Secure Document Analysis**: Chat with confidential contracts, internal financial reports, or legal documents without uploading them to a cloud provider.
*   **🏥 Healthcare & Privacy**: Analyze medical records or research data locally, ensuring compliance with privacy standards like HIPAA or GDPR through integrated PII detection.
*   **💻 Offline Research**: Work on-the-go or in air-gapped environments. Once the models are downloaded, no internet connection is required.
*   **🛠️ Developer Productivity**: Quickly query local documentation or large codebases (via text/PDF) using a streamlined CLI or Web interface.

---

## ⚙️ Data Sensitivity Tiers

Protect your information using our built-in safety engine:

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
pip install guard-rag==1.1.5
```

### Prerequisites
1.  **Ollama**: Download and install from [ollama.com](https://ollama.com).
2.  **Model**: Pull a model to use locally (e.g., `ollama pull gemma3:1b` or `llama3.2:1b`).

---

## 🚀 Commands & Usage

GuardRAG provides a flexible CLI to interact with your documents.

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

### 3. Advanced Configuration
Customize the model, server, and safety levels:
```bash
guard-rag --pdf report.pdf --model llama3 --sensitivity Confidential --chunk-size 1000
```

### 📖 Available CLI Options

| Argument | Description | Default |
| :--- | :--- | :--- |
| `--pdf <file>` | Path to the PDF document you want to analyze. | Required for CLI |
| `--model <name>` | The Ollama model to use for inference. | `gemma3:1b` |
| `--ollama-host` | The URL of your Ollama server. | `http://localhost:11434` |
| `--sensitivity` | Safety level: `Public`, `Internal`, `Confidential`, `Restricted`. | `Internal` |
| `--chunk-size` | Size of document chunks for processing. | `1000` |
| `--no-guardrails` | Disable all safety checks (not recommended). | `False` |
| `--help` | Show all available commands and flags. | - |

---

## 🛠️ Quick Example Session

```bash
# Start a confidential session with a specific model
guard-rag --pdf Q4_Internal_Report.pdf --model llama3 --sensitivity Confidential

# Chatbot: [Q4_Internal_Report.pdf Loaded] How can I help you?
# You: What were the total earnings mentioned in the summary?
# Chatbot: Based on the document, the total earnings for Q4 were $2.4M...
```

---

<div align="center">

Built with ❤️ by **[Sowmiyan S](https://github.com/sowmiyan-s)**

[GitHub](https://github.com/sowmiyan-s/GUARD-RAG) · [PyPI](https://pypi.org/project/guard-rag/) · [Documentation](docs/INSTALL.md)

</div>
