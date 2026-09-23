# 🤝 Contributing to GuardRAG

Thank you for your interest in contributing to **GuardRAG**! GuardRAG is an open-source, privacy-first AI document intelligence engine built for developers, enterprises, and privacy advocates worldwide.

We welcome all contributions—from bug fixes and documentation updates to new vector store integrations, parsers, and performance optimizations.

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Environment Setup](#-development-environment-setup)
- [Git Workflow & Branching Strategy](#-git-workflow--branching-strategy)
- [Commit Message Conventions](#-commit-message-conventions)
- [Code Style & Quality Standards](#-code-style--quality-standards)
- [Running Tests & Benchmarks](#-running-tests--benchmarks)
- [Submitting a Pull Request](#-submitting-a-pull-request)
- [Priority Areas for Contribution](#-priority-areas-for-contribution)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [GuardRAG Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [sowmisowmiyan58@gmail.com](mailto:sowmisowmiyan58@gmail.com).

---

## 💡 How Can I Contribute?

### Reporting Bugs
Before filing an issue, please check existing [GitHub Issues](https://github.com/sowmiyan-s/GUARD-RAG/issues) to avoid duplicates. When reporting a bug:
1. Include a descriptive title and summary.
2. Specify your OS (Windows, macOS, Linux), Python version, and Ollama version.
3. List minimal, reproducible steps.
4. Include relevant error tracebacks or terminal logs.

### Requesting Features
We welcome proposals for new capabilities! Please open an issue outlining:
- The problem or use case you are trying to solve.
- Why existing solutions or workarounds are insufficient.
- Suggested architectural or interface design.

---

## 💻 Development Environment Setup

### Prerequisites
- **Python 3.9 to 3.12** installed on your system.
- **Git** version control.
- **Ollama** installed locally (see [ollama.ai](https://ollama.ai)).

### Setup Instructions

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/GUARD-RAG.git
   cd GUARD-RAG
   ```

2. **Create and Activate a Virtual Environment**:
   ```bash
   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows (PowerShell)
   python -m venv venv
   venv\Scripts\Activate.ps1
   ```

3. **Install Editable Package with Development Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -e ".[dev]"
   ```

4. **Verify Installation**:
   ```bash
   guard-rag --version
   pytest -q
   ```

---

## 🌿 Git Workflow & Branching Strategy

We follow a standard feature branch workflow:

1. Sync your local `main` branch with the upstream repository:
   ```bash
   git checkout main
   git pull upstream main
   ```
2. Create a dedicated topic branch:
   ```bash
   git checkout -b feat/add-qdrant-payload-filter
   # or: git checkout -b fix/sse-stream-timeout
   ```
3. Keep commits atomic, well-scoped, and documented.

---

## 📝 Commit Message Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/). Each commit message should follow this structure:

```text
<type>(<optional scope>): <short description>

[optional longer body]

[optional issue reference]
```

### Commit Types
- `feat`: A new user-facing feature or API capability.
- `fix`: A bug fix.
- `docs`: Documentation updates, README changes, or docstrings.
- `perf`: A code change that improves CPU, memory, or network performance.
- `refactor`: Code reorganization with no functional or API changes.
- `test`: Adding missing unit tests or refactoring test suites.
- `chore`: Maintenance tasks, dependency updates, or CI config changes.

*Example:*
```bash
git commit -m "feat(rag): add support for markdown exfiltration sanitization"
```

---

## 🎨 Code Style & Quality Standards

We maintain clean, idiomatic Python adhering to PEP 8:

- **Linter & Formatter**: We use [Ruff](https://astral.sh/ruff).
  ```bash
  # Check for lint violations
  ruff check .

  # Auto-fix lint violations
  ruff check --fix .

  # Format codebase
  ruff format .
  ```
- **Type Checking**: We use `mypy` for static typing.
  ```bash
  mypy guardrag
  ```
- **Docstrings**: Provide clear Google-style or PEP 257 docstrings for all public classes, methods, and functions.

---

## 🧪 Running Tests & Benchmarks

All pull requests must pass the automated test suite before merging.

### Run Unit Tests
```bash
# Run entire test suite
pytest

# Run tests with verbose output
pytest -v

# Run a specific test module
pytest tests/test_safety.py -v

# Run with test coverage report
pytest --cov=guardrag --cov-report=term-missing
```

### Writing New Tests
- Place unit tests under `tests/`.
- Name test files with prefix `test_*.py`.
- Mock external network calls and Ollama model downloads where appropriate.

---

## 🚀 Submitting a Pull Request

1. Push your topic branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of `sowmiyan-s/GUARD-RAG`.
3. Fill out the PR template completely:
   - What does this PR do?
   - Any breaking changes?
   - How was this change tested?
4. Ensure all CI automated checks pass.
5. Address maintainer feedback promptly.

---

## 🎯 Priority Areas for Contribution

Looking for inspiration? Here are high-impact areas we welcome contributions for:

- 📄 **Additional Document Parsers**: Support for `.epub`, `.odt`, `.rtf`, scanned OCR via Tesseract.
- 🗄️ **Vector Store Connectors**: Adapters for Milvus, Chroma, or pgvector.
- 🌐 **Web Dashboard UX**: Dark/light theme toggle, advanced citation explorer, token usage graphs.
- 🌍 **Internationalization (i18n)**: UI translations and multi-lingual prompt templates.
- ⚡ **Performance Benchmarking**: Automated embedding throughput and memory profiling scripts.

---

<div align="center">

**[Return to Readme](README.md)** • **[System Architecture](ARCHITECTURE.md)** • **[Tech Stack](TECH_STACK.md)** • **[Governance](GOVERNANCE.md)**

</div>
