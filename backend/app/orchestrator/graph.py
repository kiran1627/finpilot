from langgraph.graph import StateGraph, END

from app.orchestrator.nodes import (
    perception_node,
    prediction_node,
    simulation_node,
    decision_node,
    guardrail_node,

    # Execution stages (SPLIT)
    reality_execution_node,        # Always-on, real-world events
    investment_allocation_node,    # Computes investable surplus
    investment_llm_node,           # Advisory only (LLM)
    investment_execution_node,     # Ledger write (mock)
    investment_explanation_node,   # Investment-specific explanation

    explanation_node               # Final system explanation
)


def build_finpilot_graph():
    """
    Builds the FinPilot autonomous decision graph.

    Guarantees:
    - Reality execution ALWAYS runs (events are mandatory)
    - Autonomy OFF blocks the entire investment pipeline
    - Investment is advisory + simulated (no real money)
    - Ledger writes happen exactly once per surplus
    """

    graph = StateGraph(dict)

    # ------------------
    # Register nodes
    # ------------------
    graph.add_node("perception", perception_node)
    graph.add_node("prediction", prediction_node)
    graph.add_node("simulation", simulation_node)
    graph.add_node("decision", decision_node)
    graph.add_node("guardrail", guardrail_node)

    # Execution pipeline
    graph.add_node("reality_execution", reality_execution_node)

    # Investment pipeline
    graph.add_node("investment_allocation", investment_allocation_node)
    graph.add_node("investment_llm", investment_llm_node)
    graph.add_node("investment_execution", investment_execution_node)
    graph.add_node("investment_explanation", investment_explanation_node)

    # Final explanation
    graph.add_node("explanation", explanation_node)

    # ------------------
    # Core flow
    # ------------------
    graph.set_entry_point("perception")

    graph.add_edge("perception", "prediction")
    graph.add_edge("prediction", "simulation")
    graph.add_edge("simulation", "decision")
    graph.add_edge("decision", "guardrail")

    # Reality ALWAYS executes
    graph.add_edge("guardrail", "reality_execution")

    # ------------------
    # 🔐 AUTONOMY GATE (FIX 2)
    # ------------------
    graph.add_conditional_edges(
        "reality_execution",
        lambda state: "invest" if state.get("autonomy_enabled", True) else "explain",
        {
            "invest": "investment_allocation",
            "explain": "explanation"
        }
    )

    # ------------------
    # Investment pipeline
    # ------------------
    graph.add_edge("investment_allocation", "investment_llm")
    graph.add_edge("investment_llm", "investment_execution")
    graph.add_edge("investment_execution", "investment_explanation")
    graph.add_edge("investment_explanation", "explanation")

    # ------------------
    # End
    # ------------------
    graph.add_edge("explanation", END)

    return graph.compile()
