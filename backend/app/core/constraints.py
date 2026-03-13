from dataclasses import dataclass


@dataclass
class SafetyConstraints:
    min_balance: float
    max_daily_move: float
    emergency_reserve: float
