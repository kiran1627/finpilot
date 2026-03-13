# app/ledger/ledger_repository.py

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.db.ledger_repo import LedgerDBRepository


class LedgerRepository:
    """
    Write-through ledger persistence adapter.

    IMPORTANT:
    - Does NOT own ledger state
    - Does NOT keep in-memory entries
    - Used ONLY as a persistence + read adapter

    Source of truth:
    - state.ledger (LangGraph domain state)
    """

    def __init__(
        self,
        *,
        db: Optional[Session],
        user_id: Optional[str],
        run_id: Optional[str],
    ):
        self.user_id = user_id
        self.run_id = run_id

        self.db_repo = (
            LedgerDBRepository(db)
            if db and user_id
            else None
        )

    # ==================================================
    # WRITE (side-effect only)
    # ==================================================

    def persist(self, entry: Dict[str, Any]) -> None:
        """
        Persist a ledger entry to the database.

        MUST be called only AFTER the entry has been
        appended to state.ledger.
        """

        if not self.db_repo:
            return

        self.db_repo.save_entry(
            user_id=self.user_id,
            run_id=self.run_id,
            entry_type=entry.get("type", "unknown"),
            payload=entry,
        )

    # ==================================================
    # READ — DB-BACKED (used by APIs only)
    # ==================================================

    def load_user_ledger(self) -> List[Dict[str, Any]]:
        """
        Load full ledger history for a user.

        Used by:
        - GET /api/ledger
        """

        if not self.db_repo or not self.user_id:
            return []

        rows = self.db_repo.get_all_for_user(user_id=self.user_id)
        return [json.loads(row.payload) for row in rows]

    def load_run_ledger(self) -> List[Dict[str, Any]]:
        """
        Load ledger entries for a specific run.

        Used by:
        - GET /api/runs/{run_id}/replay
        """

        if not self.db_repo or not self.user_id or not self.run_id:
            return []

        rows = self.db_repo.get_by_run_id(
            run_id=self.run_id,
            user_id=self.user_id,
        )

        return [json.loads(row.payload) for row in rows]
