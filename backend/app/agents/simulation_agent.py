import math
from statistics import stdev
from typing import Dict, Any
import numpy as np

from app.portfolio.sharpe_model import SharpeRatioScorer


class SimulationAgent:
    """
    Advanced forward simulation engine with synthetic
    market micro-returns injection.

    Produces:
    - Ending balance
    - Constraint violations
    - Max drawdown
    - Volatility
    - Sharpe ratio (via SharpeRatioScorer)

    Deterministic via run_id seeding.
    """

    DEFAULT_SIMULATION_DAYS = 30
    ANNUAL_RISK_FREE_RATE = 0.05

    STRATEGY_VOL = {
        "conservative": 0.0005,
        "balanced": 0.001,
        "aggressive": 0.002,
    }

    def run(self, state):

        strategies = ["conservative", "balanced", "aggressive"]
        simulation_results: Dict[str, Any] = {}

        base_twin = state.twin
        start_day = base_twin.current_day

        updated_logs = list(state.logs)
        updated_outputs = dict(getattr(state, "agent_outputs", {}))

        # --------------------------------------------------
        # Deterministic RNG per run
        # --------------------------------------------------

        seed = hash(state.run_id) % (2**32) if state.run_id else 42
        rng = np.random.default_rng(seed)

        sharpe_scorer = SharpeRatioScorer()

        # --------------------------------------------------
        # Determine horizon
        # --------------------------------------------------

        next_event = base_twin.get_next_event()

        if next_event:
            horizon = min(
                self.DEFAULT_SIMULATION_DAYS,
                max(1, next_event.day - start_day)
            )
        else:
            horizon = self.DEFAULT_SIMULATION_DAYS

        # --------------------------------------------------
        # Run simulations
        # --------------------------------------------------

        for strategy in strategies:

            twin = base_twin.clone()
            violations = 0
            daily_balances = []

            peak_balance = twin.current_balance
            max_drawdown = 0.0

            daily_vol = self.STRATEGY_VOL[strategy]

            for offset in range(horizon):
                day = start_day + offset

                # Recurring income
                for inc in twin.income_streams:
                    if inc.frequency == "monthly" and day % 30 == 0:
                        twin.apply_income(inc.amount)

                # Recurring expenses
                for exp in twin.recurring_expenses:
                    if exp.frequency == "monthly" and day % 30 == 0:
                        twin.apply_expense(exp.amount)

                # Strategy discretionary expense
                if strategy == "balanced":
                    twin.apply_expense(50)
                elif strategy == "aggressive":
                    twin.apply_expense(100)

                # --------------------------------------------------
                # Synthetic micro-return injection
                # --------------------------------------------------

                random_daily_return = rng.normal(0, daily_vol)
                twin.current_balance *= (1 + random_daily_return)

                # Constraint check
                if twin.violates_constraints():
                    violations += 1

                current_balance = twin.current_balance
                daily_balances.append(current_balance)

                # Drawdown tracking
                if current_balance > peak_balance:
                    peak_balance = current_balance

                if peak_balance > 0:
                    drawdown = (peak_balance - current_balance) / peak_balance
                    max_drawdown = max(max_drawdown, drawdown)

            # --------------------------------------------------
            # Compute daily returns
            # --------------------------------------------------

            returns = []

            for i in range(1, len(daily_balances)):
                prev = daily_balances[i - 1]
                curr = daily_balances[i]

                if prev != 0:
                    returns.append((curr - prev) / prev)

            volatility = stdev(returns) if len(returns) > 1 else 0.0

            # --------------------------------------------------
            # Sharpe Ratio via Production Scorer
            # --------------------------------------------------

            if volatility > 0:
                avg_return = sum(returns) / len(returns)

                sharpe_result = sharpe_scorer.score(
                    allocation_percentages={"portfolio": 100},  # dummy
                    expected_returns={"portfolio": avg_return * 252},
                    volatilities={"portfolio": volatility * math.sqrt(252)},
                    risk_free_rate=self.ANNUAL_RISK_FREE_RATE
                )

                sharpe_score = sharpe_result["sharpe_ratio"]
            else:
                sharpe_score = 0.0

            simulation_results[strategy] = {
                "ending_balance": round(twin.current_balance, 2),
                "daily_balances": daily_balances,
                "constraint_violations": violations,
                "safe": violations == 0,
                "max_drawdown": round(max_drawdown, 4),
                "volatility": round(volatility, 6),
                "sharpe_score": round(sharpe_score, 4),
            }

        updated_logs.append(
            f"SimulationAgent: Advanced stochastic simulation for {horizon} days completed"
        )

        # --------------------------------------------------
        # UI Summary
        # --------------------------------------------------

        simulation_summary = {
            strategy: {
                "ending_balance": result["ending_balance"],
                "violations": result["constraint_violations"],
                "safe": result["safe"],
                "max_drawdown": result["max_drawdown"],
                "volatility": result["volatility"],
                "sharpe_score": result["sharpe_score"],
            }
            for strategy, result in simulation_results.items()
        }

        updated_outputs["simulation"] = {
            "horizon_days": horizon,
            "strategies_evaluated": strategies,
            "results": simulation_summary
        }

        return {
            "simulations": simulation_results,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
