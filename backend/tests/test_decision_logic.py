from app.state.system_state import SystemState
from app.core.financial_twin import FinancialDigitalTwin
from app.agents.decision_agent import DecisionAgent


def test_decision_selects_strategy_with_fewer_violations():
    twin = FinancialDigitalTwin(
        current_balance=20000,
        min_balance=10000
    )

    state = SystemState(twin=twin)

    state.simulations = {
        "conservative": {
            "ending_balance": 18000,
            "constraint_violations": 0
        },
        "aggressive": {
            "ending_balance": 22000,
            "constraint_violations": 3
        }
    }

    DecisionAgent().run(state)

    assert state.chosen_strategy == "conservative"
