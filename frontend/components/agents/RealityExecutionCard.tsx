import { formatCurrency } from "@/utils/format";
import { AgentCardProps } from "./types";

export default function RealityExecutionCard({ data }: AgentCardProps) {
  const ledger = Array.isArray(data.__ledger) ? data.__ledger : [];
  const cycleActivities = ledger.filter((entry: any) =>
    ["income", "recurring_expense", "event"].includes(entry.type)
  );

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Reality Execution Output</p>
      <div className="rounded-xl bg-black/20 p-3 text-xs">
        <p className="text-(--muted)">Event applied</p>
        <p className="mt-1 font-semibold text-(--ink-1)">{data.event_applied ? "True" : "False"}</p>
      </div>

      {data.event_name ? (
        <div className="rounded-xl bg-black/20 p-3 text-xs">
          <p className="text-(--muted)">Event: <span className="text-(--ink-1)">{data.event_name}</span></p>
          <p className="text-(--muted)">Day: <span className="text-(--ink-1)">{data.event_day ?? "-"}</span></p>
          <p className="text-(--muted)">Amount: <span className="text-(--ink-1)">{formatCurrency(Number(data.amount || 0))}</span></p>
          <p className="text-(--muted)">Balance before: <span className="text-(--ink-1)">{formatCurrency(Number(data.balance_before || 0))}</span></p>
          <p className="text-(--muted)">Balance after: <span className="text-(--ink-1)">{formatCurrency(Number(data.balance_after || 0))}</span></p>
        </div>
      ) : cycleActivities.length > 0 ? (
        <div className="rounded-xl bg-black/20 p-3 text-xs">
          <p className="mb-2 font-semibold text-(--ink-1)">Ledger context</p>
          <div className="space-y-1">
            {cycleActivities.slice(0, 6).map((entry: any, index: number) => (
              <p key={`${entry.type}-${index}`}>
                {entry.type.replaceAll("_", " ")}: {entry.event_name || entry.expense_name || entry.income_name || "entry"}
                {typeof entry.amount === "number" ? ` (${formatCurrency(entry.amount)})` : ""}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-black/20 p-3 text-xs text-(--muted)">
          No event execution details available.
        </div>
      )}

      {data.next_upcoming_event ? (
        <div className="rounded-xl bg-black/20 p-3 text-xs">
          <p className="mb-1 font-semibold text-(--ink-1)">Next upcoming event</p>
          <p className="text-(--muted)">
            Name: <span className="text-(--ink-1)">{data.next_upcoming_event.name}</span>
          </p>
          <p className="text-(--muted)">
            Day: <span className="text-(--ink-1)">{data.next_upcoming_event.day ?? "-"}</span>
          </p>
          <p className="text-(--muted)">
            Amount: <span className="text-(--ink-1)">{formatCurrency(Number(data.next_upcoming_event.amount || 0))}</span>
          </p>
          <p className="text-(--muted)">
            Remaining events: <span className="text-(--ink-1)">{data.upcoming_events_count ?? "-"}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
