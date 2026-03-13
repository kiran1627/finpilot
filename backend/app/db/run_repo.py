# app/db/run_repo.py

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Run, LedgerEntry


class RunRepository:
    """
    Repository for autonomy run metadata and ledger access.

    Responsibilities:
    - Create autonomy run
    - Update final state metadata
    - List runs for dashboard
    - Fetch ledger entries for replay

    NO business logic.
    """

    def __init__(self, db: Session):
        self.db = db

    # --------------------------------------------------
    # CREATE RUN (NEW)
    # --------------------------------------------------

    def create_run(self, run_id: str, user_id: str) -> None:
        run = Run(
            run_id=run_id,
            user_id=user_id,
        )
        self.db.add(run)
        self.db.commit()

    # --------------------------------------------------
    # UPDATE RUN FINAL STATE (NEW)
    # --------------------------------------------------

    def update_run(
        self,
        *,
        run_id: str,
        final_balance: Optional[float],
        risk_level: Optional[str],
        strategy: Optional[str]
    ) -> None:

        run = (
            self.db.query(Run)
            .filter(Run.run_id == run_id)
            .first()
        )

        if not run:
            return

        run.final_balance = final_balance
        run.risk_level = risk_level
        run.strategy = strategy

        self.db.commit()

    # --------------------------------------------------
    # LIST RUNS (DASHBOARD SAFE)
    # --------------------------------------------------

    def list_runs_for_user(self, user_id: str) -> List[Dict[str, Any]]:

        rows = (
            self.db.query(Run)
            .filter(Run.user_id == user_id)
            .order_by(Run.started_at.desc())
            .all()
        )

        runs: List[Dict[str, Any]] = []

        for r in rows:
            runs.append({
                "run_id": r.run_id,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "ended_at": r.ended_at.isoformat() if r.ended_at else None,
                "final_balance": r.final_balance,
                "risk_level": r.risk_level,
                "strategy": r.strategy,
            })

        return runs

    # --------------------------------------------------
    # FETCH RAW LEDGER ENTRIES FOR REPLAY
    # --------------------------------------------------

    def get_run_entries(
        self,
        *,
        run_id: str,
        user_id: str
    ) -> List[LedgerEntry]:

        return (
            self.db.query(LedgerEntry)
            .filter(
                LedgerEntry.run_id == run_id,
                LedgerEntry.user_id == user_id,
            )
            .order_by(LedgerEntry.created_at.asc())
            .all()
        )
