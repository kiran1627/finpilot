from typing import Dict, Any
from app.portfolio.volatility_model import VolatilityWeightedAllocator
from app.portfolio.sharpe_model import SharpeRatioScorer



class PortfolioAllocator:
    """
    Production-grade intelligent allocation engine.

    Combines:
    - Risk tier logic
    - Strategy bias
    - Volatility weighting
    - Sharpe ratio scoring
    - Deterministic normalization

    Replay-safe.
    No randomness.
    """

    # ---------------------------------------------
    # Base expected returns
    # ---------------------------------------------
    EXPECTED_RETURNS = {
        "mutual_funds": 0.12,
        "bonds": 0.06,
        "gold": 0.08,
        "cash": 0.03,
    }

    # ---------------------------------------------
    # Risk-based base weights
    # ---------------------------------------------
    RISK_BASE_WEIGHTS = {
        "LOW": {
            "mutual_funds": 35,
            "bonds": 35,
            "gold": 20,
            "cash": 10,
        },
        "MEDIUM": {
            "mutual_funds": 50,
            "bonds": 25,
            "gold": 15,
            "cash": 10,
        },
        "HIGH": {
            "mutual_funds": 65,
            "bonds": 15,
            "gold": 10,
            "cash": 10,
        },
    }

    # ---------------------------------------------
    # Strategy adjustments
    # ---------------------------------------------
    STRATEGY_MULTIPLIER = {
        "conservative": {
            "mutual_funds": 0.9,
            "bonds": 1.1,
            "gold": 1.0,
            "cash": 1.1,
        },
        "balanced": {
            "mutual_funds": 1.0,
            "bonds": 1.0,
            "gold": 1.0,
            "cash": 1.0,
        },
        "aggressive": {
            "mutual_funds": 1.2,
            "bonds": 0.8,
            "gold": 0.9,
            "cash": 0.8,
        },
    }

    # ---------------------------------------------
    # MAIN ENTRY
    # ---------------------------------------------

    def allocate(
        self,
        *,
        risk_level: str,
        strategy: str,
        volatility_adjusted: bool = True
    ) -> Dict[str, Any]:

        # ---------------------------------------------
        # Step 1: Base risk weights
        # ---------------------------------------------
        base_weights = self.RISK_BASE_WEIGHTS.get(
            risk_level,
            self.RISK_BASE_WEIGHTS["MEDIUM"]
        ).copy()

        # ---------------------------------------------
        # Step 2: Apply strategy multipliers
        # ---------------------------------------------
        multipliers = self.STRATEGY_MULTIPLIER.get(
            strategy,
            self.STRATEGY_MULTIPLIER["balanced"]
        )

        adjusted_weights = {}

        for asset, weight in base_weights.items():
            adjusted_weights[asset] = weight * multipliers.get(asset, 1.0)

        # ---------------------------------------------
        # Step 3: Normalize to 100%
        # ---------------------------------------------
        total = sum(adjusted_weights.values())

        normalized = {
            asset: round((weight / total) * 100, 2)
            for asset, weight in adjusted_weights.items()
        }

        # ---------------------------------------------
        # Step 4: Volatility Rebalancing (OPTION 2 FIX)
        # ---------------------------------------------
        volatility_penalty_applied = False

        if volatility_adjusted:

            vol_model = VolatilityWeightedAllocator()

            vol_result = vol_model.rebalance(
                base_allocation=normalized,
                risk_level=risk_level,
                strategy=strategy
            )

            normalized = vol_result["adjusted_percentages"]
            volatility_penalty_applied = True

        # ---------------------------------------------
        # Step 5: Compute portfolio expected return
        # ---------------------------------------------
        portfolio_return = 0.0

        for asset, pct in normalized.items():
            portfolio_return += (pct / 100) * self.EXPECTED_RETURNS.get(asset, 0.07)

        # ---------------------------------------------
        # Step 6: Sharpe scoring
        # ---------------------------------------------
        sharpe_model = SharpeRatioScorer()

        sharpe_result = sharpe_model.score(
            allocation_percentages=normalized,
            expected_returns=self.EXPECTED_RETURNS
        )

        sharpe_score = sharpe_result["sharpe_ratio"]

        return {
            "allocation_percentages": normalized,
            "expected_return": round(portfolio_return, 4),
            "sharpe_score": sharpe_score,
            "volatility_penalty_applied": volatility_penalty_applied
        }



