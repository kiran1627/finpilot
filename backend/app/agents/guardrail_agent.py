class GuardrailAgent:
    """
    Enforces user-defined safety constraints.
    Has veto power over execution.
    """

    def run(self, state):

        updated_logs = list(state.logs)
        updated_outputs = dict(state.agent_outputs)

        checks = {
            "autonomy_enabled": state.autonomy_enabled,
            "projection_available": state.projected_balance is not None,
            "min_balance_safe": None
        }

        # ------------------
        # Autonomy disabled
        # ------------------
        if not state.autonomy_enabled:
            updated_logs.append("GuardrailAgent: Autonomy disabled")

            updated_outputs["guardrail"] = {
                "execution_allowed": False,
                "reason": "Autonomy disabled by user",
                "checks": checks
            }

            return {
                "execution_allowed": False,
                "guardrail_reason": "Autonomy disabled by user",
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # ------------------
        # Missing prediction
        # ------------------
        if state.projected_balance is None:
            updated_logs.append(
                "GuardrailAgent: Missing projected balance — execution blocked"
            )

            updated_outputs["guardrail"] = {
                "execution_allowed": False,
                "reason": "Missing risk projection",
                "checks": checks
            }

            return {
                "execution_allowed": False,
                "guardrail_reason": "Missing risk projection",
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # ------------------
        # Minimum balance violation
        # ------------------
        min_safe = state.projected_balance >= state.twin.min_balance
        checks["min_balance_safe"] = min_safe

        if not min_safe:
            updated_logs.append("GuardrailAgent: Min balance violation")

            updated_outputs["guardrail"] = {
                "execution_allowed": False,
                "reason": "Projected balance below minimum threshold",
                "checks": checks
            }

            return {
                "execution_allowed": False,
                "guardrail_reason": "Projected balance below minimum threshold",
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # ------------------
        # All checks passed
        # ------------------
        updated_logs.append("GuardrailAgent: Execution allowed")

        success_reason = "All safety checks passed"

        updated_outputs["guardrail"] = {
            "execution_allowed": True,
            "reason": success_reason,   # ✅ FIXED (no more null)
            "checks": checks
        }

        return {
            "execution_allowed": True,
            "guardrail_reason": success_reason,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
