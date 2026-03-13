# app/db/models.py

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    Float,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.database import Base


# ==================================================
# Run Metadata (AUTONOMY SESSION)
# ==================================================

class Run(Base):
    """
    Represents ONE autonomy session.

    Enforces:
    - Must belong to a valid user
    - Cascade delete on user removal
    """

    __tablename__ = "runs"

    run_id = Column(
        String,
        primary_key=True,
        index=True
    )

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    strategy = Column(
        String,
        nullable=True
    )

    risk_level = Column(
        String,
        nullable=True
    )

    final_balance = Column(
        Float,
        nullable=True
    )

    started_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    ended_at = Column(
        DateTime,
        nullable=True
    )

    # 🔥 Relationships
    user = relationship(
        "User",
        back_populates="runs"
    )

    ledger_entries = relationship(
        "LedgerEntry",
        back_populates="run",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLogEntry",
        back_populates="run",
        cascade="all, delete-orphan"
    )


# ==================================================
# Ledger Entries (WHAT happened)
# ==================================================

class LedgerEntry(Base):
    """
    Append-only transaction ledger.

    Enforces:
    - Must belong to valid Run
    - Must belong to valid User
    """

    __tablename__ = "ledger_entries"

    id = Column(
        String,
        primary_key=True,
        index=True,
        default=lambda: str(uuid.uuid4())
    )

    run_id = Column(
        String,
        ForeignKey("runs.run_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    entry_type = Column(
        String,
        index=True,
        nullable=False
    )

    payload = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # 🔥 Relationships
    run = relationship(
        "Run",
        back_populates="ledger_entries"
    )

    user = relationship(
        "User",
        back_populates="ledger_entries"
    )


# ==================================================
# Audit Logs (WHY it happened)
# ==================================================

class AuditLogEntry(Base):
    """
    Immutable audit log entry.
    Compliance-grade history.
    """

    __tablename__ = "audit_logs"

    id = Column(
        String,
        primary_key=True,
        index=True,
        default=lambda: str(uuid.uuid4())
    )

    audit_id = Column(
        String,
        index=True,
        nullable=False
    )

    run_id = Column(
        String,
        ForeignKey("runs.run_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    payload = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # 🔥 Relationships
    run = relationship(
        "Run",
        back_populates="audit_logs"
    )

    user = relationship(
        "User",
        back_populates="audit_logs"
    )
