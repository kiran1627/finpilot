from app.core.financial_twin import FinancialDigitalTwin, OneTimeEvent


class TimeEngine:
    """
    Controls time progression for the Financial Digital Twin.
    Ensures time only moves forward.
    """

    @staticmethod
    def advance_to_event(
        twin: FinancialDigitalTwin,
        event: OneTimeEvent
    ):
        """
        Advances the twin's time to the event's day.
        """
        if event.day < twin.current_day:
            raise ValueError(
                f"Cannot move time backwards: "
                f"{event.day} < {twin.current_day}"
            )

        twin.current_day = event.day

    @staticmethod
    def advance_by_days(
        twin: FinancialDigitalTwin,
        days: int
    ):
        """
        Advances time by a fixed number of days.
        Useful for daily simulation modes.
        """
        if days < 0:
            raise ValueError("Days must be non-negative")

        twin.current_day += days
