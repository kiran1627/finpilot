from sqlalchemy.orm import Session
import json
from collections import defaultdict
from typing import Dict, Any, List

from app.db.models import LedgerEntry
from app.portfolio.compounding import PortfolioCompoundingEngine


class InvestmentService:

    def __init__(self, db: Session):
        self.db = db

    # --------------------------------------------------
    # MAIN ENTRY
    # --------------------------------------------------

    def get_investments(self, user_id: str) -> Dict[str, Any]:

        entries = (
            self.db.query(LedgerEntry)
            .filter(
                LedgerEntry.user_id == user_id,
                LedgerEntry.entry_type == "investment_execution"
            )
            .order_by(LedgerEntry.created_at.asc())
            .all()
        )

        if not entries:
            return {
                "total_portfolio_value": 0,
                "total_invested": 0,
                "total_unrealized_pnl": 0,
                "total_return_pct": 0,
                "holdings": [],
                "nav_history": [],
                "cumulative_allocation": {},
                "investment_history": []
            }

        compounding_engine = PortfolioCompoundingEngine()

        total_invested = 0.0
        total_current_value = 0.0

        cumulative_allocation = defaultdict(float)
        nav_history = []
        investment_history = []
        holdings: List[Dict[str, Any]] = []

        cumulative_value = 0.0

        # --------------------------------------------------
        # PROCESS EACH INVESTMENT ENTRY
        # --------------------------------------------------

        for index, entry in enumerate(entries):

            try:
                payload = json.loads(entry.payload)
            except Exception:
                continue

            invested_amount = payload.get("total_amount", 0)
            allocation = payload.get("allocation", {})

            if invested_amount <= 0:
                continue

            total_invested += invested_amount

            # ----------------------------------------------
            # Calculate allocation percentages
            # ----------------------------------------------

            allocation_percentages = {}

            for asset, amount in allocation.items():
                if invested_amount > 0:
                    allocation_percentages[asset] = (amount / invested_amount) * 100
                cumulative_allocation[asset] += amount

            # ----------------------------------------------
            # Simulate 1-year growth for unrealized PnL
            # ----------------------------------------------

            projection = compounding_engine.simulate(
                initial_investment=invested_amount,
                allocation_percentages=allocation_percentages,
                years=1,
                volatility_adjusted=True
            )

            current_value = projection["yearly_projection"][-1]["value"]

            unrealized_pnl = current_value - invested_amount
            return_pct = (
                (unrealized_pnl / invested_amount) * 100
                if invested_amount > 0 else 0
            )

            total_current_value += current_value
            cumulative_value += current_value

            # ----------------------------------------------
            # Groww-style holding object
            # ----------------------------------------------

            holdings.append({
                "asset_class": "autonomous_allocation",
                "instrument": f"Autonomy Run #{index + 1}",
                "invested_amount": round(invested_amount, 2),
                "current_value": round(current_value, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "return_pct": round(return_pct, 2)
            })

            # ----------------------------------------------
            # NAV Trend
            # ----------------------------------------------

            nav_history.append({
                "investment_index": index + 1,
                "portfolio_value": round(cumulative_value, 2)
            })

            # ----------------------------------------------
            # Raw history (detailed ledger view)
            # ----------------------------------------------

            investment_history.append({
                "date": entry.created_at,
                "invested_amount": invested_amount,
                "allocation": allocation,
                "unrealized_pnl": round(unrealized_pnl, 2),
                "current_value": round(current_value, 2)
            })

        # --------------------------------------------------
        # FINAL AGGREGATES
        # --------------------------------------------------

        total_unrealized = total_current_value - total_invested

        total_return_pct = (
            (total_unrealized / total_invested) * 100
            if total_invested > 0 else 0
        )

        return {
            "total_portfolio_value": round(total_current_value, 2),
            "total_invested": round(total_invested, 2),
            "total_unrealized_pnl": round(total_unrealized, 2),
            "total_return_pct": round(total_return_pct, 2),
            "holdings": holdings,
            "nav_history": nav_history,
            "cumulative_allocation": dict(cumulative_allocation),
            "investment_history": investment_history
        }
