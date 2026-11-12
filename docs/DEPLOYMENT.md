# Deployment Guide

Production deployment strategies and best practices for GuardRAG.

## 🐳 Docker Production Deployment

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    networks:
      - guardrag_net

  guardrag:
    build: .
    depends_on:
      - ollama
    ports:
      - "8000:8000"
    volumes:
      - guardrag_data:/data
      - ./config:/etc/guardrag:ro
    environment:
      - GUARDRAG_OLLAMA_HOST=http://ollama:11434
      - GUARDRAG_API_KEY=${GUARDRAG_API_KEY}
      - GUARDRAG_LOG_LEVEL=INFO
      - GUARDRAG_DEFAULT_SENSITIVITY=Internal
    networks:
      - guardrag_net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ollama_data:
  guardrag_data:

networks:
  guardrag_net:
    driver: bridge
```

### Option 2: Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guardrag
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: guardrag
  template:
    metadata:
      labels:
        app: guardrag
    spec:
      containers:
      - name: guardrag
        image: guardrag:latest
        ports:
        - containerPort: 8000
        env:
        - name: GUARDRAG_OLLAMA_HOST
          value: "http://ollama-service:11434"
        - name: GUARDRAG_API_KEY
          valueFrom:
            secretKeyRef:
              name: guardrag-secrets
              key: api-key
        volumeMounts:
        - name: data
          mountPath: /data
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: guardrag-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: guardrag-service
spec:
  selector:
    app: guardrag
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

## 🔒 Security Configuration

### API Key Protection

```bash
# Set strong API key
export GUARDRAG_API_KEY="$(openssl rand -hex 32)"

# Use in requests
curl -H "X-API-Key: $GUARDRAG_API_KEY" http://localhost:8000/api/chat
```

### SSL/TLS with Nginx

```nginx
upstream guardrag {
    server localhost:8000;
}

server {
    listen 443 ssl http2;
    server_name documents.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://guardrag;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Require authentication
    location /api/admin {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://guardrag;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name documents.example.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 Performance Tuning

### Environment Variables

```bash
# Memory management
export GUARDRAG_MAX_MEMORY=8000  # MB
export GUARDRAG_CACHE_SIZE=2000  # MB

# Model configuration
export GUARDRAG_MODEL_TIMEOUT=300  # seconds
export GUARDRAG_BATCH_SIZE=32

# API configuration
export GUARDRAG_WORKER_THREADS=4
export GUARDRAG_REQUEST_TIMEOUT=60

# Logging
export GUARDRAG_LOG_LEVEL=INFO
export GUARDRAG_LOG_FILE=/var/log/guardrag.log
```

### Database Optimization

```python
# config/guardrag.yaml
database:
  backend: sqlite
  path: /data/guardrag.db
  wal_enabled: true
  vacuum_interval: 3600  # seconds
  optimize_interval: 86400  # seconds

vectorstore:
  type: faiss
  path: /data/indexes
  auto_refresh: true
  compression: true
```

## 🚀 Scaling Strategies

### Load Balancing with HAProxy

```
global
    maxconn 4096
    log stdout local0
    log stdout local1 notice

defaults
    log     global
    mode    http
    option  httplog
    option  denyempty
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend guardrag_lb
    bind *:80
    default_backend guardrag_servers

backend guardrag_servers
    balance roundrobin
    server srv1 localhost:8001 check
    server srv2 localhost:8002 check
    server srv3 localhost:8003 check
```

### Multi-Instance Setup

```bash
#!/bin/bash
# run-multiple-instances.sh

for i in {1..3}; do
    PORT=$((8000 + i))
    WORKER_ID=$i
    
    docker run -d \
        --name guardrag-$i \
        -p $PORT:8000 \
        -e GUARDRAG_WORKER_ID=$WORKER_ID \
        -v shared_data:/data \
        guardrag:latest
done
```

## 📈 Monitoring & Logging

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'guardrag'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "GuardRAG Monitoring",
    "panels": [
      {
        "title": "Requests Per Minute",
        "targets": [
          {"expr": "rate(guardrag_requests_total[1m])"}
        ]
      },
      {
        "title": "Average Response Time",
        "targets": [
          {"expr": "guardrag_response_time_ms{quantile='0.5'}"}
        ]
      },
      {
        "title": "Document Index Size",
        "targets": [
          {"expr": "guardrag_index_size_bytes"}
        ]
      },
      {
        "title": "API Key Usage",
        "targets": [
          {"expr": "rate(guardrag_api_calls_total[5m])"}
        ]
      }
    ]
  }
}
```

### ELK Stack Logging

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/guardrag.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "guardrag-%{+yyyy.MM.dd}"

setup.kibana:
  host: "kibana:5601"
```

## 🧪 Health Checks

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed status
curl http://localhost:8000/api/status

# Database integrity check
curl -H "X-API-Key: $GUARDRAG_API_KEY" \
     http://localhost:8000/api/admin/health/database

# Model availability check
curl http://localhost:8000/api/models/available
```

## 🔧 Backup & Recovery

### Automated Backup

```bash
#!/bin/bash
# backup-guardrag.sh

BACKUP_DIR="/backups/guardrag"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup data directory
tar -czf "$BACKUP_DIR/data_$TIMESTAMP.tar.gz" /data/

# Backup database
sqlite3 /data/guardrag.db ".backup '$BACKUP_DIR/db_$TIMESTAMP.backup'"

# Keep only last 7 backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

### Restore from Backup

```bash
# Restore data
tar -xzf /backups/guardrag/data_20260904_120000.tar.gz -C /

# Restore database
sqlite3 /data/guardrag.db ".restore /backups/guardrag/db_20260904_120000.backup"

# Restart service
docker-compose restart guardrag
```

## 📋 Pre-Launch Checklist

- [ ] SSL/TLS certificates configured
- [ ] API key set and secured
- [ ] Database backups enabled
- [ ] Monitoring configured (Prometheus/Grafana)
- [ ] Logging aggregation set up (ELK/Splunk)
- [ ] Rate limiting configured
- [ ] CORS policies reviewed
- [ ] Load balancer tested
- [ ] Failover tested
- [ ] Documentation updated
- [ ] Team trained
- [ ] Incident response plan ready

## 🚨 Troubleshooting Production Issues

### High Memory Usage

```bash
# Check memory consumption
docker stats guardrag

# Reduce cache size
export GUARDRAG_CACHE_SIZE=500

# Restart container
docker-compose restart guardrag
```

### Slow Response Times

```bash
# Check system resources
docker stats

# Verify Ollama connectivity
curl http://ollama:11434/api/tags

# Check database size
du -sh /data/guardrag.db

# Optimize database
sqlite3 /data/guardrag.db "VACUUM; ANALYZE;"
```

### Connection Pool Issues

```python
# config/guardrag.yaml
database:
  connection_pool_size: 10
  connection_pool_timeout: 30
  retry_attempts: 3
  retry_delay: 1000  # ms
```

---

For questions, open an [issue](https://github.com/sowmiyan-s/GUARD-RAG/issues) on GitHub.
