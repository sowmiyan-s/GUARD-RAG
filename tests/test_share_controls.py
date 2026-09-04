import pytest
from fastapi.testclient import TestClient
from guardrag.api.main import app
from guardrag.api import db

client = TestClient(app)

def test_full_share_control_flow():
    # 1. Create a dummy parent session
    session_id = "test_parent_host_session_123"
    db.save_session(
        session_id=session_id,
        db_id="test_db_id_123",
        model="gemma3:1b",
        files=["host_document.pdf"],
        chunk_size=1000,
        redact_pii=False,
        system_prompt="You are a host bot",
        sensitivity_level="Internal",
        enable_guardrails=True,
        messages=[{"role": "user", "content": "Hello Host"}, {"role": "assistant", "content": "Hello Guest"}]
    )

    # 2. Generate a custom share link (Read Only, History Visible, Min Confidence = 0.5)
    resp = client.post("/api/share/generate", json={
        "session_id": session_id,
        "name": "Audit Team Link",
        "show_history": True,
        "read_only": True,
        "sync": False,
        "min_confidence": 0.5
    })
    assert resp.status_code == 200
    share_id = resp.json()["share_id"]
    assert share_id is not None

    # 3. List share links
    list_resp = client.get(f"/api/share/list/{session_id}")
    assert list_resp.status_code == 200
    links = list_resp.json()["links"]
    assert len(links) >= 1
    target_link = next(l for l in links if l["share_id"] == share_id)
    assert target_link["name"] == "Audit Team Link"
    assert target_link["read_only"] is True
    assert target_link["show_history"] is True
    assert target_link["sync"] is False
    assert target_link["min_confidence"] == 0.5

    # 4. Resolve share link (as guest)
    res_resp = client.get(f"/api/share/resolve/{share_id}")
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["read_only"] is True
    assert res_data["show_history"] is True
    assert res_data["sync"] is False
    assert res_data["min_confidence"] == 0.5
    assert len(res_data["messages"]) == 2
    client_session_id = res_data["session_id"]
    assert client_session_id.startswith("client_")

    # 5. Verify client chat appears in host client-chats list
    chats_resp = client.get(f"/api/share/client-chats/{session_id}")
    assert chats_resp.status_code == 200
    client_list = chats_resp.json()["clients"]
    assert any(c["client_session_id"] == client_session_id for c in client_list)

    # 6. Verify read-only enforcement in /api/chat
    chat_resp = client.post("/api/chat", json={
        "session_id": client_session_id,
        "question": "Can I query?"
    })
    assert chat_resp.status_code == 403
    assert "read-only" in chat_resp.json()["detail"].lower()

    # 7. Revoke share link
    del_resp = client.delete(f"/api/share/revoke/{share_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # 8. Cleanup test session
    db.delete_session(session_id)
    db.delete_session(client_session_id)


def test_share_privacy_level_enforcement():
    # 1. Parent session created with Confidential level
    session_id = "test_parent_privacy_456"
    db.save_session(
        session_id=session_id,
        db_id="test_db_id_456",
        model="gemma3:1b",
        files=["financial_report.pdf"],
        chunk_size=1000,
        redact_pii=False,
        system_prompt="Host bot",
        sensitivity_level="Confidential",
        enable_guardrails=True,
        messages=[]
    )

    # 2. Host generates share link explicitly setting Restricted level
    resp = client.post("/api/share/generate", json={
        "session_id": session_id,
        "name": "Strict Auditor Link",
        "show_history": False,
        "read_only": False,
        "sync": True,
        "sensitivity_level": "Restricted"
    })
    assert resp.status_code == 200
    share_id = resp.json()["share_id"]

    # 3. Guest resolves the link and verifies Restricted level is received
    res = client.get(f"/api/share/resolve/{share_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["sensitivity_level"] == "Restricted"

    # 4. Cleanup
    db.delete_share_link(share_id)
    db.delete_session(session_id)


def test_silent_subprocess_flags():
    import os
    import subprocess
    from guardrag.utils.ollama import _silent_subprocess_kwargs
    kwargs = _silent_subprocess_kwargs()
    if os.name == "nt":
        assert "creationflags" in kwargs
        assert kwargs["creationflags"] == getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
        assert "startupinfo" in kwargs
        assert kwargs["startupinfo"].wShowWindow == 0
    else:
        assert kwargs == {}

