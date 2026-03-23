# GuragChat Quick Reference

## Installation
```bash
pip install guragchat
```

## Usage
```bash
guragchat --pdf document.pdf
```

## Basic Examples

### Simple Query
```bash
guragchat --pdf report.pdf
```

### With Custom Model
```bash
guragchat --pdf report.pdf --model llama2
```

### With Sensitivity
```bash
guragchat --pdf sensitive.pdf --sensitivity Restricted
```

### Remote Ollama
```bash
guragchat --pdf doc.pdf --ollama-host http://remote:11434
```

### Disable Guardrails
```bash
guragchat --pdf doc.pdf --no-guardrails
```

## Python API

```python
from guragchat import build_rag_chain
from langchain_core.messages import HumanMessage, AIMessage

# Build RAG
db_id, chain = build_rag_chain(["document.pdf"])

# Query with history
messages = []
result = chain.invoke({
    "input": "Your question",
    "chat_history": messages
})

print(result["answer"])

# Add to history
messages.append(HumanMessage(content="Your question"))
messages.append(AIMessage(content=result["answer"]))
```

## CLI Options

```
--pdf PATH              Document path (required)
--model MODEL           Ollama model [default: gemma3:1b]
--ollama-host HOST      Ollama URL [default: http://localhost:11434]
--chunk-size INT        Chunk size [default: 1000]
--chunk-overlap INT     Overlap [default: 200]
--sensitivity LEVEL     Public|Internal|Confidential|Restricted
--no-guardrails         Disable safety
--help                  Show help
```

## Setup

### 1. Install Ollama
- Download: https://ollama.ai
- Run: `ollama serve`
- Pull model: `ollama pull gemma3:1b`

### 2. Install GuragChat
```bash
pip install guragchat
```

### 3. Test Installation
```bash
python test_installation.py
```

### 4. Run
```bash
guragchat --pdf document.pdf
```

## Supported Models

```
ollama pull gemma3:1b          # Small & fast
ollama pull llama2             # Powerful
ollama pull mistral            # Efficient
ollama pull neural-chat        # Conversational
ollama pull orca-mini          # Compact
```

## Environment Variables

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3:1b
DATA_SENSITIVITY=Internal
ENABLE_GUARDRAILS=true
```

## Sensitivity Levels

| Level | Protection |
|-------|-----------|
| Public | Jailbreak only |
| Internal | + Credentials |
| Confidential | + PII |
| Restricted | + Medical/Financial |

## Troubleshooting

**Ollama not found**
```bash
ollama serve
```

**No models**
```bash
ollama pull gemma3:1b
ollama run gemma3:1b
```

**Module not found**
```bash
pip install --upgrade guragchat
```

**Permission error**
```bash
pip install --user guragchat
# or use virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install guragchat
```

## Useful Commands

```bash
# List installed Ollama models
ollama list

# Check Ollama status
curl http://localhost:11434/api/tags

# Show CLI help
guragchat --help

# Test installation
python test_installation.py

# Interactive query
guragchat --pdf document.pdf
```

## Performance Tips

- **Small models** (gemma3:1b) - Faster responses, less accurate
- **Large models** (llama2) - Slower, more accurate
- **GPU support** - Install `faiss-gpu` and `torch[cuda]`
- **Caching** - First run slower, subsequent faster
- **Chunk size** - Smaller chunks = more retrieval, slower

## Common Workflows

### Document Analysis
```bash
guragchat --pdf research.pdf --sensitivity Confidential
# Follow prompts to ask questions
```

### Batch Processing
```bash
for file in *.pdf; do
  echo "Analyzing $file"
  guragchat --pdf "$file" --model gemma3:1b
done
```

### Development
```python
import sys
sys.path.insert(0, '.')

from guragchat.rag.core import build_rag_chain
from guragchat.utils.safety import check_input_safety

# Your custom logic here
```

## Package Structure

```
guragchat/
├── cli/main.py          - CLI interface
├── rag/core.py          - RAG pipeline
├── utils/
│   ├── ollama.py        - Ollama utilities
│   └── safety.py        - Safety guardrails
└── api/                 - (Future API)
```

## Links

- 📦 PyPI: https://pypi.org/project/guragchat/
- 📖 Docs: See INSTALL.md
- 🐛 Issues: GitHub Issues
- 🎮 Demo: Try `guragchat --help`

---

**Made with ❤️ for privacy-conscious AI**
make it available to pip publicly