class InvestmentAllocationAgent:
    """
    Determines safe investable surplus.
    Respects user-defined investment caps.
    Strategy-aware capital allocation logic.
    NEVER selects assets.
    """

    SAFETY_MULTIPLIER = 1.5

    def run(self, state):

        twin = state.twin
        updated_logs = list(state.logs)
        updated_outputs = dict(state.agent_outputs)

        allocation_output = {
            "risk_gate_passed": False,
            "safety_buffer": None,
            "surplus": None,
            "user_cap_pct": getattr(state, "max_investment_pct", 50),
            "investable_amount": 0.0,
            "reason": None
        }

        # --------------------------------------------------
        # Idempotency guard
        # --------------------------------------------------
        if state.investment_executed:
            allocation_output["reason"] = "Investment already executed"
            updated_outputs["investment_allocation"] = allocation_output
            return {
                "investable_amount": 0.0,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # --------------------------------------------------
        # Projection safety check
        # --------------------------------------------------
        if state.projected_balance is None:
            allocation_output["reason"] = "Missing projection"
            updated_outputs["investment_allocation"] = allocation_output
            return {
                "investable_amount": 0.0,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        if state.projected_balance < twin.min_balance:
            allocation_output["reason"] = "Projected balance below minimum threshold"
            updated_outputs["investment_allocation"] = allocation_output
            return {
                "investable_amount": 0.0,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # --------------------------------------------------
        # Safety buffer calculation
        # --------------------------------------------------
        safety_buffer = twin.min_balance * self.SAFETY_MULTIPLIER
        surplus = twin.current_balance - safety_buffer

        allocation_output["safety_buffer"] = round(safety_buffer, 2)
        allocation_output["surplus"] = round(surplus, 2)

        if surplus <= 0:
            allocation_output["reason"] = "No surplus after safety buffer"
            updated_outputs["investment_allocation"] = allocation_output
            return {
                "investable_amount": 0.0,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # --------------------------------------------------
        # Risk-based allocation policy
        # --------------------------------------------------

        risk = state.risk_level
        policy_cap = allocation_output["user_cap_pct"]

        if risk == "HIGH":
            allocation_output["reason"] = "High risk profile — investment blocked"
            updated_outputs["investment_allocation"] = allocation_output
            return {
                "investable_amount": 0.0,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        elif risk == "MEDIUM":
            # Allow controlled capital exposure (20–40%)
            dynamic_cap = min(policy_cap, 40)
            investable = surplus * (dynamic_cap / 100)
            allocation_output["risk_gate_passed"] = True
            allocation_output["investable_amount"] = round(investable, 2)
            allocation_output["reason"] = "Moderate risk — limited investment enabled"

        elif risk == "LOW":
            # Allow full policy cap
            investable = surplus * (policy_cap / 100)
            allocation_output["risk_gate_passed"] = True
            allocation_output["investable_amount"] = round(investable, 2)
            allocation_output["reason"] = "Low risk — full investment allowed"

        else:
            allocation_output["reason"] = "Unknown risk state"
            updated_outputs["investment_allocation"] = allocation_output
            return {
                "investable_amount": 0.0,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        updated_logs.append(
            f"InvestmentAllocationAgent: Risk={risk}, "
            f"Surplus=₹{round(surplus,2)}, "
            f"Investable=₹{allocation_output['investable_amount']}"
        )

        updated_outputs["investment_allocation"] = allocation_output

        return {
            "investable_amount": allocation_output["investable_amount"],
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
