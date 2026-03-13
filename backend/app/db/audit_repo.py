# app/db/audit_repo.py

from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.models import AuditLogEntry


class AuditDBRepository:
    """
    Low-level database repository for persisting audit logs.

    Responsibilities:
    - Persist immutable audit records
    - Fetch audit history for replay / compliance
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
            audit_id=record.get("audit_id"),
            run_id=record.get("run_id"),
            user_id=record.get("user_id"),
            payload=record,
            created_at=datetime.utcnow(),
        )

        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)

        return entry

    # --------------------------------------------------
    # READ
    # --------------------------------------------------

    def get_run_audit(self, run_id: str) -> List[AuditLogEntry]:
        """
        Fetch all audit logs for a specific autonomy run.
        """

        return (
            self.db.query(AuditLogEntry)
            .filter(AuditLogEntry.run_id == run_id)
            .order_by(AuditLogEntry.created_at.asc())
            .all()
        )

    def get_user_audit(self, user_id: str) -> List[AuditLogEntry]:
        """
        Fetch all audit logs for a user.
        """

        return (
            self.db.query(AuditLogEntry)
            .filter(AuditLogEntry.user_id == user_id)
            .order_by(AuditLogEntry.created_at.asc())
            .all()
        )
