# app/auth/models.py

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    # --------------------------------------------------
    # Core Identity
    # --------------------------------------------------

    id = Column(String, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)

    provider = Column(String, nullable=False)  # "google" or "local"
    password_hash = Column(String, nullable=True)  # null for OAuth users

    user_type = Column(String, default="professional")

    is_active = Column(Boolean, default=True)

    # --------------------------------------------------
    # Forgot Password Fields (DB Option B)
    # --------------------------------------------------

    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # --------------------------------------------------
    # 🔥 Relationships (Production-Grade Wiring)
    # --------------------------------------------------

    runs = relationship(
        "Run",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    ledger_entries = relationship(
        "LedgerEntry",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLogEntry",
        back_populates="user",
        cascade="all, delete-orphan"
    )
