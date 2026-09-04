# Multi-stage production Dockerfile for GuardRAG
FROM python:3.10-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml setup.py README.md ./
COPY guardrag/ ./guardrag/

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

# Production runner image
FROM python:3.10-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and persistent storage directory
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser && \
    mkdir -p /data && \
    chown -R appuser:appgroup /app /data

# Copy installed packages and application from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    GUARDRAG_DATA_DIR=/data \
    HOST=0.0.0.0 \
    PORT=8000

USER appuser

VOLUME ["/data"]

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/config || exit 1

ENTRYPOINT ["python", "-m", "guardrag.cli.main"]
CMD ["--host", "0.0.0.0", "--port", "8000"]
