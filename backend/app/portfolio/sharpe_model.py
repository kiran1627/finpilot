from typing import Dict, Any
import math


class SharpeRatioScorer:
    """
    Production-grade Sharpe Ratio scoring engine.

    Responsibilities:
    - Score a portfolio using expected returns & volatility
    - Deterministic
    - Replay-safe
    - No DB coupling
    - No randomness

    Formula:
        Sharpe = (PortfolioReturn - RiskFreeRate) / PortfolioVolatility
    """

    # --------------------------------------------------
    # Default assumptions (annualized)
    # These should ideally come from config or research layer
    # --------------------------------------------------

    DEFAULT_EXPECTED_RETURNS = {
        "mutual_funds": 0.12,
        "bonds": 0.06,
        "gold": 0.08,
        "cash": 0.03,
    }

    DEFAULT_VOLATILITY = {
        "mutual_funds": 0.18,
        "bonds": 0.07,
        "gold": 0.15,
        "cash": 0.01,
    }

    DEFAULT_RISK_FREE_RATE = 0.05  # 5% annualized

    # --------------------------------------------------
    # Core scoring function
    # --------------------------------------------------

    def score(
        self,
        *,
        allocation_percentages: Dict[str, float],
        expected_returns: Dict[str, float] | None = None,
        volatilities: Dict[str, float] | None = None,
        risk_free_rate: float | None = None,
    ) -> Dict[str, Any]:
        """
        Scores a portfolio.

        Parameters:
            allocation_percentages:
                { asset: percentage (0-100) }

        Returns:
            {
                "portfolio_return": float,
                "portfolio_volatility": float,
                "sharpe_ratio": float,
                "risk_free_rate": float,
                "quality": str
            }
        """

        if not allocation_percentages:
            return self._empty_result()

        expected = expected_returns or self.DEFAULT_EXPECTED_RETURNS
        volatility = volatilities or self.DEFAULT_VOLATILITY
        rf = risk_free_rate if risk_free_rate is not None else self.DEFAULT_RISK_FREE_RATE

        # --------------------------------------------------
        # Convert percentages → weights
        # --------------------------------------------------

        weights = {
            asset: pct / 100.0
            for asset, pct in allocation_percentages.items()
            if pct > 0
        }

        if not weights:
            return self._empty_result()

        # --------------------------------------------------
        # Portfolio Expected Return
        # --------------------------------------------------

        portfolio_return = 0.0

        for asset, weight in weights.items():
            asset_return = expected.get(asset, 0.07)
            portfolio_return += weight * asset_return

        # --------------------------------------------------
        # Portfolio Volatility
        #
        # Assuming zero correlation for now (deterministic simplification)
        # σ_p = sqrt( Σ (w² * σ²) )
        # --------------------------------------------------

        variance = 0.0

        for asset, weight in weights.items():
            asset_vol = volatility.get(asset, 0.15)
            variance += (weight ** 2) * (asset_vol ** 2)

        portfolio_volatility = math.sqrt(variance)

        # --------------------------------------------------
        # Sharpe Ratio
        # --------------------------------------------------

        if portfolio_volatility <= 0:
            sharpe = 0.0
        else:
            sharpe = (portfolio_return - rf) / portfolio_volatility

        sharpe = round(sharpe, 4)

        # --------------------------------------------------
        # Qualitative grading
        # --------------------------------------------------

        if sharpe >= 1.5:
            quality = "Excellent"
        elif sharpe >= 1.0:
            quality = "Good"
        elif sharpe >= 0.5:
            quality = "Moderate"
        else:
            quality = "Weak"

        return {
            "portfolio_return": round(portfolio_return, 4),
            "portfolio_volatility": round(portfolio_volatility, 4),
            "sharpe_ratio": sharpe,
            "risk_free_rate": rf,
            "quality": quality,
        }

    # --------------------------------------------------
    # Fallback
    # --------------------------------------------------

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "portfolio_return": 0.0,
            "portfolio_volatility": 0.0,
            "sharpe_ratio": 0.0,
            "risk_free_rate": self.DEFAULT_RISK_FREE_RATE,
            "quality": "N/A",
        }
