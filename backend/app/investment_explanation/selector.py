import json
from pathlib import Path

KNOWLEDGE_PATH = Path(__file__).parent / "explanation_knowledge.json"

with open(KNOWLEDGE_PATH, "r") as f:
    KNOWLEDGE = json.load(f)


def select_explanation(asset, risk_level, pct):
    entries = KNOWLEDGE.get(asset, {})

    candidates = (
        entries.get(risk_level)
        or entries.get("ALL")
        or []
    )

    for item in candidates:
        if item["min_pct"] <= pct <= item["max_pct"]:
            return item

    return None
