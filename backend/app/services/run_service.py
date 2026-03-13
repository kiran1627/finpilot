# app/services/run_service.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.db.run_repo import RunRepository


class RunService:
    """
    Service layer for autonomy run history.

    Responsibilities:
    - Fetch run metadata for a user
    - Prepare API-ready responses
    - NO replay logic
    - NO DB queries directly
    """

    def __init__(self, db: Session):
        self.repo = RunRepository(db)

    def list_runs(self, *, user_id: str) -> List[Dict[str, Any]]:

        runs = self.repo.list_runs_for_user(user_id)

        normalized: List[Dict[str, Any]] = []

        for r in runs:
            normalized.append({
                "run_id": r.get("run_id"),
                "started_at": r.get("started_at"),
                "ended_at": r.get("ended_at"),
                "final_balance": r.get("final_balance"),
                "risk_level": r.get("risk_level"),
                "strategy": r.get("strategy"),
            })

        return normalized
