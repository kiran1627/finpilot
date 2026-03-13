from sqlalchemy.orm import Session
from sqlalchemy import func
import json
from collections import defaultdict

from app.db.models import Run, LedgerEntry
from app.portfolio.compounding import PortfolioCompoundingEngine


class DashboardService:

    def __init__(self, db: Session):
        self.db = db

    def get_summary(self, user_id: str):

        # --------------------------------------------------
        # Total Runs
        # --------------------------------------------------
        runs_count = (
            self.db.query(func.count(Run.run_id))
            .filter(Run.user_id == user_id)
            .scalar()
        ) or 0


        # --------------------------------------------------
        # Last Run Snapshot
        # --------------------------------------------------
        last_run = (
            self.db.query(Run)
            .filter(Run.user_id == user_id)
            .order_by(Run.started_at.desc())
            .first()
        )

        net_worth = last_run.final_balance if last_run else 0
        last_run_risk = last_run.risk_level if last_run else None

        # --------------------------------------------------
        # Investment Ledger Entries
        # --------------------------------------------------
        investments = (
            self.db.query(LedgerEntry)
            .filter(
                LedgerEntry.user_id == user_id,
                LedgerEntry.entry_type == "investment_execution"
            )
            .order_by(LedgerEntry.created_at.asc())
            .all()
        )

        if not investments:
            return {
                "net_worth": net_worth,
                "last_run_risk": last_run_risk,
                "total_invested": 0,
                "current_portfolio_value": 0,
                "total_unrealized_pnl": 0,
                "total_return_pct": 0,
                "runs_count": runs_count,
                "nav_trend": []
            }

        compounding_engine = PortfolioCompoundingEngine()

        total_invested = 0.0
        total_current_value = 0.0
        nav_trend = []

        cumulative_value = 0.0

        # --------------------------------------------------
        # NAV Engine Integration
        # --------------------------------------------------
        for index, entry in enumerate(investments):

            try:
                payload = json.loads(entry.payload)
            except Exception:
                continue

            invested_amount = payload.get("total_amount", 0)
            allocation = payload.get("allocation", {})

            if invested_amount <= 0:
                continue

            total_invested += invested_amount

            # Calculate allocation percentages
            allocation_percentages = {}
            for asset, amount in allocation.items():
                if invested_amount > 0:
                    allocation_percentages[asset] = (amount / invested_amount) * 100

            # Simulate 1-year unrealized growth
            projection = compounding_engine.simulate(
                initial_investment=invested_amount,
                allocation_percentages=allocation_percentages,
                years=1,
                volatility_adjusted=True
            )

            current_value = projection["yearly_projection"][-1]["value"]

            total_current_value += current_value
            cumulative_value += current_value

            nav_trend.append({
                "investment_index": index + 1,
                "portfolio_value": round(cumulative_value, 2)
            })

        total_unrealized = total_current_value - total_invested

        total_return_pct = (
            (total_unrealized / total_invested) * 100
            if total_invested > 0 else 0
        )

        # --------------------------------------------------
        # Final Dashboard Response
        # --------------------------------------------------
        return {
            "net_worth": round(net_worth, 2),
            "last_run_risk": last_run_risk,
            "total_invested": round(total_invested, 2),
            "current_portfolio_value": round(total_current_value, 2),
            "total_unrealized_pnl": round(total_unrealized, 2),
            "total_return_pct": round(total_return_pct, 2),
            "runs_count": runs_count,
            "nav_trend": nav_trend
        }
