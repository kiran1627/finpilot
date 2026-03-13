# app/db/audit_repo.py

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import AuditLogEntry


class AuditDBRepository:
    """
    Low-level database repository for audit log persistence.

    Responsibilities:
    - Persist immutable audit records
    - Query audit history per user or run
    """

    def __init__(self, db: Session):
        self.db = db

    # --------------------------------------------------
    # WRITE
    # --------------------------------------------------

    def save_record(self, record: Dict[str, Any]) -> AuditLogEntry:
        """
        Persist a single audit record.
        """

        entry = AuditLogEntry(
            audit_id=record["audit_id"],
            run_id=record.get("run_id"),
            user_id=record["user_id"],
            payload=str(record),  # stored as serialized text
            created_at=datetime.utcnow(),
        )

        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)

        return entry

    # --------------------------------------------------
    # READ
    # --------------------------------------------------

    def get_user_audits(self, user_id: str) -> List[AuditLogEntry]:
        return (
            self.db.query(AuditLogEntry)
            .filter(AuditLogEntry.user_id == user_id)
            .order_by(AuditLogEntry.created_at.asc())
            .all()
        )

    def get_run_audits(self, run_id: str) -> List[AuditLogEntry]:
        return (
            self.db.query(AuditLogEntry)
            .filter(AuditLogEntry.run_id == run_id)
            .order_by(AuditLogEntry.created_at.asc())
            .all()
        )
