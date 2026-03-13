from typing import Dict, Any
from app.db.ledger_repo import LedgerDBRepository
from app.portfolio.allocator import PortfolioAllocator
from app.portfolio.compounding import PortfolioCompoundingEngine


class InvestmentExecutionAgent:
    """
    Executes investment allocations.

    Clean architecture:
    - Deducts real balance
    - Appends domain ledger entry
    - Persists via DB repository
    - Replay-safe
    - Dashboard-ready
    """

    def run(self, state):

        ledger_entries = list(state.ledger)
        updated_logs = list(state.logs)
        updated_outputs = dict(getattr(state, "agent_outputs", {}))

        execution_output = {
            "executed": False,
            "total_invested": 0.0,
            "allocation_percentages": {},
            "allocation_amounts": {},
            "allocation_source": None,
            "long_term_projection": None,
            "reason": None
        }

        # --------------------------------------------------
        # HARD GUARDS
        # --------------------------------------------------

        if not state.autonomy_enabled:
            execution_output["reason"] = "Autonomy disabled"
            updated_outputs["investment_execution"] = execution_output
            return {
                "ledger": ledger_entries,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        if state.investment_executed:
            execution_output["reason"] = "Already executed"
            updated_outputs["investment_execution"] = execution_output
            return {
                "ledger": ledger_entries,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        if state.investable_amount <= 0:
            execution_output["reason"] = "No investable amount"
            updated_outputs["investment_execution"] = execution_output
            return {
                "ledger": ledger_entries,
                "agent_outputs": updated_outputs,
                "logs": updated_logs
            }

        # --------------------------------------------------
        # DETERMINE ALLOCATION
        # --------------------------------------------------

        total = state.investable_amount

        allocator = PortfolioAllocator()
        allocation_result = allocator.allocate(
            risk_level=state.risk_level,
            strategy=state.chosen_strategy
        )

        allocation_percentages = allocation_result["allocation_percentages"]

        allocation_amounts = {
            asset: round((pct / 100) * total, 2)
            for asset, pct in allocation_percentages.items()
        }

        # --------------------------------------------------
        # 🔥 REAL CASH DEDUCTION
        # --------------------------------------------------

        balance_before = state.twin.current_balance
        state.twin.current_balance -= total
        balance_after = state.twin.current_balance

        # --------------------------------------------------
        # LONG TERM PROJECTION
        # --------------------------------------------------

        compounding_engine = PortfolioCompoundingEngine()

        projection = compounding_engine.simulate(
            initial_investment=total,
            allocation_percentages=allocation_percentages,
            years=10,
            volatility_adjusted=True
        )

        # --------------------------------------------------
        # 🔥 INSTRUMENT-LEVEL MAPPING (Phase 4 Ready)
        # --------------------------------------------------

        instruments = {
            "mutual_funds": {
                "name": "Nifty 50 Index Fund",
                "amount": allocation_amounts.get("mutual_funds", 0)
            },
            "bonds": {
                "name": "Government Bond ETF",
                "amount": allocation_amounts.get("bonds", 0)
            },
            "gold": {
                "name": "Gold ETF",
                "amount": allocation_amounts.get("gold", 0)
            },
            "cash": {
                "name": "Liquid Fund / Savings",
                "amount": allocation_amounts.get("cash", 0)
            }
        }

        # --------------------------------------------------
        # 🔥 CREATE DOMAIN LEDGER ENTRY
        # --------------------------------------------------

        entry: Dict[str, Any] = {
            "type": "investment_execution",
            "total_amount": total,
            "allocation": allocation_amounts,
            "instruments": instruments,
            "balance_before": balance_before,
            "balance_after": balance_after
        }

        # ✅ Append to in-memory ledger
        ledger_entries.append(entry)

        # --------------------------------------------------
        # 🔥 Persist to DB if available
        # --------------------------------------------------

        if hasattr(self, "db") and self.db:
            ledger_repo = LedgerDBRepository(self.db)

            ledger_repo.save_entry(
                user_id=state.user_id,
                run_id=state.run_id,
                entry_type="investment_execution",
                payload=entry
            )

        updated_logs.append(
            f"InvestmentExecution: ₹{total} invested. "
            f"Balance {balance_before} → {balance_after}"
        )

        # --------------------------------------------------
        # STRUCTURED OUTPUT
        # --------------------------------------------------

        execution_output.update({
            "executed": True,
            "total_invested": total,
            "allocation_percentages": allocation_percentages,
            "allocation_amounts": allocation_amounts,
            "allocation_source": "QuantEngine",
            "long_term_projection": projection,
            "reason": "Investment executed successfully"
        })

        updated_outputs["investment_execution"] = execution_output

        return {
            "ledger": ledger_entries,
            "investment_executed": True,
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
