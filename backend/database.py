import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "interview_data.db")


def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    """)

    conn.commit()
    conn.close()


# --- Session CRUD ---

def create_session(topic: str, difficulty: str = "Fresher") -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (topic, difficulty) VALUES (?, ?)",
        (topic, difficulty)
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


def get_all_sessions() -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, topic, difficulty, total_score, total_questions, created_at
        FROM sessions ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_session_detail(session_id: int) -> dict:
    conn = get_db()
    cursor = conn.cursor()

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


def get_dashboard_stats() -> dict:
    """Get aggregated statistics for the progress dashboard."""
    conn = get_db()
    cursor = conn.cursor()

    # Overall stats
    cursor.execute("""
        SELECT
            COUNT(*) as total_sessions,
            COALESCE(AVG(total_score), 0) as avg_score,
            COALESCE(SUM(total_questions), 0) as total_questions
        FROM sessions
    """)
    overall = dict(cursor.fetchone())

    # Score trend over time (last 20 sessions)
    cursor.execute("""
        SELECT id, topic, difficulty, total_score, total_questions, created_at
        FROM sessions ORDER BY created_at DESC LIMIT 20
    """)
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
        GROUP BY topic
    """)
    by_topic = [dict(r) for r in cursor.fetchall()]

    # Average confidence from answers
    cursor.execute("""
        SELECT COALESCE(AVG(confidence_score), 0) as avg_confidence,
               COALESCE(AVG(filler_count), 0) as avg_fillers
        FROM answers
    """)
    answer_stats = dict(cursor.fetchone())

    # Most improved topic (comparing first half vs second half of sessions per topic)
    cursor.execute("""
        SELECT topic,
               AVG(CASE WHEN rn <= cnt/2 THEN score END) as early_avg,
               AVG(CASE WHEN rn > cnt/2 THEN score END) as late_avg
        FROM (
            SELECT a.score, s.topic,
                   ROW_NUMBER() OVER (PARTITION BY s.topic ORDER BY a.created_at) as rn,
                   COUNT(*) OVER (PARTITION BY s.topic) as cnt
            FROM answers a JOIN sessions s ON a.session_id = s.id
        )
        WHERE cnt >= 4
        GROUP BY topic
        ORDER BY (late_avg - early_avg) DESC
        LIMIT 1
    """)
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


def delete_session(session_id: int) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
