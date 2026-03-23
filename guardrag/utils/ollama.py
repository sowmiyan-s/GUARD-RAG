"""
Ollama utilities for managing local LLM processes.
"""

import os
import time
import json
import subprocess
import urllib.request
from typing import Optional, List


def is_ollama_running(host: str = "http://localhost:11434") -> bool:
    """Check if Ollama server is running and accessible."""
    try:
        req = urllib.request.Request(host.rstrip("/") + "/", method="GET")
        urllib.request.urlopen(req, timeout=3)
        return True
    except Exception:
        return False


def get_installed_models(host: str = "http://localhost:11434") -> List[str]:
    """Get list of installed models from Ollama."""
    try:
        req = urllib.request.urlopen(host.rstrip("/") + "/api/tags", timeout=3)
        data = json.loads(req.read().decode("utf-8"))
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


def start_ollama_server() -> bool:
    """
    Attempt to start a locally-installed Ollama process.
    
    Returns:
        True if Ollama started successfully, False otherwise.
    """
    try:
        flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        subprocess.Popen(["ollama", "serve"], creationflags=flags)
        # Wait up to 10 seconds for Ollama to start
        for _ in range(20):
            if is_ollama_running():
                return True
            time.sleep(0.5)
        return False
    except Exception:
        return False
