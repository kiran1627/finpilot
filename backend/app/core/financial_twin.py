from dataclasses import dataclass, field
from typing import List, Optional
import copy


# ----------------------------
# Domain primitives
# ----------------------------

@dataclass
class RecurringExpense:
    name: str
    amount: float
    frequency: str          # "monthly" | "weekly"
    nature: str = "fixed"   # ✅ ADD (fixed | variable)
    mandatory: bool = True  # ✅ ADD (used by guardrails later)


@dataclass
class IncomeStream:
    name: str
    amount: float
    frequency: str          # "monthly" | "weekly" | "irregular"
    nature: str = "fixed"   # ✅ ADD (fixed | variable)


@dataclass
class OneTimeEvent:
    name: str
    amount: float          # expense (+) or income (-)
    day: int               # absolute day in simulation timeline


# ----------------------------
# Financial Digital Twin
# ----------------------------

@dataclass
class FinancialDigitalTwin:
    """
    Simulatable financial replica of the user.
    - Cloned for simulations
    - Mutated only during execution
    """

    # Core balances
    current_balance: float
    min_balance: float

    # Time awareness
    current_day: int = 0

    # Financial structure
    income_streams: List[IncomeStream] = field(default_factory=list)
    recurring_expenses: List[RecurringExpense] = field(default_factory=list)
    upcoming_events: List[OneTimeEvent] = field(default_factory=list)

    # ----------------------------
    # Core Twin Ops
    # ----------------------------

    def clone(self) -> "FinancialDigitalTwin":
        """
        Deep copy for safe simulation.
        """
        return copy.deepcopy(self)

    def apply_income(self, amount: float):
        self.current_balance += amount

    def apply_expense(self, amount: float):
        self.current_balance -= amount

    def violates_constraints(self) -> bool:
        return self.current_balance < self.min_balance

    # ----------------------------
    # Time & Event Logic
    # ----------------------------

    def get_next_event(self) -> Optional[OneTimeEvent]:
        """
        Returns the next upcoming event after current_day.
        """
        future_events = [
            e for e in self.upcoming_events if e.day >= self.current_day
        ]
        if not future_events:
            return None
        return min(future_events, key=lambda e: e.day)

    def advance_to_day(self, day: int):
        """
        Moves simulation time forward.
        """
        if day < self.current_day:
            raise ValueError("Cannot move back in time")
        self.current_day = day

    def apply_recurring_cashflows(self):
        """
        Apply recurring incomes and expenses for the current day.
        (Simple monthly heuristic: day % 30 == 0)
        Returns list of applied expenses for ledger tracking.
        """
        applied_expenses = []
        
        if self.current_day % 30 == 0:
            for inc in self.income_streams:
                if inc.frequency == "monthly":
                    self.apply_income(inc.amount)

            for exp in self.recurring_expenses:
                if exp.frequency == "monthly":
                    self.apply_expense(exp.amount)
                    applied_expenses.append(exp)
        
        return applied_expenses

    def apply_event(self, event: OneTimeEvent):
        """
        Apply a one-time event and remove it from future events.
        """
        self.apply_expense(event.amount)
        self.upcoming_events = [
            e for e in self.upcoming_events if e != event
        ]
