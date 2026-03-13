# app/db/ledger_repo.py

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.db.models import LedgerEntry


class LedgerDBRepository:
    """
    Low-level database repository for ledger persistence.

    Responsibilities:
    - Persist immutable ledger entries
    - Provide read access for replay & history APIs
    - NEVER mutate existing records
    """

    def __init__(self, db: Session):
        self.db = db

    # ==================================================
    # WRITE (append-only)
    # ==================================================

    def save_entry(
        self,
        *,
        user_id: str,
        entry_type: str,
        payload: Dict[str, Any],
        run_id: Optional[str] = None,
    ) -> LedgerEntry:
        """
        Persist a single immutable ledger entry.
        """

        entry = LedgerEntry(
            user_id=user_id,
            run_id=run_id,
            entry_type=entry_type,
            payload=json.dumps(payload),
        )

        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)

        return entry

    # ==================================================
    # READ — PHASE 3 (REPLAY & HISTORY)
    # ==================================================

    def get_by_run_id(
        self,
        *,
        run_id: str,
        user_id: str,
    ) -> List[LedgerEntry]:
        """
        Fetch ledger entries for a specific run.

        ORDER: ASC (deterministic replay)
        """

        return (
            self.db.query(LedgerEntry)
            .filter(
                LedgerEntry.run_id == run_id,
                LedgerEntry.user_id == user_id,
            )
            .order_by(LedgerEntry.created_at.asc())
            .all()
        )

    def get_all_for_user(
        self,
        *,
        user_id: str,
    ) -> List[LedgerEntry]:
        """
        Fetch full ledger history for a user.

        ORDER: DESC (audit / admin views)
        """

        return (
            self.db.query(LedgerEntry)
            .filter(LedgerEntry.user_id == user_id)
            .order_by(LedgerEntry.created_at.desc())
            .all()
        )

    # ==================================================
    # BACKWARD-COMPATIBILITY HELPERS
    # ==================================================

    def get_user_ledger(self, user_id: str) -> List[LedgerEntry]:
        """
        Alias for legacy callers.
        """
        return self.get_all_for_user(user_id=user_id)

    def get_run_ledger(self, run_id: str) -> List[LedgerEntry]:
        """
        Internal-only helper (no user scope).
        NOT recommended for API usage.
        """
        return (
            self.db.query(LedgerEntry)
            .filter(LedgerEntry.run_id == run_id)
            .order_by(LedgerEntry.created_at.asc())
            .all()
        )
