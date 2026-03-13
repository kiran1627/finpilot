class ExplanationAgent:
    """
    Generates a human-readable explanation for the AI decision.

    Guarantees:
    - Deterministic
    - No LLM usage
    - NEVER influences decision logic
    - ALWAYS succeeds
    """

    def run(self, state):

        updated_logs = list(state.logs)
        updated_outputs = dict(state.agent_outputs)

        explanation = {
            "risk_level": state.risk_level,
            "chosen_strategy": state.chosen_strategy,
            "reasoning": [],
            "confidence": None
        }

        # --------------------------------------------------
        # Projected balance
        # --------------------------------------------------
        if state.projected_balance is not None:
            explanation["reasoning"].append(
                f"Projected balance after expenses was ₹{state.projected_balance}"
            )
        else:
            explanation["reasoning"].append(
                "Projected balance could not be computed safely"
            )

        # --------------------------------------------------
        # Risk interpretation
        # --------------------------------------------------
        if state.risk_level == "HIGH":
            explanation["reasoning"].append(
                "High cashflow risk detected based on minimum balance constraints"
            )
        elif state.risk_level == "MEDIUM":
            explanation["reasoning"].append(
                "Moderate cashflow risk detected"
            )
        elif state.risk_level == "LOW":
            explanation["reasoning"].append(
                "Cashflow risk within safe limits"
            )
        else:
            explanation["reasoning"].append(
                "Risk level could not be determined reliably"
            )

        # --------------------------------------------------
        # Strategy explanation
        # --------------------------------------------------
        if state.chosen_strategy:
            explanation["reasoning"].append(
                f"Strategy '{state.chosen_strategy}' achieved the highest utility score"
            )
        else:
            explanation["reasoning"].append(
                "No strategy was executed due to safety constraints"
            )

        # --------------------------------------------------
        # Confidence heuristic
        # --------------------------------------------------
        explanation["confidence"] = {
            "LOW": "92%",
            "MEDIUM": "85%",
            "HIGH": "78%"
        }.get(state.risk_level, "80%")

        updated_logs.append("ExplanationAgent: Deterministic explanation generated")

        # 🔥 Structured UI Output
        updated_outputs["explanation"] = explanation

        return {
            "explanation": explanation,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
