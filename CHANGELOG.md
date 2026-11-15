# Changelog

All notable changes to GuardRAG will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.3] - 2026-11-15

### Added
- **Automatic Local Ollama Detection & Auto-Launch**: Automatically detects local Ollama binaries (`ollama.exe`) on system paths and starts the background server daemon if offline.
- **Pulsing Status Indicators**: Live visual indicator for Ollama daemon startup with transition to online status.
- **Unified Clean Canvas Reset (`resetToFreshState`)**: Comprehensive state reset that clears uploaded document status, active document badges, and cached storage on chat deletion or new chat.

### Fixed
- **Pre-Upload Chat Error Prevention**: Intercepted queries sent before document indexing, replacing 500 Internal Server Errors with helpful 400 Bad Request feedback and drop zone pulsing animations.
- **Stale Document Status Retention**: Fixed residual `Loaded: <filename>` status lingering on the canvas after conversation clearance or collection deletion.
- **Reasoning Stream Parser**: Enhanced streaming assistant bubble with animated thinking state and collapsible deep-thought blocks (`<think>...</think>`).

## [1.3.2] - 2026-11-15

### Added
- **Hybrid Search Engine**: Integrated zero-dependency Okapi BM25 keyword matching with dense vector retrieval using Reciprocal Rank Fusion (RRF).
- **NotebookLM-Style Offline Audio Overview**: Native browser Web Speech API voice synthesis player for document summaries and Q&A briefings without external TTS services.
- **Extended Ingestion Parsers**: Added native loaders for Microsoft Excel (`.xlsx`, `.xls`), PowerPoint (`.pptx`), and Web dumps (`.html`, `.htm`).
- **Flexible CLI Commands**: Added `--file`, `--doc`, and positional arguments alongside `--web`, `--host`, and `--port`. Both `guardrag` and `guard-rag` commands are registered.
- **Recursive Directory Ingestion**: Ingest entire nested directories of documents with a single path argument.
- **Modular Frontend Architecture**: Refactored frontend into dedicated ES modules (`ui.js`, `chat.js`) with one-click code copy snippet buttons and source citation inspectors.
- **Automated Test Coverage**: Added tests for hybrid RRF retrieval, Excel/PPTX/HTML loaders, directory ingestion, and CLI flags (83/83 tests passing).

### Fixed
- **SSE Streaming Guardrail Leak**: Implemented sliding lookahead window (`LOOKAHEAD_CHARS = 32`) preventing secrets or PII from leaking over the wire prior to safety inspection.
- **Air-Gapped Font Isolation**: Removed external Google Fonts CDN links from `index.html` and implemented high-performance native system font stacks.
- **Luhn Algorithm Checksum**: Added ISO/IEC 7812 validation to `CREDIT_CARD_REGEX` to eliminate false-positive 16-digit number redacting.
- **Entity Exclusion Allowlist**: Prevented proper nouns ("United States", "San Francisco", "Machine Learning") from being redacted as human names.
- **Ollama Native Embeddings**: Added native Ollama embedding support (`nomic-embed-text`) with automatic fallback.

### Changed
- Reorganized project layout into dedicated `docs/`, `.github/`, and `docs/strategy/` directories.
- Updated documentation and badge links in `README.md` to absolute URLs for full PyPI and GitHub compatibility.
- Fixed PyPI banner image rendering using raw GitHub CDN permalinks.
- Added GitHub templates (`bug_report.md`, `PULL_REQUEST_TEMPLATE.md`) for structured community contributions.
- Enhanced test resolution by adding `tests/conftest.py` and configuring pytest `pythonpath` in `pyproject.toml`.

## [1.3.1] - 2026-09-04

### Added
- Complete README documentation with comprehensive guides
- 4-tier safety guardrails with cumulative protection levels
- Reasoning profiles (Balanced, Strict Privacy, Fast Summarizer)
- Custom profile builder for tailored personas
- Secure multi-device LAN sharing with host-controlled permissions
- Real-time `/api/metrics` endpoint for performance monitoring
- Persistent SQLite audit logging with forensic metadata
- Docker Compose support with Ollama bundling
- Extended CLI with batch processing capabilities
- Python SDK with full RAG chain API
- Support for multiple document formats (.pdf, .docx, .txt, .md, .csv, .json, .log, .py)
- Getting Started guide for rapid onboarding
- Deployment guide for production configuration
- Issue templates for bug reports and feature requests

### Fixed
- Rendering errors in feature documentation
- Table formatting in README
- Truncated feature descriptions

### Security
- PII redaction with configurable sensitivity levels
- Credential blocking and masking
- Anti-jailbreak defenses
- Prompt injection attack sanitization
- Zero-width steganography protection
- Enterprise API key authentication

## [1.3.0] - 2026-08-28

### Added
- Base RAG implementation with Ollama integration
- FAISS vector store support
- FastEmbed ONNX embeddings
- Web UI with document upload and query interface
- Initial safety guardrail implementation

### Fixed
- Early vectorization issues
- Model loading errors

## [1.2.0] - 2026-08-15

### Added
- Document parsing for multiple formats
- Text chunking with configurable overlap
- Initial PII detection

## [1.1.0] - 2026-08-01

### Added
- Basic CLI interface
- Ollama model integration
- Simple RAG pipeline

## [1.0.0] - 2026-07-15

### Added
- Initial release
- Core RAG functionality
- Basic document indexing
- Simple query interface
