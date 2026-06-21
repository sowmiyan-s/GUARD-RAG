"""
Ollama utilities for managing local LLM processes.
"""

import json
import os
import subprocess
import time
import urllib.request


def is_ollama_running(host: str = "http://localhost:11434") -> bool:
    """Check if Ollama server or OpenAI-compatible cloud endpoint is accessible."""
    api_key = os.environ.get("OLLAMA_API_KEY") or os.environ.get("OPENAI_API_KEY")
    host_clean = host.rstrip("/")
    
    # Try Ollama index page
    try:
        req = urllib.request.Request(host_clean + "/", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        urllib.request.urlopen(req, timeout=3)
        return True
    except Exception:
        pass

    # Try OpenAI-style models endpoint
    try:
        url = host_clean
        if not url.endswith("/v1") and "localhost" not in url and "127.0.0.1" not in url:
            if "groq" in url:
                url = url + "/openai/v1"
            else:
                url = url + "/v1"
        req = urllib.request.Request(url + "/models", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        urllib.request.urlopen(req, timeout=3)
        return True
    except Exception:
        return False


def get_installed_models(host: str = "http://localhost:11434") -> list[str]:
    """Get list of installed models from Ollama or OpenAI-style cloud endpoint."""
    api_key = os.environ.get("OLLAMA_API_KEY") or os.environ.get("OPENAI_API_KEY")
    host_clean = host.rstrip("/")
    
    # Try Ollama tags
    try:
        req = urllib.request.Request(host_clean + "/api/tags", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        res = urllib.request.urlopen(req, timeout=3)
        data = json.loads(res.read().decode("utf-8"))
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        pass

    # Try OpenAI-style models endpoint
    try:
        url = host_clean
        if not url.endswith("/v1") and "localhost" not in url and "127.0.0.1" not in url:
            if "groq" in url:
                url = url + "/openai/v1"
            else:
                url = url + "/v1"
        req = urllib.request.Request(url + "/models", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        res = urllib.request.urlopen(req, timeout=3)
        data = json.loads(res.read().decode("utf-8"))
        return [m["id"] for m in data.get("data", [])]
    except Exception:
        return []

def get_ollama_version(host: str = "http://localhost:11434") -> str:
    """Get Ollama server version."""
    try:
        req = urllib.request.urlopen(host.rstrip("/") + "/api/version", timeout=3)
        data = json.loads(req.read().decode("utf-8"))
        return data.get("version", "unknown")
    except Exception:
        # Fallback to CLI check if server not reachable or endpoint fails
        try:
            res = subprocess.check_output(["ollama", "--version"], stderr=subprocess.STDOUT, text=True)
            return res.strip().split()[-1]
        except Exception:
            return "unknown"


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
