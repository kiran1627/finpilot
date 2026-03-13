from app.state.system_state import SystemState

# ------------------
# Core agents
# ------------------
from app.agents.perception_agent import PerceptionAgent
from app.agents.prediction_agent import PredictionAgent
from app.agents.simulation_agent import SimulationAgent
from app.agents.decision_agent import DecisionAgent
from app.agents.guardrail_agent import GuardrailAgent
from app.agents.explanation_agent import ExplanationAgent

# ------------------
# Execution agents (SPLIT)
# ------------------
from app.agents.reality_execution_agent import RealityExecutionAgent
from app.agents.investment_execution_agent import InvestmentExecutionAgent

# ------------------
# Investment agents
# ------------------
from app.agents.investment_allocation_agent import InvestmentAllocationAgent
from app.agents.investment_llm_agent import InvestmentAdvisorLLM
from app.investment_explanation.investment_explanation_agent import InvestmentExplanationAgent


# ==================================================
# Internal helper
# ==================================================

def _run(agent, state_dict: dict):
    """
    Bridge function:
    - dict -> SystemState
    - agent returns partial updates (dict)
    - merge updates back into state_dict

    IMPORTANT:
    - Runtime-only fields (e.g. db) are NOT part of SystemState
    - SystemState remains pure domain data
    - DB is injected into agents at runtime
    """

    # ----------------------------------------
    # Work on a shallow copy (CRITICAL)
    # ----------------------------------------
    state_copy = dict(state_dict)

    # ----------------------------------------
    # Extract runtime-only dependencies
    # ----------------------------------------
    db = state_copy.pop("db", None)

    # ----------------------------------------
    # Reconstruct PURE domain state
    # ----------------------------------------
    system_state = SystemState(**state_copy)

    # ----------------------------------------
    # Inject runtime dependencies into agent
    # ----------------------------------------
    if db is not None:
        agent.db = db   # ⭐ THIS IS THE FIX

    # ----------------------------------------
    # Run agent
    # ----------------------------------------
    updates = agent.run(system_state)

    # ----------------------------------------
    # Merge updates immutably
    # ----------------------------------------
    new_state = {**state_copy, **updates}

    # ----------------------------------------
    # Re-attach runtime-only dependencies
    # ----------------------------------------
    if db is not None:
        new_state["db"] = db

    return new_state



# ==================
# Core autonomy nodes
# ==================

def perception_node(state: dict):
    return _run(PerceptionAgent(), state)


def prediction_node(state: dict):
    return _run(PredictionAgent(), state)


def simulation_node(state: dict):
    return _run(SimulationAgent(), state)


def decision_node(state: dict):
    return _run(DecisionAgent(), state)


def guardrail_node(state: dict):
    return _run(GuardrailAgent(), state)


# ==================
# Execution (SPLIT)
# ==================

def reality_execution_node(state: dict):
    """
    Reality execution ALWAYS runs.
    Events cannot be skipped.
    """
    return _run(RealityExecutionAgent(), state)


def investment_execution_node(state: dict):
    """
    Investment execution MUST NOT run when autonomy is OFF.
    Hard safety guard.
    """

    if not state.get("autonomy_enabled", True):
        return state  # hard stop, no ledger mutation

    return _run(InvestmentExecutionAgent(), state)


# ==================
# Investment pipeline
# ==================

def investment_allocation_node(state: dict):
    return _run(InvestmentAllocationAgent(), state)


def investment_llm_node(state: dict):
    return _run(InvestmentAdvisorLLM(), state)


def investment_explanation_node(state: dict):
    return _run(InvestmentExplanationAgent(), state)


# ==================
# Final explanation
# ==================

def explanation_node(state: dict):
    return _run(ExplanationAgent(), state)
