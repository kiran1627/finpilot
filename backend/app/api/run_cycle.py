from fastapi import APIRouter, Depends
from app.api.schemas import UserFinancialProfile
from app.api.adapters import profile_to_twin
from app.services.autonomy_loop import run_autonomy_loop
from app.state.system_state import SystemState

from app.auth.dependencies import get_current_user
from app.auth.models import User

router = APIRouter()


@router.post("/run-autonomy-cycle")
def run_cycle(
    profile: UserFinancialProfile,
    current_user: User = Depends(get_current_user),  # ✅ REAL AUTH
):
    """
    Protected endpoint.
    Requires valid JWT token.
    """

    twin = profile_to_twin(profile)

    # ✅ Use real authenticated user
    user_id = current_user.id

    # Handle investment policy safely
    if profile.investment_policy:
        max_investment_pct = profile.investment_policy.max_investment_pct
        investment_policy = profile.investment_policy.model_dump()
    else:
        max_investment_pct = 50
        investment_policy = {}

    state = SystemState(
        twin=twin,
        autonomy_enabled=profile.autonomy_enabled,
        user_type=profile.user_type,
        user_id=user_id,  # ✅ attached to run
        investment_policy=investment_policy,
        max_investment_pct=max_investment_pct
    )

    result = run_autonomy_loop(state)
    final_state = result["final_state"]

    return {
        "run_id": result["run_id"],
        "final_balance": final_state.twin.current_balance,
        "risk_level": final_state.risk_level,
        "strategy": final_state.chosen_strategy,
        "ledger": final_state.ledger, 
        "agent_outputs": final_state.agent_outputs
    }
