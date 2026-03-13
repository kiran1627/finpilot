from typing import Dict, Any


class VolatilityWeightedAllocator:
    """
    Risk-aware volatility weighting engine.

    Converts raw allocation percentages into
    volatility-adjusted allocation weights.

    Deterministic.
    Replay-safe.
    """

    # --------------------------------------------------
    # Default annualized volatility assumptions
    # --------------------------------------------------

    DEFAULT_VOLATILITY = {
        "mutual_funds": 0.18,
        "bonds": 0.07,
        "gold": 0.15,
        "cash": 0.01,
    }

    # Risk scaling multipliers
    RISK_SCALING = {
        "LOW": 0.8,
        "MEDIUM": 1.0,
        "HIGH": 1.2,
    }

    # Strategy aggressiveness multipliers
    STRATEGY_SCALING = {
        "conservative": 0.85,
        "balanced": 1.0,
        "aggressive": 1.25,
    }

    # --------------------------------------------------
    # Core method
    # --------------------------------------------------

    def rebalance(
        self,
        *,
        base_allocation: Dict[str, float],
        risk_level: str,
        strategy: str,
        volatility_assumptions: Dict[str, float] | None = None,
    ) -> Dict[str, Any]:
        """
        Applies volatility weighting + risk scaling.

        Parameters:
            base_allocation:
                {asset: percentage (0-100)}

            risk_level:
                LOW | MEDIUM | HIGH

            strategy:
                conservative | balanced | aggressive

        Returns:
            {
                "adjusted_percentages": {...},
                "normalization_factor": float,
                "risk_multiplier": float,
                "strategy_multiplier": float
            }
        """

        if not base_allocation:
            return {
                "adjusted_percentages": {},
                "normalization_factor": 0,
                "risk_multiplier": 0,
                "strategy_multiplier": 0,
            }

        volatility = volatility_assumptions or self.DEFAULT_VOLATILITY

        risk_multiplier = self.RISK_SCALING.get(risk_level, 1.0)
        strategy_multiplier = self.STRATEGY_SCALING.get(strategy, 1.0)

        # --------------------------------------------------
        # Convert percentages → raw weights
        # --------------------------------------------------

        raw_weights = {
            asset: pct / 100.0
            for asset, pct in base_allocation.items()
            if pct > 0
        }

        # --------------------------------------------------
        # Volatility weighting logic
        #
        # Lower volatility → higher effective weight
        #
        # Formula:
        #   adjusted_weight = weight / volatility
        #   then scaled by risk & strategy multipliers
        # --------------------------------------------------

        adjusted = {}

        for asset, weight in raw_weights.items():

            asset_vol = volatility.get(asset, 0.15)

            if asset_vol <= 0:
                asset_vol = 0.01

            inv_vol_weight = weight / asset_vol

            # Apply global multipliers
            inv_vol_weight *= risk_multiplier
            inv_vol_weight *= strategy_multiplier

            adjusted[asset] = inv_vol_weight

        # --------------------------------------------------
        # Normalize back to 100%
        # --------------------------------------------------

        total = sum(adjusted.values())

        if total <= 0:
            return {
                "adjusted_percentages": base_allocation,
                "normalization_factor": 0,
                "risk_multiplier": risk_multiplier,
                "strategy_multiplier": strategy_multiplier,
            }

        normalized = {
            asset: round((value / total) * 100, 2)
            for asset, value in adjusted.items()
        }

        return {
            "adjusted_percentages": normalized,
            "normalization_factor": round(total, 4),
            "risk_multiplier": risk_multiplier,
            "strategy_multiplier": strategy_multiplier,
        }
