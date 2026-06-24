"""
GuardRAG — Session Sharing API Test Suite
"""

import unittest
from fastapi.testclient import TestClient
from guardrag.api.main import app, _sessions

class TestAPIShare(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        _sessions.clear()

    def test_get_session_info_404(self):
        response = self.client.get("/api/sessions/info/nonexistent_session")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)

    def test_get_session_info_success(self):
        dummy_session_id = "test_sess_123"
        _sessions[dummy_session_id] = {
            "db_id": "db_xyz",
            "files": ["doc1.pdf", "doc2.txt"],
            "model": "gemma3:1b",
            "sensitivity_level": "Confidential",
            "enable_guardrails": False,
            "system_prompt": "Test assistant rules",
            "ollama_host": "http://ollama-server:11434",
            "custom_rules": ["rule1", "rule2"],
        }

        response = self.client.get(f"/api/sessions/info/{dummy_session_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["db_id"], "db_xyz")
        self.assertEqual(data["files"], ["doc1.pdf", "doc2.txt"])
        self.assertEqual(data["model"], "gemma3:1b")
        self.assertEqual(data["sensitivity_level"], "Confidential")
        self.assertEqual(data["enable_guardrails"], False)
        self.assertEqual(data["system_prompt"], "Test assistant rules")
        self.assertEqual(data["ollama_host"], "http://ollama-server:11434")
        self.assertEqual(data["custom_rules"], ["rule1", "rule2"])

if __name__ == "__main__":
    unittest.main()
