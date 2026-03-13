from app.core.financial_twin import FinancialDigitalTwin
from app.state.system_state import SystemState
from app.agents.guardrail_agent import GuardrailAgent


def test_guardrail_blocks_execution_when_balance_low():
    twin = FinancialDigitalTwin(
        current_balance=5000,
        min_balance=10000
    )

    state = SystemState(
        twin=twin,
        autonomy_enabled=True
    )

    state.projected_balance = 5000  # Simulate prediction output

    GuardrailAgent().run(state)

    assert state.execution_allowed is False
