import json
from app.utils.openrouter_client import call_openrouter


class InvestmentAdvisorLLM:
    """
    LLM-based advisory agent.
    Provides allocation percentages + metadata.
    Execution remains deterministic.
    """

    SAFE_FALLBACK = {
        "mutual_funds": {
            "percentage": 40,
            "category": "index",
            "example_funds": ["Nifty 50 Index Fund"]
        },
        "bonds": {
            "percentage": 30,
            "category": "government_bonds",
            "example_funds": ["Government Bond ETF"]
        },
        "gold": {
            "percentage": 20,
            "category": "gold_etf",
            "example_funds": ["Gold ETF"]
        },
        "cash": {
            "percentage": 10,
            "category": "liquid",
            "example_funds": ["Liquid Fund"]
        }
    }

    # --------------------------------------------------
    # Strict Validation
    # --------------------------------------------------


    def _safe_parse(self, text: str | None, equity_min=None, equity_max=None):

        # --------------------------------------------
        # Build Dynamic Fallback (respects equity band)
        # --------------------------------------------

        if equity_min is not None and equity_max is not None:
            equity_mid = round((equity_min + equity_max) / 2, 2)
        else:
            equity_mid = 40  # fallback default if no bounds passed

        dynamic_fallback = {
            "mutual_funds": {
                "percentage": equity_mid,
                "category": "index",
                "example_funds": ["Nifty 50 Index Fund"]
            },
            "bonds": {
                "percentage": round((100 - equity_mid) * 0.6, 2),
                "category": "government_bonds",
                "example_funds": ["Government Bond ETF"]
            },
            "gold": {
                "percentage": round((100 - equity_mid) * 0.25, 2),
                "category": "gold_etf",
                "example_funds": ["Gold ETF"]
            },
            "cash": {
                "percentage": round((100 - equity_mid) * 0.15, 2),
                "category": "liquid",
                "example_funds": ["Liquid Fund"]
            }
        }

        if not text:
            return dynamic_fallback

        try:
            parsed = json.loads(text)
            required = {"mutual_funds", "bonds", "gold", "cash"}

            if not required.issubset(parsed):
                raise ValueError("Missing asset classes")

            total = 0

            for asset in required:
                block = parsed[asset]

                if "percentage" not in block:
                    raise ValueError("Missing percentage")

                if "category" not in block:
                    raise ValueError("Missing category")

                if "example_funds" not in block or not isinstance(block["example_funds"], list):
                    raise ValueError("Invalid example funds")

                total += float(block["percentage"])

            if total <= 0:
                raise ValueError("Invalid total")

            # --------------------------------------------
            # Range Enforcement (Equity)
            # --------------------------------------------

            equity_pct = float(parsed["mutual_funds"]["percentage"])

            if equity_min is not None and equity_pct < equity_min:
                raise ValueError("Equity below allowed range")

            if equity_max is not None and equity_pct > equity_max:
                raise ValueError("Equity above allowed range")

            # --------------------------------------------
            # Gold Range Enforcement (5–20%)
            # --------------------------------------------

            gold_pct = float(parsed["gold"]["percentage"])

            if gold_pct < 5 or gold_pct > 20:
                raise ValueError("Gold outside diversification range")

            # Normalize to 100%
            return {
                asset: {
                    **parsed[asset],
                    "percentage": round((parsed[asset]["percentage"] / total) * 100, 2)
                }
                for asset in required
            }

        except Exception:
            return dynamic_fallback


    # --------------------------------------------------
    # Main Execution
    # --------------------------------------------------

    def run(self, state):

        updated_logs = list(state.logs)
        updated_outputs = dict(getattr(state, "agent_outputs", {}))

        advisor_output = {
            "source": None,
            "risk_level": state.risk_level,
            "suggested_percentages": {},
            "categories": {},
            "example_funds": {}
        }

        if state.investable_amount <= 0:
            advisor_output["source"] = "none"
            updated_outputs["investment_advisor"] = advisor_output

            return {
                "investment_suggestions": None,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }
        
        # --------------------------------------------
        # Dynamic Equity Target Calculation
        # --------------------------------------------

        if state.risk_level == "LOW":
            equity_min, equity_max = 20, 50
        elif state.risk_level == "MEDIUM":
            equity_min, equity_max = 40, 70
        else:  # HIGH
            equity_min, equity_max = 60, 90

        # Optional: modify by user_type
        if state.user_type == "student":
            equity_max -= 10
        elif state.user_type == "organisation":
            equity_min += 5

        # Surplus influence (bigger surplus → more equity)
        if state.investable_amount > 100000:
            equity_min += 5
            equity_max += 5

        equity_min = max(0, min(100, equity_min))
        equity_max = max(0, min(100, equity_max))


        prompt = f"""
You are a portfolio optimization engine.

Context:
- Investable amount: ₹{state.investable_amount}
- Risk level: {state.risk_level}
- User type: {state.user_type}

STRICT NUMERIC CONSTRAINTS:

1) Mutual funds (equity exposure) must be between {equity_min}% and {equity_max}%.
2) Bonds + cash must balance remaining risk.
3) Gold should be 5-20% depending on diversification.
4) Total allocation must sum EXACTLY to 100.

Allocation rules:
- LOW risk → defensive bias.
- MEDIUM risk → balanced growth.
- HIGH risk → aggressive growth tilt.

Return STRICT JSON ONLY:

{{
  "mutual_funds": {{
    "percentage": number,
    "category": "...",
    "example_funds": ["..."]
  }},
  "bonds": {{
    "percentage": number,
    "category": "...",
    "example_funds": ["..."]
  }},
  "gold": {{
    "percentage": number,
    "category": "...",
    "example_funds": ["..."]
  }},
  "cash": {{
    "percentage": number,
    "category": "...",
    "example_funds": ["..."]
  }}
}}

Rules:
- Percentages must sum exactly to 100
- Do NOT return 40/30/20/10
- Vary allocations based on constraints
- No markdown
"""


        raw_response = call_openrouter(prompt)
        suggestions = self._safe_parse(
            raw_response,
            equity_min=equity_min,
            equity_max=equity_max
        )


        advisor_output["source"] = "AI Insight Engine" if raw_response else "AI Engine"

        updated_logs.append(
            f"InvestmentAdvisor: Source={advisor_output['source']}, "
            f"EquityRange={equity_min}-{equity_max}"
        )


        for asset, meta in suggestions.items():
            advisor_output["suggested_percentages"][asset] = meta["percentage"]
            advisor_output["categories"][asset] = meta.get("category")
            advisor_output["example_funds"][asset] = meta.get("example_funds")

        updated_outputs["investment_advisor"] = advisor_output

        return {
            "investment_suggestions": suggestions,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
