class DecisionAgent:
    """
    Intelligent multi-factor strategy selector.

    Stabilized scoring:
    - Normalized balance
    - Clamped Sharpe ratio
    - Controlled penalties
    - No numeric explosion

    Fully deterministic.
    """

    # Tunable weights
    BALANCE_WEIGHT = 1000
    SHARPE_WEIGHT = 300
    VIOLATION_PENALTY = 2000
    DRAWDOWN_PENALTY = 500

    # Sharpe clamp range
    MAX_SHARPE = 3
    MIN_SHARPE = -3

    def _clamp(self, value, min_value, max_value):
        return max(min(value, max_value), min_value)

    def run(self, state):

        updated_outputs = dict(getattr(state, "agent_outputs", {}))
        updated_logs = list(state.logs)

        if not state.simulations:
            updated_logs.append("DecisionAgent: No simulation results available")

            updated_outputs["decision"] = {
                "selected_strategy": None,
                "reason": "No simulation results available"
            }

            return {
                "chosen_strategy": None,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # --------------------------------------------------
        # Step 1: Find max balance for normalization
        # --------------------------------------------------

        max_balance = max(
            result.get("ending_balance", 0)
            for result in state.simulations.values()
        ) or 1  # prevent divide-by-zero

        best_strategy = None
        best_score = float("-inf")
        evaluation_breakdown = {}

        # --------------------------------------------------
        # Step 2: Score each strategy
        # --------------------------------------------------

        for strategy, result in state.simulations.items():

            ending_balance = result.get("ending_balance", 0)
            violations = result.get("constraint_violations", 0)
            sharpe = result.get("sharpe_score", 0)
            max_drawdown = result.get("max_drawdown", 0)

            # Normalize balance (0 to 1 scale)
            normalized_balance = ending_balance / max_balance

            # Clamp Sharpe ratio to avoid explosion
            sharpe = self._clamp(sharpe, self.MIN_SHARPE, self.MAX_SHARPE)

            # Clamp drawdown between 0 and 1
            max_drawdown = self._clamp(max_drawdown, 0, 1)

            # -----------------------------------------
            # Stable Scoring Model
            # -----------------------------------------

            score = (
                (normalized_balance * self.BALANCE_WEIGHT)
                + (sharpe * self.SHARPE_WEIGHT)
                - (violations * self.VIOLATION_PENALTY)
                - (max_drawdown * self.DRAWDOWN_PENALTY)
            )

            evaluation_breakdown[strategy] = {
                "normalized_balance": round(normalized_balance, 4),
                "ending_balance": ending_balance,
                "sharpe_score_clamped": sharpe,
                "violations": violations,
                "max_drawdown": max_drawdown,
                "final_score": round(score, 2)
            }

            if score > best_score:
                best_score = score
                best_strategy = strategy

        updated_logs.append(
            f"DecisionAgent: Selected {best_strategy} with stable score {round(best_score,2)}"
        )

        updated_outputs["decision"] = {
            "selected_strategy": best_strategy,
            "final_score": round(best_score, 2),
            "evaluation_model": "Normalized multi-factor scoring",
            "strategy_comparison": evaluation_breakdown
        }

        return {
            "chosen_strategy": best_strategy,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
