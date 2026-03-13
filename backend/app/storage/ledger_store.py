import json
from pathlib import Path


def save_ledger(ledger, path="app/storage/ledger.json"):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(ledger, f, indent=2)
