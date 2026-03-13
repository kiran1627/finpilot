import json
from pathlib import Path


AUDIT_FILE = Path("app/storage/audit_log.json")


def persist_audit_logs(audit_logs: list):
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(AUDIT_FILE, "w") as f:
        json.dump(audit_logs, f, indent=2)
