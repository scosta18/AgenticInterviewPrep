import sqlite3
import json
from datetime import datetime
from core.config import get_settings

settings = get_settings()

def get_connections():
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist"""
    conn = get_connections()
    cursor = conn.cursor()
    
    cursor.execute("""
                   CREATE TABLE IF NOT EXISTS sessions(
                       id INTEGER PRIMERY KEY AUTOINCREMENT,
                       company_name TEXT NOT NULL,
                       role TEXT NOT NULL,
                       created at TEXT NOT NULL,
                       completed INTEGER DEFAULT 0,
                   )
                   """)
    
    cursor.execute("""
                   CREATE TABLE IF NOT EXISTS questiosn(
                       if INTEGER PRIMARY KEY AUTOINCREMENT,
                       session_id INTEGER NOT NULL,
                       question TEXT NOT NULL,
                       answer TEXT,
                       score INTEGER,
                       feedback TEXT,
                       asked_at TEXT NOT NULL,
                       FOREIGN KEY(session_id) REFERENCES sessions(id)
                   )
                   """)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")
    
    
def create_session(company_name: str, role: str) -> int:
    """Start a new interview prep sessions"""
    
    conn = get_connections()
    cursor = conn.cursor()
    cursor.execute("INTERT INTO sessions (company_name, role, created_at) VALUES (?, ?, ?)", 
                   (company_name, role, datetime.now().isoformat())
                   )
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id

def save_question(session_id: int, question: str, answer: str, score: int, feedback: str):
    
    conn = get_connections()
    cursor = conn.cursor()
    cursor.execute("""
                   INSERT INTO questions (session_id, question, answer, score, feedback, asked_at) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                     (session_id, question, answer, score, feedback, datetime.now().isoformat())
                     )
    conn.commit()
    conn.close()
    
    
def complete_session(session_id: int):
    conn = get_connections()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET completed = 1 WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()     
    
    
def sessions_results(session_id: int) -> dict:
    conn = get_connections()
    cursor = conn.cursor()
    
    cursor.execute("SELECE * FROM sessions WHERE id = ?", (session_id,))
    session = dict(cursor.fetchone())
    
    cursor.execute("SELECT * FROM questions WHERE session_id = ?", (session_id,))
    question = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    score = [q['score'] for q in question if q['score'] is not None]
    avg_score = round(sum(score) / len(score), 1) if score else 0
    
    return{
        "session": session,
        "questions": question,
        "avg_score": avg_score,
        "total_questions": len(question)
    }
    
    
def get_all_sessions() -> list:
    conn = get_connections()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC")
    sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return sessions