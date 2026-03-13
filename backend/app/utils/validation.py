def ensure_positive(amount: float, field_name: str):
    if amount < 0:
        raise ValueError(f"{field_name} must be positive")
