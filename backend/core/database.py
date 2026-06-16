import sqlite3
from datetime import datetime
from core.config import get_settings

settings = get_settings()

def get_connection():
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist"""
    # Create data directory if it doesn't exist
    import os
    os.makedirs(os.path.dirname(settings.db_path), exist_ok=True)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            session_type TEXT DEFAULT 'interview'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coding_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            problem_title TEXT NOT NULL,
            problem_description TEXT,
            difficulty TEXT,
            language TEXT,
            code TEXT,
            execution_result TEXT,
            score INTEGER,
            feedback TEXT,
            asked_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT,
            score INTEGER,
            feedback TEXT,
            asked_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized")

def create_session(company_name: str, role: str, session_type: str = "interview") -> int:
    """Start a new session (interview or coding), return session ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (company_name, role, created_at, session_type) VALUES (?, ?, ?, ?)",
        (company_name, role, datetime.now().isoformat(), session_type)
    )
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id

def save_question(session_id: int, question: str, answer: str, score: int, feedback: str):
    """Save a single Q&A with feedback to the database"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO questions 
           (session_id, question, answer, score, feedback, asked_at) 
           VALUES (?, ?, ?, ?, ?, ?)""",
        (session_id, question, answer, score, feedback, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def save_coding_question(
    session_id: int,
    problem_title: str,
    problem_description: str,
    difficulty: str,
    language: str,
    code: str,
    execution_result: str,
    score: int,
    feedback: str
):
    """Save a single coding problem attempt with review feedback"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO coding_questions
           (session_id, problem_title, problem_description, difficulty, language,
            code, execution_result, score, feedback, asked_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (session_id, problem_title, problem_description, difficulty, language,
         code, execution_result, score, feedback, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def complete_session(session_id: int):
    """Mark session as completed"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE sessions SET completed = 1 WHERE id = ?",
        (session_id,)
    )
    conn.commit()
    conn.close()

def get_session_results(session_id: int) -> dict:
    """Get full interview session with all questions and answers"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = dict(cursor.fetchone())

    cursor.execute("SELECT * FROM questions WHERE session_id = ?", (session_id,))
    questions = [dict(row) for row in cursor.fetchall()]

    conn.close()

    scores = [q['score'] for q in questions if q['score'] is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "session": session,
        "questions": questions,
        "average_score": avg_score,
        "total_questions": len(questions)
    }

def get_coding_session_results(session_id: int) -> dict:
    """Get full coding session with all problem attempts"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = dict(cursor.fetchone())

    cursor.execute("SELECT * FROM coding_questions WHERE session_id = ?", (session_id,))
    problems = [dict(row) for row in cursor.fetchall()]

    conn.close()

    scores = [p['score'] for p in problems if p['score'] is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "session": session,
        "problems": problems,
        "average_score": avg_score,
        "total_problems": len(problems)
    }

def get_all_sessions(session_type: str = None) -> list:
    """Get all past sessions for history view, optionally filtered by type"""
    conn = get_connection()
    cursor = conn.cursor()
    if session_type:
        cursor.execute(
            "SELECT * FROM sessions WHERE session_type = ? ORDER BY created_at DESC",
            (session_type,)
        )
    else:
        cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC")
    sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return sessions