# app/services/replay_service.py

import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.db.models import LedgerEntry


class ReplayService:
    """
    Deterministic replay engine.

    Reconstructs full financial timeline from DB ledger.
    Works for:
    - professional
    - student
    - freelancer
    """

    def __init__(self, db: Session):
        self.db = db

    def replay_run(self, *, run_id: str, user_id: str) -> Dict[str, Any]:

        entries = (
            self.db.query(LedgerEntry)
            .filter(
                LedgerEntry.run_id == run_id,
                LedgerEntry.user_id == user_id
            )
            .order_by(LedgerEntry.created_at.asc())
            .all()
        )

        if not entries:
            return {"error": "Run not found"}

        steps: List[Dict[str, Any]] = []

        initial_balance = None
        final_balance = None
        final_risk = None
        final_strategy = None

        for entry in entries:

            try:
                payload = json.loads(entry.payload)
            except Exception:
                continue

            # --------------------------------------------------
            # RECURRING EXPENSE
            # --------------------------------------------------
            if entry.entry_type == "recurring_expense":

                steps.append({
                    "type": "recurring_expense",
                    "day": payload.get("day"),
                    "expense_name": payload.get("expense_name"),
                    "amount": payload.get("amount"),
                    "balance_after": payload.get("balance_after"),
                })

                final_balance = payload.get("balance_after")

            # --------------------------------------------------
            # ONE-TIME EVENT
            # --------------------------------------------------
            elif entry.entry_type == "event":

                if initial_balance is None:
                    initial_balance = payload.get("balance_before")

                steps.append({
                    "type": "event",
                    "day": payload.get("day"),
                    "event_name": payload.get("event_name"),
                    "amount": payload.get("amount"),
                    "balance_before": payload.get("balance_before"),
                    "balance_after": payload.get("balance_after"),
                })

                final_balance = payload.get("balance_after")

            # --------------------------------------------------
            # UPCOMING EVENT OUTLOOK
            # --------------------------------------------------
            elif entry.entry_type == "event_outlook":

                steps.append({
                    "type": "event_outlook",
                    "day": payload.get("day"),
                    "next_event_name": payload.get("next_event_name"),
                    "next_event_day": payload.get("next_event_day"),
                    "next_event_amount": payload.get("next_event_amount"),
                    "remaining_events": payload.get("remaining_events"),
                })

            # --------------------------------------------------
            # INVESTMENT EXECUTION (FIXED)
            # --------------------------------------------------
            elif entry.entry_type == "investment_execution":

                if initial_balance is None:
                    initial_balance = payload.get("balance_before")

                steps.append({
                    "type": "investment_execution",
                    "invested_amount": payload.get("total_amount"),
                    "allocation": payload.get("allocation"),
                    "balance_before": payload.get("balance_before"),
                    "balance_after": payload.get("balance_after"),
                })

                final_balance = payload.get("balance_after")

            # --------------------------------------------------
            # STATE SNAPSHOT
            # --------------------------------------------------
            elif entry.entry_type == "state_snapshot":

                final_balance = payload.get("balance")
                final_risk = payload.get("risk_level")
                final_strategy = payload.get("strategy")

                steps.append({
                    "type": "state_snapshot",
                    "balance": final_balance,
                    "risk_level": final_risk,
                    "strategy": final_strategy,
                })

            # --------------------------------------------------
            # FINAL SNAPSHOT
            # --------------------------------------------------
            elif entry.entry_type == "final_snapshot":

                final_balance = payload.get("final_balance")
                final_risk = payload.get("risk_level")
                final_strategy = payload.get("strategy")

                steps.append({
                    "type": "final_snapshot",
                    "final_balance": final_balance,
                    "risk_level": final_risk,
                    "strategy": final_strategy,
                })

        return {
            "run_id": run_id,
            "initial_balance": initial_balance,
            "final_balance": final_balance,
            "risk_level": final_risk,
            "strategy": final_strategy,
            "total_steps": len(steps),
            "steps": steps
        }
