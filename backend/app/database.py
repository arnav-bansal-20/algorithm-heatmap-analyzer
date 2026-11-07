"""
Lightweight SQLite Database persistence layer for analysis runs and student history.
Stores submission metadata, correctness, benchmarks, complexity, quality, and AI feedback.
Never stores API keys or secrets.
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "analysis_history.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            algorithm_name TEXT,
            category TEXT,
            language TEXT,
            student_code TEXT,
            correctness_results TEXT,
            benchmark_results TEXT,
            complexity_results TEXT,
            quality_results TEXT,
            optimization_results TEXT,
            ai_feedback TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

# Initialize tables on import
init_db()

def save_analysis(
    algorithm_name: str,
    category: str,
    language: str,
    student_code: str,
    correctness_results: Dict[str, Any],
    benchmark_results: Dict[str, Any],
    complexity_results: Dict[str, Any],
    quality_results: Dict[str, Any],
    optimization_results: Dict[str, Any],
    ai_feedback: Optional[str] = None,
    analysis_id: Optional[str] = None
) -> str:
    aid = analysis_id or f"analysis_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analyses (
            id, algorithm_name, category, language, student_code,
            correctness_results, benchmark_results, complexity_results,
            quality_results, optimization_results, ai_feedback, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        aid,
        algorithm_name,
        category,
        language,
        student_code,
        json.dumps(correctness_results),
        json.dumps(benchmark_results),
        json.dumps(complexity_results),
        json.dumps(quality_results),
        json.dumps(optimization_results),
        ai_feedback or "",
        created_at
    ))
    conn.commit()
    conn.close()
    return aid

def get_analysis_by_id(aid: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (aid,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None

    return {
        "id": row["id"],
        "algorithm_name": row["algorithm_name"],
        "category": row["category"],
        "language": row["language"],
        "student_code": row["student_code"],
        "correctness_results": json.loads(row["correctness_results"] or "{}"),
        "benchmark_results": json.loads(row["benchmark_results"] or "{}"),
        "complexity_results": json.loads(row["complexity_results"] or "{}"),
        "quality_results": json.loads(row["quality_results"] or "{}"),
        "optimization_results": json.loads(row["optimization_results"] or "{}"),
        "ai_feedback": row["ai_feedback"],
        "created_at": row["created_at"]
    }

def list_analyses(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, algorithm_name, category, language, created_at,
               correctness_results, complexity_results
        FROM analyses
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        corr = json.loads(r["correctness_results"] or "{}")
        comp = json.loads(r["complexity_results"] or "{}")
        result.append({
            "id": r["id"],
            "algorithm_name": r["algorithm_name"],
            "category": r["category"],
            "language": r["language"],
            "created_at": r["created_at"],
            "is_correct": corr.get("is_correct", False),
            "predicted_class": comp.get("empirical", {}).get("predicted_class", "N/A")
        })
    return result
