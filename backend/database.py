"""
Database Setup using SQLite
SQLite is built into Python - no installation needed!
The database file is created automatically in the backend folder.
"""

import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

# SQLite database file path - stored right in the backend folder
DB_FILE = os.getenv("DATABASE_FILE", "financial_health.db")


def get_connection():
    """Get a database connection. Creates the file if it doesn't exist."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Makes rows behave like dictionaries
    return conn


def init_db():
    """
    Create all database tables.
    Called once when the app starts.
    Tables are only created if they don't already exist.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Users table - stores login information
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name   TEXT NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            company     TEXT,
            industry    TEXT DEFAULT 'Services',
            created_at  TEXT DEFAULT (datetime('now'))
        )
    """)

    # Reports table - stores uploaded files and their analysis results
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            filename        TEXT NOT NULL,
            industry        TEXT NOT NULL,
            health_score    REAL,
            risk_level      TEXT,
            profit_margin   REAL,
            growth_rate     REAL,
            expense_ratio   REAL,
            debt_ratio      REAL,
            cashflow_score  REAL,
            total_revenue   REAL,
            total_profit    REAL,
            monthly_data    TEXT,
            ai_insights     TEXT,
            ai_risks        TEXT,
            ai_opportunities TEXT,
            ai_cost_tips    TEXT,
            status          TEXT DEFAULT 'processing',
            error_msg       TEXT,
            created_at      TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Recommendations table - stores loan product matches
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id       INTEGER NOT NULL,
            product_name    TEXT,
            product_type    TEXT,
            provider        TEXT,
            rate_min        REAL,
            rate_max        REAL,
            max_amount      REAL,
            match_score     REAL,
            reason          TEXT,
            apply_url       TEXT,
            FOREIGN KEY (report_id) REFERENCES reports(id)
        )
    """)

    conn.commit()
    conn.close()
    print(f"✅ Database ready: {DB_FILE}")
