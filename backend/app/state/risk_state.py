from dataclasses import dataclass
from app.core.enums import RiskLevel


@dataclass
class RiskState:
    level: RiskLevel
    projected_balance: float
    explanation: str
