import json
from pathlib import Path


def save_twin(twin, path="app/storage/twin.json"):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(twin.__dict__, f, indent=2)
