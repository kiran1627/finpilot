from datetime import datetime


def create_transaction(action: str, amount: float) -> dict:
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "amount": amount
    }
