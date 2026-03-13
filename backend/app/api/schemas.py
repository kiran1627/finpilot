from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# ------------------
# Income
# ------------------

class IncomeInput(BaseModel):
    name: str
    amount: float

    timing: Literal["monthly", "weekly", "irregular"]
    nature: Literal["fixed", "variable", "mixed"]


# ------------------
# Expense
# ------------------

class ExpenseInput(BaseModel):
    name: str
    amount: float

    timing: Literal["monthly", "weekly", "yearly"]
    nature: Literal["fixed", "variable", "mixed"]

    mandatory: bool = True


# ------------------
# One-time events
# ------------------

class EventInput(BaseModel):
    name: str
    day: int
    amount: float   # expense (+), income (-)


# ------------------
# Investment Policy (OPTION C)
# ------------------

class InvestmentPolicy(BaseModel):
    """
    User-controlled investment safety policy.
    Acts as a human-in-the-loop constraint.
    """

    max_investment_pct: float = Field(
        default=50.0,
        ge=0,
        le=100,
        description="Maximum percentage of surplus allowed for investment"
    )


# ------------------
# User Financial Profile
# ------------------

class UserFinancialProfile(BaseModel):
    """
    Canonical API input model for FinPilot.

    Fully user-driven:
    - User defines finances
    - User controls autonomy
    - User controls investment exposure
    """

    # Core balances
    current_balance: float
    min_balance: float

    # Financial structure
    incomes: List[IncomeInput]
    expenses: List[ExpenseInput]
    upcoming_events: Optional[List[EventInput]] = []

    # ------------------
    # Human-in-the-loop controls
    # ------------------

    autonomy_enabled: bool = True

    user_type: Literal[
        "student",
        "freelancer",
        "professional",
        "organisation"
    ] = "professional"

    investment_policy: Optional[InvestmentPolicy] = None
