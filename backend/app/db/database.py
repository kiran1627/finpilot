# app/db/database.py

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# ==================================================
# Database Configuration
# ==================================================

DATABASE_URL = "sqlite:///./ledger.db"

# --------------------------------------------------
# Engine (Production-Safe SQLite Config)
# --------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    pool_pre_ping=True,
    future=True,
)

# --------------------------------------------------
# 🔥 ENABLE FOREIGN KEY CONSTRAINTS
# SQLite does NOT enforce FKs by default.
# --------------------------------------------------

@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# --------------------------------------------------
# Session Factory
# --------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# --------------------------------------------------
# Declarative Base
# --------------------------------------------------

Base = declarative_base()

# --------------------------------------------------
# FastAPI Dependency
# --------------------------------------------------

def get_db():
    """
    Provides a database session for FastAPI routes.
    Ensures proper session cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# IMPORTANT:
# DO NOT auto-create tables here.
# Let init_db.py handle creation.
# --------------------------------------------------
