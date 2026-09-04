import sqlite3
import os
import json
import time
from pathlib import Path

def get_data_dir() -> Path:
    """Return the data directory for GuardRAG storage (databases, FAISS indices, policies)."""
    env_dir = os.environ.get("GUARDRAG_DATA_DIR")
    if env_dir:
        p = Path(env_dir)
    else:
        p = Path.cwd() / ".guardrag_storage"
    p.mkdir(parents=True, exist_ok=True)
    return p

def _get_connection():
    db_path = str(get_data_dir() / "sessions.db")
    conn = sqlite3.connect(db_path, timeout=15.0, check_same_thread=False)
    return conn

def init_db():
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC)")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                db_id TEXT,
                model TEXT,
                files TEXT,
                chunk_size INTEGER,
                redact_pii BOOLEAN,
                system_prompt TEXT,
                sensitivity_level TEXT,
                enable_guardrails BOOLEAN,
                temperature REAL,
                chunk_overlap INTEGER,
                custom_rules TEXT,
                messages TEXT
            )
        """)
        
        # Add read_only column if it doesn't exist (SQLite doesn't have IF NOT EXISTS for ADD COLUMN natively in all versions)
        cursor.execute("PRAGMA table_info(sessions)")
        columns = [info[1] for info in cursor.fetchall()]
        if "read_only" not in columns:
            cursor.execute("ALTER TABLE sessions ADD COLUMN read_only BOOLEAN DEFAULT 0")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS share_links (
                share_id TEXT PRIMARY KEY,
                parent_session_id TEXT,
                show_history BOOLEAN,
                read_only BOOLEAN,
                sync BOOLEAN,
                name TEXT DEFAULT 'Share Link',
                min_confidence REAL DEFAULT 0.0,
                created_at TEXT
            )
        """)
        
        cursor.execute("PRAGMA table_info(share_links)")
        share_cols = [info[1] for info in cursor.fetchall()]
        if "name" not in share_cols:
            cursor.execute("ALTER TABLE share_links ADD COLUMN name TEXT DEFAULT 'Share Link'")
        if "min_confidence" not in share_cols:
            cursor.execute("ALTER TABLE share_links ADD COLUMN min_confidence REAL DEFAULT 0.0")
        if "created_at" not in share_cols:
            cursor.execute("ALTER TABLE share_links ADD COLUMN created_at TEXT")
        if "sensitivity_level" not in share_cols:
            cursor.execute("ALTER TABLE share_links ADD COLUMN sensitivity_level TEXT DEFAULT 'Internal'")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS client_sessions (
                client_session_id TEXT PRIMARY KEY,
                share_id TEXT,
                parent_session_id TEXT,
                created_at TEXT
            )
        """)

        cursor.execute("PRAGMA table_info(client_sessions)")
        client_cols = [info[1] for info in cursor.fetchall()]
        if "client_ip" not in client_cols:
            cursor.execute("ALTER TABLE client_sessions ADD COLUMN client_ip TEXT DEFAULT 'Unknown'")
        if "user_agent" not in client_cols:
            cursor.execute("ALTER TABLE client_sessions ADD COLUMN user_agent TEXT DEFAULT 'Unknown'")
        if "last_active" not in client_cols:
            cursor.execute("ALTER TABLE client_sessions ADD COLUMN last_active TEXT DEFAULT ''")

        conn.commit()

def save_session(session_id: str, db_id: str, model: str, files: list, chunk_size: int, redact_pii: bool, system_prompt: str, sensitivity_level: str, enable_guardrails: bool, temperature: float = 0.0, chunk_overlap: int = 200, custom_rules: list = None, messages: list = None, read_only: bool = False):
    if custom_rules is None:
        custom_rules = []
    if messages is None:
        messages = []
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO sessions 
            (session_id, db_id, model, files, chunk_size, redact_pii, system_prompt, sensitivity_level, enable_guardrails, temperature, chunk_overlap, custom_rules, messages, read_only)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            db_id,
            model,
            json.dumps(files),
            chunk_size,
            int(redact_pii),
            system_prompt,
            sensitivity_level,
            int(enable_guardrails),
            temperature,
            chunk_overlap,
            json.dumps(custom_rules),
            json.dumps(messages),
            int(read_only)
        ))
        conn.commit()

def get_session(session_id: str):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT session_id, db_id, model, files, chunk_size, redact_pii, system_prompt, sensitivity_level, enable_guardrails, temperature, chunk_overlap, custom_rules, messages, read_only FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        if not row:
            return None
        
        return {
            "session_id": row[0],
            "db_id": row[1],
            "model": row[2],
            "files": json.loads(row[3]),
            "chunk_size": row[4],
            "redact_pii": bool(row[5]),
            "system_prompt": row[6],
            "sensitivity_level": row[7],
            "enable_guardrails": bool(row[8]),
            "temperature": row[9],
            "chunk_overlap": row[10],
            "custom_rules": json.loads(row[11]) if row[11] else [],
            "messages": json.loads(row[12]) if row[12] else [],
            "read_only": bool(row[13])
        }

def create_share_link(share_id: str, parent_session_id: str, show_history: bool = True, read_only: bool = False, sync: bool = True, name: str = "Share Link", min_confidence: float = 0.0, sensitivity_level: str = "Internal"):
    import time
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO share_links 
            (share_id, parent_session_id, show_history, read_only, sync, name, min_confidence, created_at, sensitivity_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (share_id, parent_session_id, int(show_history), int(read_only), int(sync), name, min_confidence, created_at, sensitivity_level))
        conn.commit()

def get_share_link(share_id: str):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT share_id, parent_session_id, show_history, read_only, sync, name, min_confidence, created_at, sensitivity_level FROM share_links WHERE share_id = ?", (share_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "share_id": row[0],
            "parent_session_id": row[1],
            "show_history": bool(row[2]),
            "read_only": bool(row[3]),
            "sync": bool(row[4]),
            "name": row[5] or "Share Link",
            "min_confidence": float(row[6] or 0.0),
            "created_at": row[7] or "",
            "sensitivity_level": row[8] if len(row) > 8 and row[8] else "Internal"
        }

def list_share_links(parent_session_id: str = None):
    with _get_connection() as conn:
        cursor = conn.cursor()
        if parent_session_id:
            cursor.execute("SELECT share_id, parent_session_id, show_history, read_only, sync, name, min_confidence, created_at, sensitivity_level FROM share_links WHERE parent_session_id = ?", (parent_session_id,))
        else:
            cursor.execute("SELECT share_id, parent_session_id, show_history, read_only, sync, name, min_confidence, created_at, sensitivity_level FROM share_links")
        rows = cursor.fetchall()
        return [{
            "share_id": row[0],
            "parent_session_id": row[1],
            "show_history": bool(row[2]),
            "read_only": bool(row[3]),
            "sync": bool(row[4]),
            "name": row[5] or "Share Link",
            "min_confidence": float(row[6] or 0.0),
            "created_at": row[7] or "",
            "sensitivity_level": row[8] if len(row) > 8 and row[8] else "Internal"
        } for row in rows]

def delete_share_link(share_id: str):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM share_links WHERE share_id = ?", (share_id,))
        conn.commit()

def register_client_session(client_session_id: str, share_id: str, parent_session_id: str, client_ip: str = "Unknown", user_agent: str = "Unknown"):
    import time
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO client_sessions (client_session_id, share_id, parent_session_id, created_at, client_ip, user_agent, last_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(client_session_id) DO UPDATE SET
                last_active = excluded.last_active,
                client_ip = CASE WHEN excluded.client_ip != 'Unknown' THEN excluded.client_ip ELSE client_sessions.client_ip END,
                user_agent = CASE WHEN excluded.user_agent != 'Unknown' THEN excluded.user_agent ELSE client_sessions.user_agent END
        """, (client_session_id, share_id, parent_session_id, now, client_ip, user_agent, now))
        conn.commit()

