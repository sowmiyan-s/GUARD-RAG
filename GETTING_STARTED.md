# Getting Started with GuardRAG

Welcome to GuardRAG! This guide will help you get up and running in minutes.

## 🎯 5-Minute Quick Start

### Step 1: Install GuardRAG

```bash
pip install guard-rag
```

### Step 2: Install Ollama

Download and install Ollama from [ollama.ai](https://ollama.ai)

```bash
ollama pull llama3.1
```

### Step 3: Start GuardRAG

```bash
guard-rag
```

Open your browser to `http://localhost:8000` and you're done! ✨

## 📚 Next Steps

### Upload Your First Document

1. Click **"Upload Document"** in the sidebar
2. Select a PDF, Word document, or text file
3. Choose a security level (start with **Internal**)
4. Wait for indexing to complete

### Ask Questions

Once indexed, start asking:
- *"What is this document about?"*
- *"Summarize the key points"*
- *"What are the action items?"*

All answers include source citations!

## 🔧 Common Use Cases

### Legal Document Analysis
```bash
guard-rag --pdf contract.pdf --sensitivity Restricted --model llama3.1
```

### Financial Report Summary
```bash
guard-rag --pdf financial_report.pdf --sensitivity Confidential
```

### Technical Documentation Q&A
```bash
guard-rag --pdf api_docs.pdf --model llama3.1 --query "What are the API endpoints?"
```

## 🐳 Using Docker (Optional)

If you prefer containers:

```bash
docker-compose up -d
```

Then visit `http://localhost:8000`

## ❓ Troubleshooting

### "Cannot connect to Ollama"

Make sure Ollama is running:
```bash
ollama serve
```

### "Model not found"

Download the model:
```bash
ollama pull gemma3:1b
```

### "Port 8000 already in use"

Use a different port:
```bash
guard-rag --port 8001
```

## 📖 Learning Resources

- **[Full Documentation](./README.md)** — Complete reference guide
- **[API Reference](./README.md#-python-sdk-integration)** — Python SDK documentation
- **[CLI Guide](./README.md#-command-line-interface-cli)** — Command-line options
- **[Architecture](./README.md#-architecture--security-pipeline)** — System design overview
- **[Safety Guardrails](./README.md#-4-tier-safety-guardrails)** — Security details

## 🚀 Ready for Production?

Check out the [Deployment Guide](./DEPLOYMENT.md) for:
- Docker production setup
- LAN sharing configuration
- Performance tuning
- Security hardening

## 💬 Need Help?

- **[GitHub Issues](https://github.com/sowmiyan-s/GUARD-RAG/issues)** — Report bugs or request features
- **[Discussions](https://github.com/sowmiyan-s/GUARD-RAG/discussions)** — Ask questions (if enabled)
- **[GitHub Discussions](https://github.com/sowmiyan-s/GUARD-RAG/issues)** — Community support

## 🎓 Example Projects

Coming soon! Check back for:
- Legal contract analyzer
- Medical document Q&A
- Financial report assistant
- Technical documentation chatbot

---

**Happy documenting! 🛡️**
