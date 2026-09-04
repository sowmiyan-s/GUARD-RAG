"""
Ollama utilities for managing local LLM processes.
"""

import json
import os
import subprocess
import time
import urllib.request


def _normalize_host(host: str) -> str:
    h = host.rstrip("/")
    return h.replace("://localhost", "://127.0.0.1")


def is_ollama_running(host: str = "http://localhost:11434", timeout: float = 1.0) -> bool:
    """Check if Ollama server or OpenAI-compatible cloud endpoint is accessible."""
    api_key = os.environ.get("OLLAMA_API_KEY") or os.environ.get("OPENAI_API_KEY")
    host_clean = _normalize_host(host)
    
    # Try Ollama index page
    try:
        req = urllib.request.Request(host_clean + "/", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        urllib.request.urlopen(req, timeout=timeout)
        return True
    except Exception:
        pass

    # Try OpenAI-style models endpoint
    try:
        url = host_clean
        if not url.endswith("/v1") and "127.0.0.1" not in url:
            if "groq" in url:
                url = url + "/openai/v1"
            else:
                url = url + "/v1"
        req = urllib.request.Request(url + "/models", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        urllib.request.urlopen(req, timeout=timeout)
        return True
    except Exception:
        return False


def get_installed_models(host: str = "http://localhost:11434") -> list[str]:
    """Get list of installed models from Ollama or OpenAI-style cloud endpoint."""
    api_key = os.environ.get("OLLAMA_API_KEY") or os.environ.get("OPENAI_API_KEY")
    host_clean = _normalize_host(host)
    models = []
    
    # Try Ollama tags
    try:
        req = urllib.request.Request(host_clean + "/api/tags", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        res = urllib.request.urlopen(req, timeout=2)
        data = json.loads(res.read().decode("utf-8"))
        models.extend([m["name"] for m in data.get("models", [])])
    except Exception:
        pass

    if models:
        return list(dict.fromkeys(models))

    # Try OpenAI-style models endpoint
    try:
        url = host_clean
        if not url.endswith("/v1") and "127.0.0.1" not in url:
            if "groq" in url:
                url = url + "/openai/v1"
            else:
                url = url + "/v1"
        req = urllib.request.Request(url + "/models", method="GET")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")
        res = urllib.request.urlopen(req, timeout=2)
        data = json.loads(res.read().decode("utf-8"))
        models.extend([m["id"] for m in data.get("data", [])])
    except Exception:
        pass
        
    # Always check for OpenAI API Key and add standard cloud models if available
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key and "api.openai.com" not in host_clean:
        try:
            req = urllib.request.Request("https://api.openai.com/v1/models", method="GET")
            req.add_header("Authorization", f"Bearer {openai_key}")
            res = urllib.request.urlopen(req, timeout=2)
            data = json.loads(res.read().decode("utf-8"))
            models.extend([m["id"] for m in data.get("data", [])])
        except Exception:
            pass

    return list(dict.fromkeys(models))


def _silent_subprocess_kwargs() -> dict:
    """Return kwargs to run subprocesses completely silently in the background on Windows."""
    kwargs = {}
    if os.name == "nt":
        kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
        si = subprocess.STARTUPINFO()
        si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        si.wShowWindow = 0  # SW_HIDE
        kwargs["startupinfo"] = si
    return kwargs


def get_ollama_version(host: str = "http://localhost:11434") -> str:
    """Get Ollama server version."""
    host_clean = _normalize_host(host)
    try:
        req = urllib.request.urlopen(host_clean + "/api/version", timeout=1)
        data = json.loads(req.read().decode("utf-8"))
        return data.get("version", "unknown")
    except Exception:
        return "unknown"


def start_ollama_server() -> bool:
    """
    Attempt to start a locally-installed Ollama process silently in the background.
    
    Returns:
        True if Ollama started successfully, False otherwise.
    """
    if is_ollama_running(timeout=0.5):
        return True

    import shutil
    ollama_path = None
    if os.name == "nt":
        # Check standard Windows app paths
        app_exe = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama app.exe")
        cli_exe = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe")
        prog_exe = os.path.expandvars(r"%ProgramFiles%\Ollama\ollama.exe")
        
        if os.path.exists(app_exe):
            cmd = [app_exe]
        elif os.path.exists(cli_exe):
            cmd = [cli_exe, "serve"]
        elif os.path.exists(prog_exe):
            cmd = [prog_exe, "serve"]
        else:
            which_p = shutil.which("ollama")
            cmd = [which_p or "ollama", "serve"]
    else:
        which_p = shutil.which("ollama")
        cmd = [which_p or "ollama", "serve"]

    try:
        kwargs = {}
        if os.name == "nt":
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
            si = subprocess.STARTUPINFO()
            si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            si.wShowWindow = 0  # SW_HIDE
            kwargs["creationflags"] = flags
            kwargs["startupinfo"] = si

        subprocess.Popen(
            cmd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            close_fds=True if os.name != "nt" else False,
            **kwargs,
        )
        # Wait up to 3 seconds for Ollama to bind the port
        for _ in range(6):
            if is_ollama_running(timeout=0.5):
                return True
            time.sleep(0.5)
        return True
    except Exception:
        return False


def stop_ollama_server() -> bool:
    """
    Attempt to stop the locally-running Ollama process.
    
    Returns:
        True if stopped or already offline, False if error.
    """
    if not is_ollama_running(timeout=0.5):
        return True
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/IM", "ollama.exe", "/IM", "ollama app.exe", "/IM", "ollama_llama_server.exe"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                **_silent_subprocess_kwargs(),
            )
        else:
            subprocess.run(
                ["pkill", "-f", "ollama"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        return not is_ollama_running(timeout=0.8)
    except Exception:
        return False
