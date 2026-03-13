from typing import Dict, Any
from app.db.ledger_repo import LedgerDBRepository


class RealityExecutionAgent:
    """
    Executes real-world financial effects:

    - Recurring incomes
    - Recurring expenses
    - One-time events
    - Balance mutations

    DB-backed.
    Replay-safe.
    """

    CYCLE_DAYS = 30

    def _apply_recurring_for_day(
        self,
        *,
        state,
        twin,
        day: int,
        ledger_entries,
        updated_logs,
        ledger_repo,
    ):
        """
        Advance to a specific day and apply recurring monthly cashflows due on that day.
        """

        twin.advance_to_day(day)

        if day % self.CYCLE_DAYS != 0:
            return

        for income in twin.income_streams:
            if income.frequency != "monthly":
                continue

            balance_before = twin.current_balance
            twin.apply_income(income.amount)
            balance_after = twin.current_balance

            entry: Dict[str, Any] = {
                "type": "income",
                "day": twin.current_day,
                "income_name": income.name,
                "amount": income.amount,
                "balance_before": balance_before,
                "balance_after": balance_after,
            }

            ledger_entries.append(entry)

            if ledger_repo:
                ledger_repo.save_entry(
                    user_id=state.user_id,
                    run_id=state.run_id,
                    entry_type="income",
                    payload=entry,
                )

            updated_logs.append(
                f"Income Applied: {income.name} "
                f"{balance_before} → {balance_after}"
            )

        for expense in twin.recurring_expenses:
            if expense.frequency != "monthly":
                continue

            balance_before = twin.current_balance
            twin.apply_expense(expense.amount)
            balance_after = twin.current_balance

            entry: Dict[str, Any] = {
                "type": "recurring_expense",
                "day": twin.current_day,
                "expense_name": expense.name,
                "amount": expense.amount,
                "balance_before": balance_before,
                "balance_after": balance_after,
            }

            ledger_entries.append(entry)

            if ledger_repo:
                ledger_repo.save_entry(
                    user_id=state.user_id,
                    run_id=state.run_id,
                    entry_type="recurring_expense",
                    payload=entry,
                )

            updated_logs.append(
                f"Recurring Expense: {expense.name} "
                f"{balance_before} → {balance_after}"
            )

    def run(self, state):

        ledger_entries = list(state.ledger)
        updated_logs = list(state.logs)
        updated_outputs = dict(state.agent_outputs)

        twin = state.twin

        execution_output = {
            "event_applied": False,
            "event_name": None,
            "event_day": None,
            "amount": None,
            "balance_before": None,
            "balance_after": None,
            "next_upcoming_event": None,
            "upcoming_events_count": 0,
        }

        # --------------------------------------------------
        # 🔥 Use injected DB (from orchestrator)
        # --------------------------------------------------

        ledger_repo = None
        if hasattr(self, "db") and self.db:
            ledger_repo = LedgerDBRepository(self.db)

        # ==================================================
        # STEP 1 — EVENT-DAY PROGRESSION WITHIN CYCLE WINDOW
        # ==================================================

        start_day = twin.current_day
        cycle_end_day = start_day + self.CYCLE_DAYS

        next_event = state.next_event
        if next_event and start_day < next_event.day <= cycle_end_day:
            target_day = next_event.day
        else:
            target_day = cycle_end_day

        for day in range(start_day + 1, target_day + 1):
            self._apply_recurring_for_day(
                state=state,
                twin=twin,
                day=day,
                ledger_entries=ledger_entries,
                updated_logs=updated_logs,
                ledger_repo=ledger_repo,
            )

        # ==================================================
        # STEP 2 — APPLY ONE-TIME EVENT (if exists)
        # ==================================================

        if next_event and next_event.day <= twin.current_day:

            event = next_event

            balance_before = twin.current_balance
            twin.apply_expense(event.amount)
            balance_after = twin.current_balance

            entry: Dict[str, Any] = {
                "type": "event",
                "event_name": event.name,
                "day": twin.current_day,
                "amount": event.amount,
                "balance_before": balance_before,
                "balance_after": balance_after
            }

            ledger_entries.append(entry)

            if ledger_repo:
                ledger_repo.save_entry(
                    user_id=state.user_id,
                    run_id=state.run_id,
                    entry_type="event",
                    payload=entry
                )

            execution_output.update({
                "event_applied": True,
                "event_name": event.name,
                "event_day": twin.current_day,
                "amount": event.amount,
                "balance_before": balance_before,
                "balance_after": balance_after
            })

            updated_logs.append(
                f"Event Applied: {event.name} "
                f"{balance_before} → {balance_after}"
            )

            twin.upcoming_events = [
                e for e in twin.upcoming_events
                if e.name != event.name
            ]

        # ==================================================
        # STEP 3 — SURFACE UPCOMING EVENT OUTLOOK
        # ==================================================

        following_event = twin.get_next_event()
        execution_output["upcoming_events_count"] = len(twin.upcoming_events)

        if following_event:
            execution_output["next_upcoming_event"] = {
                "name": following_event.name,
                "day": following_event.day,
                "amount": following_event.amount,
            }

            updated_logs.append(
                f"Upcoming Event Queued: {following_event.name} on day {following_event.day}"
            )

            outlook_entry: Dict[str, Any] = {
                "type": "event_outlook",
                "day": twin.current_day,
                "next_event_name": following_event.name,
                "next_event_day": following_event.day,
                "next_event_amount": following_event.amount,
                "remaining_events": len(twin.upcoming_events),
            }

            ledger_entries.append(outlook_entry)

            if ledger_repo:
                ledger_repo.save_entry(
                    user_id=state.user_id,
                    run_id=state.run_id,
                    entry_type="event_outlook",
                    payload=outlook_entry,
                )

        # ==================================================
        # FINAL OUTPUT
        # ==================================================

        updated_outputs["reality_execution"] = execution_output

        return {
            "twin": twin,
            "ledger": ledger_entries,   # ✅ in-memory ledger for API
            "agent_outputs": updated_outputs,
            "logs": updated_logs,
        }
