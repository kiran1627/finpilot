from dataclasses import dataclass


@dataclass
class FinancialGoal:
    name: str
    target: float
    priority: int = 1


def evaluate_goal_satisfaction(balance: float, goal: FinancialGoal) -> float:
    if balance >= goal.target:
        return 1.0 * goal.priority
    return (balance / goal.target) * goal.priority
