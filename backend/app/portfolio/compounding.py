from typing import Dict, Any, List
import math


class PortfolioCompoundingEngine:
    """
    Production-grade long-term portfolio compounding engine.

    Features:
    - Multi-year projection
    - Allocation-based weighted return
    - Deterministic (replay-safe)
    - Optional volatility adjustment
    - Clean structured output

    No DB coupling.
    No randomness.
    """

    # ---------------------------------------------
    # Default annual expected returns
    # ---------------------------------------------
    DEFAULT_EXPECTED_RETURNS = {
        "mutual_funds": 0.12,
        "bonds": 0.06,
        "gold": 0.08,
        "cash": 0.03,
    }

    # Optional conservative haircut factor
    VOLATILITY_HAIRCUT_FACTOR = 0.15

    # ---------------------------------------------
    # MAIN ENTRY
    # ---------------------------------------------

    def simulate(
        self,
        *,
        initial_investment: float,
        allocation_percentages: Dict[str, float],
        years: int = 10,
        expected_returns: Dict[str, float] | None = None,
        volatility_adjusted: bool = False,
    ) -> Dict[str, Any]:
        """
        Simulates long-term portfolio compounding.

        Returns:
        {
            "years": int,
            "initial_investment": float,
            "final_value": float,
            "annualized_return": float,
            "yearly_projection": [ ... ],
            "assumptions": {...}
        }
        """

        if initial_investment <= 0 or not allocation_percentages:
            return self._empty_result(initial_investment, years)

        expected = expected_returns or self.DEFAULT_EXPECTED_RETURNS

        # ---------------------------------------------
        # Convert % → weights
        # ---------------------------------------------
        weights = {
            asset: pct / 100.0
            for asset, pct in allocation_percentages.items()
            if pct > 0
        }

        # ---------------------------------------------
        # Compute weighted annual return
        # ---------------------------------------------
        portfolio_return = 0.0

        for asset, weight in weights.items():
            asset_return = expected.get(asset, 0.07)

            if volatility_adjusted:
                asset_return *= (1 - self.VOLATILITY_HAIRCUT_FACTOR)

            portfolio_return += weight * asset_return

        portfolio_return = max(portfolio_return, 0)

        # ---------------------------------------------
        # Compound growth
        # ---------------------------------------------
        value = initial_investment
        yearly_projection: List[Dict[str, Any]] = []

        for year in range(1, years + 1):
            value = value * (1 + portfolio_return)

            yearly_projection.append({
                "year": year,
                "value": round(value, 2)
            })

        # ---------------------------------------------
        # Annualized return calculation
        # ---------------------------------------------
        annualized_return = (
            (value / initial_investment) ** (1 / years) - 1
        )

        return {
            "years": years,
            "initial_investment": initial_investment,
            "final_value": round(value, 2),
            "annualized_return": round(annualized_return, 4),
            "yearly_projection": yearly_projection,
            "assumptions": {
                "volatility_adjusted": volatility_adjusted,
                "weighted_return_used": round(portfolio_return, 4)
            }
        }

    # ---------------------------------------------
    # Fallback
    # ---------------------------------------------
    def _empty_result(self, initial: float, years: int) -> Dict[str, Any]:
        return {
            "years": years,
            "initial_investment": initial,
            "final_value": initial,
            "annualized_return": 0.0,
            "yearly_projection": [],
            "assumptions": {}
        }
