# Security Policy

GuardRAG is committed to data privacy and security. By design, all data processing, including document embedding and LLM inference, takes place **locally** on your own hardware. 

## Reporting Security Issues

If you identify a security vulnerability that could compromise local data privacy or system integrity:

1.  **Do not** open a public issue.
2.  **Report the issue** privately via email or GitHub security advisories if supported.
3.  Include a detailed description of the vulnerability and provide steps to reproduce it.

## Design Philosophy

-   **Zero Cloud**: No external network calls are made at runtime by the core inference engine.
-   **Guarded Input/Output**: All data passes through active security guardrails to prevent PII leakage and prompt injection.
-   **Persistent Local Cache**: Vector stores are persisted locally (`.faiss_storage/`) and are never transmitted.

---

**Note**: Since the software runs on your hardware, ensure you manage your local storage safely.
