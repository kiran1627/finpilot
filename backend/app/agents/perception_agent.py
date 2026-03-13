class PerceptionAgent:
    """
    Observes the current financial state from the Financial Digital Twin.
    Pure observation.
    """

    def run(self, state):

        twin = state.twin
        updated_logs = list(state.logs)
        updated_outputs = dict(state.agent_outputs)

        # Identify next upcoming event (DOMAIN OBJECT)
        next_event = twin.get_next_event()

        updated_logs.append(
            f"PerceptionAgent: Day={twin.current_day}, "
            f"Balance={twin.current_balance}"
        )

        if next_event:
            updated_logs.append(
                f"PerceptionAgent: Next event '{next_event.name}' "
                f"on day {next_event.day} amount={next_event.amount}"
            )
        else:
            updated_logs.append("PerceptionAgent: No upcoming events")

        # 🔥 Structured UI Output
        perception_output = {
            "current_day": twin.current_day,
            "current_balance": twin.current_balance,
            "next_event": (
                {
                    "name": next_event.name,
                    "day": next_event.day,
                    "amount": next_event.amount
                }
                if next_event else None
            )
        }

        updated_outputs["perception"] = perception_output

        return {
            "next_event": next_event,  # DOMAIN OBJECT preserved
            "agent_outputs": updated_outputs,
            "logs": updated_logs
        }
