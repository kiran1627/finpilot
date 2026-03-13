class PredictionAgent:
    """
    Forecasts short-term cashflow risk.
    Fully deterministic.
    """

    def run(self, state):

        twin = state.twin
        updated_logs = list(state.logs)
        updated_outputs = dict(state.agent_outputs)

        # ==================================================
        # Base projection
        # ==================================================
        projected_balance = twin.current_balance
        next_event = twin.get_next_event()

        monthly_expenses = 0.0

        for exp in twin.recurring_expenses:
            if exp.frequency == "monthly":
                projected_balance -= exp.amount
                monthly_expenses += exp.amount

        if next_event:
            projected_balance -= next_event.amount

        # ==================================================
        # Risk scoring
        # ==================================================
        risk_score = 0
        signals = []

        # 1️⃣ Balance safety
        if projected_balance < twin.min_balance:
            risk_score += 3
            signals.append("Projected balance below minimum threshold")

        # 2️⃣ Cash runway
        if monthly_expenses > 0:
            runway_months = projected_balance / monthly_expenses
            if runway_months < 1:
                risk_score += 3
                signals.append("Cash runway less than 1 month")
            elif runway_months < 3:
                risk_score += 1
                signals.append("Cash runway between 1–3 months")

        # 3️⃣ Event proximity
        if next_event:
            days_to_event = next_event.day - twin.current_day
            if days_to_event <= 3:
                risk_score += 2
                signals.append("Large expense imminent (≤3 days)")
            elif days_to_event <= 7:
                risk_score += 1
                signals.append("Upcoming expense within a week")

        # 4️⃣ Income stability
        income_natures = {
            getattr(inc, "nature", "fixed")
            for inc in twin.income_streams
        }
        if "variable" in income_natures:
            risk_score += 1
            signals.append("Income includes variable components")

        # 5️⃣ Expense pressure
        total_income = sum(inc.amount for inc in twin.income_streams)
        if total_income > 0:
            expense_ratio = monthly_expenses / total_income
            if expense_ratio > 0.7:
                risk_score += 2
                signals.append("High mandatory expense burden (>70%)")
            elif expense_ratio > 0.4:
                risk_score += 1
                signals.append("Moderate expense burden (40–70%)")

        # 6️⃣ Volatility buffer
        volatility_buffer = twin.min_balance * 0.5
        if projected_balance < twin.min_balance + volatility_buffer:
            risk_score += 1
            signals.append("Low volatility buffer")

        # ==================================================
        # User-type bias
        # ==================================================
        user_type = getattr(state, "user_type", "professional")

        if user_type == "student":
            risk_score += 2
            signals.append("Student profile: limited income stability")
        elif user_type == "freelancer":
            risk_score += 1
            signals.append("Freelancer profile: variable income")
        elif user_type == "organisation":
            risk_score -= 1
            signals.append("Organisation profile: diversified income base")

        # ==================================================
        # Risk tier mapping
        # ==================================================
        if risk_score >= 6:
            risk_level = "HIGH"
        elif risk_score >= 3:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        projected_balance = round(projected_balance, 2)

        updated_logs.append(
            f"PredictionAgent: Projected={projected_balance}, "
            f"RiskScore={risk_score}, Risk={risk_level}, UserType={user_type}"
        )

        # ==================================================
        # Deterministic explanation
        # ==================================================
        risk_explanation = {
            "summary": (
                f"Risk is assessed as {risk_level} based on projected balance, "
                f"expense obligations, and upcoming events."
            ),
            "signals": signals,
            "score": risk_score
        }

        # 🔥 Structured UI Output
        updated_outputs["prediction"] = {
            "projected_balance": projected_balance,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "signals": signals,
            "summary": risk_explanation["summary"]
        }

        return {
            "projected_balance": projected_balance,
            "risk_level": risk_level,
            "risk_state": {
                "score": risk_score,
                "signals": signals
            },
            "risk_explanation": risk_explanation,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
