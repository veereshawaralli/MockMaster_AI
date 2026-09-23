import sqlite3
import json
import os
import hashlib
import secrets
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL")
IS_POSTGRES = DATABASE_URL is not None

if IS_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor

DB_PATH = os.path.join(os.path.dirname(__file__), "interview_data.db")


class PostgresCursor:
    def __init__(self, cursor):
        self.cursor = cursor
        self._lastrowid = None

    def execute(self, sql, params=None):
        # Convert SQLite ? placeholder to PostgreSQL %s
        sql = sql.replace("?", "%s")
        
        # Intercept INSERT to get the returning ID for lastrowid
        is_insert = sql.strip().upper().startswith("INSERT")
        if is_insert:
            sql += " RETURNING id"
            
        if params:
            self.cursor.execute(sql, params)
        else:
            self.cursor.execute(sql)
            
        if is_insert:
            row = self.cursor.fetchone()
            self._lastrowid = row['id'] if row else None

    def executescript(self, sql):
        # Executes multiple queries in sequence for PostgreSQL
        self.cursor.execute(sql)

    @property
    def lastrowid(self):
        return self._lastrowid

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row else None

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows]

    @property
    def rowcount(self):
        return self.cursor.rowcount


class PostgresConnection:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return PostgresCursor(self.conn.cursor(cursor_factory=RealDictCursor))

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db():
    """Get a database connection with row factory (SQLite or PostgreSQL)."""
    if IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return PostgresConnection(conn)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn


def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()

    if IS_POSTGRES:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                password_hash TEXT,
                salt TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'Fresher',
                total_score REAL DEFAULT 0,
                total_questions INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS answers (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL,
                question TEXT NOT NULL,
                transcript TEXT,
                score INTEGER DEFAULT 0,
                clarity TEXT,
                relevance TEXT,
                confidence_score INTEGER DEFAULT 0,
                filler_count INTEGER DEFAULT 0,
                speaking_pace TEXT,
                avg_pitch REAL DEFAULT 0,
                pause_count INTEGER DEFAULT 0,
                improvement_tip TEXT,
                follow_up_question TEXT,
                missing_points TEXT DEFAULT '[]',
                strengths TEXT DEFAULT '[]',
                fillers TEXT DEFAULT '{}',
                difficulty TEXT DEFAULT 'Fresher',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id SERIAL PRIMARY KEY,
                token TEXT NOT NULL UNIQUE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
    else:
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT,
                salt TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'Fresher',
                total_score REAL DEFAULT 0,
                total_questions INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                question TEXT NOT NULL,
                transcript TEXT,
                score INTEGER DEFAULT 0,
                clarity TEXT,
                relevance TEXT,
                confidence_score INTEGER DEFAULT 0,
                filler_count INTEGER DEFAULT 0,
                speaking_pace TEXT,
                avg_pitch REAL DEFAULT 0,
                pause_count INTEGER DEFAULT 0,
                improvement_tip TEXT,
                follow_up_question TEXT,
                missing_points TEXT DEFAULT '[]',
                strengths TEXT DEFAULT '[]',
                fillers TEXT DEFAULT '{}',
                difficulty TEXT DEFAULT 'Fresher',
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS auth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL UNIQUE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)

    # Migrate older databases that predate password auth (add columns if missing).
    if IS_POSTGRES:
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT")
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS salt TEXT")
    else:
        cursor.execute("PRAGMA table_info(users)")
        cols = [row["name"] for row in cursor.fetchall()]
        if "password_hash" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        if "salt" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT")

    conn.commit()
    conn.close()


# --- Password + token auth ---

_PBKDF2_ITERATIONS = 200_000


def _hash_password(password: str, salt: str) -> str:
    """Derive a PBKDF2-HMAC-SHA256 hash (hex) from a password and hex salt."""
    dk = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), _PBKDF2_ITERATIONS
    )
    return dk.hex()