def touch_client_session(client_session_id: str):
    import time
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE client_sessions SET last_active = ? WHERE client_session_id = ?", (now, client_session_id))
        conn.commit()

def get_client_session(client_session_id: str):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT client_session_id, share_id, parent_session_id, created_at, client_ip, user_agent, last_active FROM client_sessions WHERE client_session_id = ?", (client_session_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "client_session_id": row[0],
            "share_id": row[1],
            "parent_session_id": row[2],
            "created_at": row[3],
            "client_ip": row[4] or "Unknown",
            "user_agent": row[5] or "Unknown",
            "last_active": row[6] or row[3]
        }

def list_client_sessions(parent_session_id: str):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cs.client_session_id, cs.share_id, cs.created_at, sl.name, cs.client_ip, cs.user_agent, cs.last_active
            FROM client_sessions cs
            LEFT JOIN share_links sl ON cs.share_id = sl.share_id
            WHERE cs.parent_session_id = ?
            ORDER BY cs.last_active DESC
        """, (parent_session_id,))
        rows = cursor.fetchall()
        clients = []
        for r in rows:
            c_sess = get_session(r[0])
            clients.append({
                "client_session_id": r[0],
                "share_id": r[1],
                "created_at": r[2],
                "share_name": r[3] or "Share Link",
                "client_ip": r[4] or "Unknown",
                "user_agent": r[5] or "Unknown",
                "last_active": r[6] or r[2] or "",
                "message_count": len(c_sess.get("messages", [])) if c_sess else 0,
                "messages": c_sess.get("messages", []) if c_sess else []
            })
        return clients

def list_sessions():
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT session_id, db_id, files FROM sessions")
        return cursor.fetchall()

def delete_session(session_id: str):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        cursor.execute("DELETE FROM client_sessions WHERE client_session_id = ?", (session_id,))
        conn.commit()

def add_audit_log(event_type: str, message: str, details: dict = None):
    """Persist structured audit log entry to SQLite."""
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    details_str = json.dumps(details or {}, ensure_ascii=False)
    try:
        with _get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (timestamp, event_type, message, details)
                VALUES (?, ?, ?, ?)
            """, (now, event_type, message, details_str))
            conn.commit()
    except Exception as e:
        print(f"Warning: Failed to persist audit log: {e}")

def get_audit_logs(limit: int = 200, offset: int = 0) -> list[dict]:
    """Retrieve audit log entries from SQLite ordered by newest first."""
    try:
        with _get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, timestamp, event_type, message, details
                FROM audit_logs
                ORDER BY id DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))
            rows = cursor.fetchall()
            logs = []
            for r in rows:
                try:
                    det = json.loads(r[4]) if r[4] else {}
                except Exception:
                    det = {}
                logs.append({
                    "id": r[0],
                    "timestamp": r[1],
                    "event_type": r[2],
                    "message": r[3],
                    "details": det
                })
            return logs
    except Exception as e:
        print(f"Warning: Failed to query audit logs: {e}")
        return []

init_db()

