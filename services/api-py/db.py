"""
Database module for PostgreSQL connection with retry logic.
"""
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/app")

_pool = None


def get_connection():
    """Get a new database connection."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


@contextmanager
def get_cursor():
    """Context manager for database cursor with automatic connection handling."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def health_check() -> bool:
    """Check database connectivity."""
    try:
        with get_cursor() as cur:
            cur.execute("SELECT 1")
            return True
    except Exception:
        return False


def wait_for_db(max_attempts: int = 30, delay_seconds: float = 1.0) -> None:
    """Wait for database to be available with retry logic."""
    for i in range(max_attempts):
        try:
            conn = psycopg2.connect(DATABASE_URL)
            conn.close()
            print("[db] Connected to PostgreSQL")
            return
        except psycopg2.OperationalError as e:
            print(f"[db] Waiting for database... attempt {i + 1}/{max_attempts}: {e}")
            time.sleep(delay_seconds)
    raise Exception("Failed to connect to database after max attempts")
