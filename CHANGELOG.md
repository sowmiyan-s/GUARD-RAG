# Changelog

All notable changes to GuardRAG will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
