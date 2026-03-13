from app.investment_explanation.selector import select_explanation


class InvestmentExplanationAgent:
    """
    Deterministic, structured explanation.
    Clean UX-ready formatting.
    Explains ACTUAL executed allocation (not raw suggestions).
    """

    def _format_money(self, amount: float) -> str:
        return f"₹{int(amount):,}"

    def run(self, state):

        updated_logs = list(state.logs)
        updated_outputs = dict(getattr(state, "agent_outputs", {}))

        execution_data = updated_outputs.get("investment_execution")

        if not execution_data or not execution_data.get("executed"):
            updated_logs.append("InvestmentExplanation: Nothing executed to explain")

            explanation_output = {
                "text": None,
                "risk_level": state.risk_level,
                "invested_amount": 0
            }

            updated_outputs["investment_explanation"] = explanation_output

            return {
                "investment_explanation": explanation_output,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # --------------------------------------------
        # Extract execution source of truth
        # --------------------------------------------

        total = execution_data.get("total_invested", 0)
        allocation_percentages = execution_data.get("allocation_percentages", {})
        allocation_amounts = execution_data.get("allocation_amounts", {})
        risk = state.risk_level
        source = execution_data.get("allocation_source", "Unknown")

        explanation_lines = []

        # --------------------------------------------
        # HEADER
        # --------------------------------------------

        header = (
            f"Total Invested: {self._format_money(total)}\n"
            f"Risk Profile: {risk}\n"
            f"Allocation Engine: {source}\n\n"
            f"Allocation Breakdown:\n"
        )

        # --------------------------------------------
        # ASSET BREAKDOWN
        # --------------------------------------------

        for asset, pct in allocation_percentages.items():

            if pct <= 0:
                continue

            amount = allocation_amounts.get(asset, 0)
            formatted_amount = self._format_money(amount)

            selected = select_explanation(asset, risk, pct)

            asset_label = asset.replace("_", " ").title()

            if selected:
                fund = selected["fund"]
                growth = selected["growth"]
                logic = selected["logic"]

                block = (
                    f"• {asset_label} — {formatted_amount} ({round(pct,1)}%)\n"
                    f"  Fund: {fund}\n"
                    f"  Expected Growth: {growth}\n"
                    f"  Rationale: {logic}\n"
                )
            else:
                block = (
                    f"• {asset_label} — {formatted_amount} ({round(pct,1)}%)\n"
                )

            explanation_lines.append(block)

        # --------------------------------------------
        # PERFORMANCE METRICS (if available)
        # --------------------------------------------

        metrics_block = ""

        if "sharpe_score" in execution_data:
            metrics_block += f"\nSharpe Score: {execution_data['sharpe_score']}"

        if "expected_return" in execution_data:
            expected_pct = round(execution_data["expected_return"] * 100, 2)
            metrics_block += f"\nExpected Annual Return: {expected_pct}%"

        projection = execution_data.get("long_term_projection")

        if projection:
            final_value = self._format_money(projection["final_value"])
            annualized = round(projection["annualized_return"] * 100, 2)

            metrics_block += (
                f"\n\n10-Year Projection:\n"
                f"  Estimated Value: {final_value}\n"
                f"  Annualized Return: {annualized}%"
            )

        full_text = header + "\n".join(explanation_lines) + metrics_block

        explanation_output = {
            "text": full_text,
            "risk_level": risk,
            "invested_amount": total
        }

        updated_logs.append(
            "InvestmentExplanation: Structured execution-based explanation generated"
        )

        updated_outputs["investment_explanation"] = explanation_output

        return {
            "investment_explanation": explanation_output,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