def register_user(name: str, password: str) -> dict:
    """Create a new password-protected profile. Raises ValueError on bad input."""
    name = (name or "").strip()
    if not name:
        raise ValueError("Profile name is required")
    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE LOWER(name) = LOWER(?)", (name,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("That name is already taken. Try logging in instead.")

    salt = secrets.token_hex(16)
    cursor.execute(
        "INSERT INTO users (name, password_hash, salt) VALUES (?, ?, ?)",
        (name, _hash_password(password, salt), salt),
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": user_id, "name": name}


def verify_login(name: str, password: str):
    """Return {id, name} if name+password match, else None.

    Profiles created before passwords existed have no hash yet; the first login
    to such a profile claims it by setting the password entered.
    """
    name = (name or "").strip()
    if not name or not password:
        raise ValueError("Name and password are required")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, password_hash, salt FROM users WHERE LOWER(name) = LOWER(?)",
        (name,),
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    user = dict(row)

    if not user.get("password_hash"):
        # Legacy, password-less profile: set this password now and let them in.
        salt = secrets.token_hex(16)
        cursor.execute(
            "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
            (_hash_password(password, salt), salt, user["id"]),
        )
        conn.commit()
        conn.close()
        return {"id": user["id"], "name": user["name"]}

    candidate = _hash_password(password, user["salt"])
    conn.close()
    if secrets.compare_digest(candidate, user["password_hash"]):
        return {"id": user["id"], "name": user["name"]}
    return None


def create_token(user_id: int) -> str:
    """Issue a random opaque session token bound to a user id."""
    token = secrets.token_urlsafe(32)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO auth_tokens (token, user_id) VALUES (?, ?)", (token, user_id))
    conn.commit()
    conn.close()
    return token


def get_user_by_token(token: str):
    """Resolve a bearer token to {id, name}, or None if unknown."""
    if not token:
        return None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT u.id, u.name FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ?",
        (token,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_token(token: str):
    """Invalidate a token (logout)."""
    if not token:
        return
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM auth_tokens WHERE token = ?", (token,))
    conn.commit()
    conn.close()


def get_all_users() -> list:
    """List all profiles with their session counts, for the profile picker."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.name, u.created_at,
               COUNT(s.id) as session_count
        FROM users u
        LEFT JOIN sessions s ON s.user_id = u.id
        GROUP BY u.id, u.name, u.created_at
        ORDER BY u.created_at ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# --- Session CRUD ---

def create_session(topic: str, difficulty: str = "Fresher", user_id: int = None) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (topic, difficulty, user_id) VALUES (?, ?, ?)",
        (topic, difficulty, user_id)
    )
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id


def save_answer(session_id: int, data: dict) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO answers (
            session_id, question, transcript, score, clarity, relevance,
            confidence_score, filler_count, speaking_pace, avg_pitch,
            pause_count, improvement_tip, follow_up_question,
            missing_points, strengths, fillers, difficulty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        data.get("question", ""),
        data.get("transcript", ""),
        data.get("score", 0),
        data.get("clarity", ""),
        data.get("relevance", ""),
        data.get("confidence_score", 0),
        data.get("filler_count", 0),
        data.get("speaking_pace", ""),
        data.get("avg_pitch", 0),
        data.get("pause_count", 0),
        data.get("improvement_tip", ""),
        data.get("follow_up_question", ""),
        json.dumps(data.get("missing_points", [])),
        json.dumps(data.get("strengths", [])),
        json.dumps(data.get("fillers", {})),
        data.get("difficulty", "Fresher"),
    ))
    answer_id = cursor.lastrowid

    # Update session totals
    cursor.execute("""
        UPDATE sessions SET
            total_score = (SELECT AVG(score) FROM answers WHERE session_id = ?),
            total_questions = (SELECT COUNT(*) FROM answers WHERE session_id = ?)
        WHERE id = ?
    """, (session_id, session_id, session_id))

    conn.commit()
    conn.close()
    return answer_id


def get_all_sessions(user_id: int) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, topic, difficulty, total_score, total_questions, created_at
        FROM sessions WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_session_detail(session_id: int, user_id: int = None) -> dict:
    conn = get_db()
    cursor = conn.cursor()

    if user_id is not None:
        cursor.execute("SELECT * FROM sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
    else:
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        return None

    cursor.execute(
        "SELECT * FROM answers WHERE session_id = ? ORDER BY created_at ASC",
        (session_id,)
    )
    answers = cursor.fetchall()
    conn.close()

    result = dict(session)
    result["answers"] = []
    for a in answers:
        answer = dict(a)
        answer["missing_points"] = json.loads(answer.get("missing_points", "[]"))
        answer["strengths"] = json.loads(answer.get("strengths", "[]"))
        answer["fillers"] = json.loads(answer.get("fillers", "{}"))
        result["answers"].append(answer)
    return result


def get_dashboard_stats(user_id: int) -> dict:
    """Get aggregated statistics for one user's progress dashboard."""
    conn = get_db()
    cursor = conn.cursor()

    # Overall stats
    cursor.execute("""
        SELECT
            COUNT(*) as total_sessions,
            COALESCE(AVG(total_score), 0) as avg_score,
            COALESCE(SUM(total_questions), 0) as total_questions
        FROM sessions WHERE user_id = ?
    """, (user_id,))
    overall = dict(cursor.fetchone())

    # Score trend over time (last 20 sessions)
    cursor.execute("""
        SELECT id, topic, difficulty, total_score, total_questions, created_at
        FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    """, (user_id,))
    trend = [dict(r) for r in cursor.fetchall()]
    trend.reverse()

    # Per-topic stats
    cursor.execute("""
        SELECT
            topic,
            COUNT(*) as sessions,
            COALESCE(AVG(total_score), 0) as avg_score,
            COALESCE(MAX(total_score), 0) as best_score
        FROM sessions
        WHERE user_id = ?
        GROUP BY topic
    """, (user_id,))
    by_topic = [dict(r) for r in cursor.fetchall()]

    # Average confidence from answers (scoped to this user's sessions)
    cursor.execute("""
        SELECT COALESCE(AVG(a.confidence_score), 0) as avg_confidence,
               COALESCE(AVG(a.filler_count), 0) as avg_fillers
        FROM answers a JOIN sessions s ON a.session_id = s.id
        WHERE s.user_id = ?
    """, (user_id,))
    answer_stats = dict(cursor.fetchone())

    # Most improved topic (comparing first half vs second half of sessions per topic)
    cursor.execute("""
        SELECT topic, early_avg, late_avg
        FROM (
            SELECT topic,
                   AVG(CASE WHEN rn <= cnt/2 THEN score END) as early_avg,
                   AVG(CASE WHEN rn > cnt/2 THEN score END) as late_avg
            FROM (
                SELECT a.score, s.topic,
                       ROW_NUMBER() OVER (PARTITION BY s.topic ORDER BY a.created_at) as rn,
                       COUNT(*) OVER (PARTITION BY s.topic) as cnt
                FROM answers a JOIN sessions s ON a.session_id = s.id
                WHERE s.user_id = ?
            ) AS sub1
            WHERE cnt >= 4
            GROUP BY topic
        ) AS sub2
        ORDER BY (late_avg - early_avg) DESC
        LIMIT 1
    """, (user_id,))
    most_improved = cursor.fetchone()

    conn.close()

    return {
        "overall": overall,
        "trend": trend,
        "by_topic": by_topic,
        "avg_confidence": round(answer_stats["avg_confidence"], 1),
        "avg_fillers": round(answer_stats["avg_fillers"], 1),
        "most_improved_topic": dict(most_improved) if most_improved else None,
    }


def delete_session(session_id: int, user_id: int = None) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    if user_id is not None:
        cursor.execute("DELETE FROM sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
    else:
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
