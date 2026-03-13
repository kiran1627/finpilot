from typing import Dict, Any, List
from app.portfolio.compounding import PortfolioCompoundingEngine


class PortfolioNAVEngine:
    """
    Computes cumulative NAV & unrealized PnL
    based on ledger investment entries.
    """

    def compute_nav(self, investments: List[Dict[str, Any]]) -> Dict[str, Any]:

        total_invested = 0
        nav_history = []
        holdings = []

        compounding_engine = PortfolioCompoundingEngine()

        cumulative_value = 0

        for entry in investments:

            invested_amount = entry.get("total_amount", 0)
            allocation = entry.get("allocation", {})

            if invested_amount <= 0:
                continue

            total_invested += invested_amount

            projection = compounding_engine.simulate(
                initial_investment=invested_amount,
                allocation_percentages={
                    k: (v / invested_amount) * 100
                    for k, v in allocation.items()
                    if invested_amount > 0
                },
                years=1,
                volatility_adjusted=True
            )

            current_value = projection["yearly_projection"][-1]["value"]

            cumulative_value += current_value

            unrealized = current_value - invested_amount
            return_pct = (unrealized / invested_amount) * 100 if invested_amount else 0

            holdings.append({
                "asset_class": "mixed",
                "instrument": "Autonomy Allocation",
                "invested_amount": invested_amount,
                "current_value": round(current_value, 2),
                "unrealized_pnl": round(unrealized, 2),
                "return_pct": round(return_pct, 2)
            })

            nav_history.append({
                "year": 1,
                "value": round(cumulative_value, 2)
            })

        total_unrealized = cumulative_value - total_invested
        total_return_pct = (
            (total_unrealized / total_invested) * 100
            if total_invested > 0 else 0
        )

        return {
            "total_portfolio_value": round(cumulative_value, 2),
            "total_invested": round(total_invested, 2),
            "total_unrealized_pnl": round(total_unrealized, 2),
            "total_return_pct": round(total_return_pct, 2),
            "holdings": holdings,
            "nav_history": nav_history
        }
