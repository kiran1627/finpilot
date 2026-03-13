from app.api.schemas import UserFinancialProfile
from app.core.financial_twin import (
    FinancialDigitalTwin,
    IncomeStream,
    RecurringExpense,
    OneTimeEvent
)
from app.state.system_state import SystemState
from app.orchestrator.graph import build_finpilot_graph


def run_autonomy_cycle(profile: UserFinancialProfile):
    """
    Executes a continuous autonomous finance loop
    driven entirely by user input.
    """

    # ------------------
    # Build Financial Digital Twin from user input
    # ------------------
    twin = FinancialDigitalTwin(
        current_balance=profile.current_balance,
        min_balance=profile.min_balance,
        current_day=0
    )

    # Map incomes
    twin.income_streams = [
        IncomeStream(
            name=i.name,
            amount=i.amount,
            frequency=i.frequency
        )
        for i in profile.incomes
    ]

    # Map expenses
    twin.recurring_expenses = [
        RecurringExpense(
            name=e.name,
            amount=e.amount,
            frequency=e.frequency
        )
        for e in profile.expenses
    ]

    # Map upcoming events
    twin.upcoming_events = [
        OneTimeEvent(
            name=e.name,
            amount=e.amount,
            day=e.day
        )
        for e in profile.upcoming_events
    ]

    # ------------------
    # Initialize system state
    # ------------------
    state = SystemState(
        twin=twin,
        autonomy_enabled=profile.autonomy_enabled
    )

    graph = build_finpilot_graph()

    # ------------------
    # Autonomous event-driven loop
    # ------------------
    execution_history = []

    while True:
        state_dict = state.__dict__
        updated_state_dict = graph.invoke(state_dict)
        state = SystemState(**updated_state_dict)

        execution_history.append({
            "day": state.twin.current_day,
            "balance": state.twin.current_balance,
            "chosen_strategy": state.chosen_strategy,
            "risk_level": state.risk_level,
            "next_event": (
                state.next_event["name"]
                if state.next_event else None
            )
        })

        # Stop condition: no more events
        if not state.next_event:
            break

    # ------------------
    # Final response
    # ------------------
    return {
        "final_balance": state.twin.current_balance,
        "final_day": state.twin.current_day,
        "execution_history": execution_history,
        "audit_log": state.audit_log,
        "explanation": state.explanation,
        "logs": state.logs
    }
