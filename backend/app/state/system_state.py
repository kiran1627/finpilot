from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

from app.core.financial_twin import FinancialDigitalTwin
from app.state.risk_state import RiskState


@dataclass
class SystemState:
    """
    Institutional-grade shared state.

    Single source of truth for:
    - Autonomy decisions
    - Portfolio analytics
    - Risk modeling
    - Replay & audit
    """

    # ==================================================
    # REQUIRED
    # ==================================================
    twin: FinancialDigitalTwin

    # ==================================================
    # AUTONOMY CONTEXT
    # ==================================================
    autonomy_enabled: bool = True

    user_type: str = "professional"
    user_id: Optional[str] = None
    user_email: Optional[str] = None

    run_id: Optional[str] = None

    # ==================================================
    # TIME
    # ==================================================
    current_day: int = 0
    next_event: Optional[Any] = None

    # ==================================================
    # RISK & PREDICTION
    # ==================================================
    projected_balance: Optional[float] = None
    risk_level: Optional[str] = None

    risk_state: Optional[RiskState] = None
    risk_explanation: Optional[Dict[str, Any]] = None

    # ==================================================
    # STRATEGY SIMULATION
    # ==================================================
    simulations: Dict[str, Any] = field(default_factory=dict)
    chosen_strategy: Optional[str] = None

    # Advanced metrics (from simulation)
    strategy_metrics: Dict[str, Any] = field(default_factory=dict)

    # ==================================================
    # GUARDRAILS
    # ==================================================
    execution_allowed: bool = False
    guardrail_reason: Optional[str] = None

    # ==================================================
    # INVESTMENT CORE
    # ==================================================
    investable_amount: float = 0.0
    investment_suggestions: Optional[Dict[str, Any]] = None
    investment_explanation: Optional[Dict[str, Any]] = None
    investment_executed: bool = False

    # ==================================================
    # INVESTMENT POLICY
    # ==================================================
    investment_policy: Optional[Dict[str, Any]] = None
    max_investment_pct: float = 50.0

    allocation_method: Optional[str] = None
    allocation_confidence: Optional[float] = None

    # ==================================================
    # PORTFOLIO ANALYTICS
    # ==================================================
    current_allocation: Dict[str, float] = field(default_factory=dict)
    target_allocation: Dict[str, float] = field(default_factory=dict)
    rebalance_required: bool = False

    # ==================================================
    # MONTE CARLO & LONG TERM PROJECTION
    # ==================================================
    monte_carlo_result: Optional[Dict[str, Any]] = None

    projected_1y_value: Optional[float] = None
    projected_5y_value: Optional[float] = None
    projected_10y_value: Optional[float] = None

    # ==================================================
    # EXECUTION & AUDIT
    # ==================================================
    ledger: List[Dict[str, Any]] = field(default_factory=list)
    audit_log: List[Dict[str, Any]] = field(default_factory=list)

    # ==================================================
    # EXPLAINABILITY
    # ==================================================
    explanation: Optional[Dict[str, Any]] = None
    logs: List[str] = field(default_factory=list)

    # ==================================================
    # UI LAYER (Structured Outputs)
    # ==================================================
    agent_outputs: Dict[str, Any] = field(default_factory=dict)
