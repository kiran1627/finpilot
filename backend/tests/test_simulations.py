from app.core.financial_twin import FinancialDigitalTwin, RecurringExpense
from app.state.system_state import SystemState
from app.agents.simulation_agent import SimulationAgent


def test_simulation_produces_30_day_trajectory():
    twin = FinancialDigitalTwin(
        current_balance=20000,
        min_balance=10000,
        recurring_expenses=[
            RecurringExpense(
                name="Rent",
                amount=15000,
                frequency="monthly"
            )
        ]
    )

    state = SystemState(twin=twin)

    SimulationAgent().run(state)

    assert "conservative" in state.simulations
    assert len(state.simulations["conservative"]["daily_balances"]) == 30
