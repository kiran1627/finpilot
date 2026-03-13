from app.core.financial_twin import (
    FinancialDigitalTwin,
    IncomeStream,
    RecurringExpense,
    OneTimeEvent
)
from app.api.schemas import UserFinancialProfile
from app.state.system_state import SystemState


def profile_to_twin(profile: UserFinancialProfile) -> FinancialDigitalTwin:
    """
    Converts user API input into a Financial Digital Twin.
    """

    twin = FinancialDigitalTwin(
        current_balance=profile.current_balance,
        min_balance=profile.min_balance
    )

    # ---------- Income ----------
    twin.income_streams = [
        IncomeStream(
            name=i.name,
            amount=i.amount,
            frequency=i.timing
        )
        for i in profile.incomes
    ]

    # ---------- Expenses ----------
    twin.recurring_expenses = [
        RecurringExpense(
            name=e.name,
            amount=e.amount,
            frequency=e.timing
        )
        for e in profile.expenses
    ]

    # ---------- One-time events ----------
    twin.upcoming_events = [
        OneTimeEvent(
            name=ev.name,
            amount=ev.amount,
            day=ev.day
        )
        for ev in (profile.upcoming_events or [])
    ]

    return twin


def profile_to_state(
    profile: UserFinancialProfile,
    twin: FinancialDigitalTwin
) -> SystemState:
    """
    Converts user profile + twin into SystemState.

    Responsibilities:
    - Pass human-in-the-loop controls (autonomy, user_type)
    - Apply optional investment policy (Option C)
    """

    state = SystemState(
        twin=twin,
        autonomy_enabled=profile.autonomy_enabled,
        user_type=profile.user_type  # ✅ NEW
    )

    # ---------- Investment policy (Option C) ----------
    if profile.investment_policy:
        state.investment_policy = profile.investment_policy.dict()
        state.max_investment_pct = profile.investment_policy.max_investment_pct

    # Else: SystemState default (50%) remains safely in effect

    return state
