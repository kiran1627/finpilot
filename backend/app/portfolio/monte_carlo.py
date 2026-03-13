import numpy as np
from typing import Dict, Any


class MonteCarloSimulator:
    """
    Production-grade deterministic Monte Carlo engine.

    - Isolated RNG (no global state pollution)
    - Geometric compounding
    - True drawdown calculation
    - Replay-safe with fixed seed
    """

    DEFAULT_ASSUMPTIONS = {
        "mutual_funds": {"mean": 0.12, "vol": 0.18},
        "bonds": {"mean": 0.06, "vol": 0.07},
        "gold": {"mean": 0.08, "vol": 0.15},
        "cash": {"mean": 0.035, "vol": 0.01},
    }

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    # --------------------------------------------------
    # Main Simulation
    # --------------------------------------------------

    def simulate(
        self,
        *,
        allocation: Dict[str, float],
        years: int = 10,
        simulations: int = 1000,
        risk_free_rate: float = 0.04,
        assumptions: Dict[str, Dict[str, float]] | None = None,
    ) -> Dict[str, Any]:

        if not allocation:
            return self._empty_result()

        assumptions = assumptions or self.DEFAULT_ASSUMPTIONS

        # Normalize weights
        weights = {
            asset: pct / 100.0
            for asset, pct in allocation.items()
            if pct > 0
        }

        if not weights:
            return self._empty_result()

        assets = list(weights.keys())
        weight_vector = np.array([weights[a] for a in assets])

        means = np.array([assumptions[a]["mean"] for a in assets])
        vols = np.array([assumptions[a]["vol"] for a in assets])

        portfolio_end_values = []
        portfolio_drawdowns = []

        for _ in range(simulations):

            # Simulate yearly log returns
            yearly_returns = self.rng.normal(
                loc=means,
                scale=vols,
                size=(years, len(assets))
            )

            # Portfolio yearly return
            portfolio_returns = np.dot(yearly_returns, weight_vector)

            # Compute cumulative path
            portfolio_values = np.cumprod(1 + portfolio_returns)

            final_value = portfolio_values[-1]
            portfolio_end_values.append(final_value - 1)

            # True drawdown
            peaks = np.maximum.accumulate(portfolio_values)
            drawdowns = (portfolio_values - peaks) / peaks
            max_dd = np.min(drawdowns)
            portfolio_drawdowns.append(max_dd)

        portfolio_end_values = np.array(portfolio_end_values)
        portfolio_drawdowns = np.array(portfolio_drawdowns)

        expected_return = float(np.mean(portfolio_end_values))
        volatility = float(np.std(portfolio_end_values))

        sharpe_ratio = (
            (expected_return - risk_free_rate) / volatility
            if volatility > 0
            else 0.0
        )

        return {
            "expected_return": round(expected_return, 4),
            "volatility": round(volatility, 4),
            "sharpe_ratio": round(sharpe_ratio, 4),
            "max_drawdown": round(float(np.mean(portfolio_drawdowns)), 4),
            "simulations": simulations,
            "years": years,
        }

    # --------------------------------------------------
    # Empty result fallback
    # --------------------------------------------------

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "expected_return": 0.0,
            "volatility": 0.0,
            "sharpe_ratio": 0.0,
            "max_drawdown": 0.0,
            "simulations": 0,
            "years": 0,
        }
