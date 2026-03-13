# app/services/autonomy_loop.py

from copy import deepcopy
from uuid import uuid4

from app.orchestrator.graph import build_finpilot_graph
from app.state.system_state import SystemState
from app.db.database import SessionLocal
from app.db.run_repo import RunRepository
from app.db.ledger_repo import LedgerDBRepository


def run_autonomy_loop(
    initial_state: SystemState,
    max_steps: int = 30
):

    graph = build_finpilot_graph()

    run_id = initial_state.run_id or str(uuid4())
    initial_state.run_id = run_id

    db = SessionLocal()
    run_repo = RunRepository(db)
    ledger_repo = LedgerDBRepository(db)

    try:
        # --------------------------------------------------
        # CREATE RUN RECORD
        # --------------------------------------------------
        run_repo.create_run(
            run_id=run_id,
            user_id=initial_state.user_id
        )

        state_dict = deepcopy(initial_state.__dict__)
        state_dict["db"] = db

        history = []
        final_state = None
        steps = 0

        while steps < max_steps:

            updated_state_dict = graph.invoke(state_dict)

            updated_state_dict["run_id"] = run_id
            updated_state_dict["db"] = db

            clean_state_dict = dict(updated_state_dict)
            clean_state_dict.pop("db", None)

            final_state = SystemState(**clean_state_dict)

            # --------------------------------------------------
            # 1️⃣ LOG EVENT (if exists)
            # --------------------------------------------------
            if final_state.next_event:
                ledger_repo.save_entry(
                    user_id=initial_state.user_id,
                    run_id=run_id,
                    entry_type="event",
                    payload={
                        "day": final_state.twin.current_day,
                        "event_name": final_state.next_event.name,
                        "amount": final_state.next_event.amount,
                        "balance_after": final_state.twin.current_balance,
                    }
                )

            # --------------------------------------------------
            # 2️⃣ LOG INVESTMENT (if executed)
            # --------------------------------------------------
            if final_state.investment_executed:
                investment_data = final_state.agent_outputs.get("investment_execution", {})

                ledger_repo.save_entry(
                    user_id=initial_state.user_id,
                    run_id=run_id,
                    entry_type="investment",
                    payload={
                        "invested_amount": investment_data.get("total_invested"),
                        "allocation": investment_data.get("allocation_percentages"),
                    }
                )

            # --------------------------------------------------
            # 3️⃣ ALWAYS WRITE STATE SNAPSHOT
            # --------------------------------------------------
            ledger_repo.save_entry(
                user_id=initial_state.user_id,
                run_id=run_id,
                entry_type="state_snapshot",
                payload={
                    "balance": final_state.twin.current_balance,
                    "risk_level": final_state.risk_level,
                    "strategy": final_state.chosen_strategy,
                    "investment_executed": final_state.investment_executed,
                    "autonomy_enabled": final_state.autonomy_enabled,
                }
            )

            # --------------------------------------------------
            # STOP CONDITIONS
            # --------------------------------------------------
            if not final_state.autonomy_enabled:
                break

            if final_state.investment_executed:
                break

            if not final_state.next_event:
                break

            history.append({
                "run_id": run_id,
                "day": final_state.twin.current_day,
                "balance": final_state.twin.current_balance,
                "strategy": final_state.chosen_strategy,
                "risk_level": final_state.risk_level,
                "next_event": final_state.next_event.name
            })

            state_dict = deepcopy(final_state.__dict__)
            state_dict["db"] = db
            steps += 1

        # --------------------------------------------------
        # FINAL SNAPSHOT
        # --------------------------------------------------
        if final_state:
            ledger_repo.save_entry(
                user_id=initial_state.user_id,
                run_id=run_id,
                entry_type="final_snapshot",
                payload={
                    "final_balance": final_state.twin.current_balance,
                    "risk_level": final_state.risk_level,
                    "strategy": final_state.chosen_strategy,
                }
            )

            run_repo.update_run(
                run_id=run_id,
                final_balance=final_state.twin.current_balance,
                risk_level=final_state.risk_level,
                strategy=final_state.chosen_strategy
            )

        db.commit()

        return {
            "run_id": run_id,
            "final_state": final_state,
            "history": history,
            "steps_executed": steps
        }

    finally:
        db.close()
