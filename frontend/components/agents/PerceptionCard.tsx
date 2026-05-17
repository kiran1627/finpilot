import { formatCurrency } from "@/utils/format";
import { AgentCardProps } from "./types";

export default function PerceptionCard({ data }: AgentCardProps) {
  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Perception Output</p>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl bg-(--surface-3) p-3">
          <p className="text-xs text-(--muted)">Available balance</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{formatCurrency(data.current_balance || 0)}</p>
        </div>
        <div className="rounded-xl bg-(--surface-3) p-3">
          <p className="text-xs text-(--muted)">Current day</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{data.current_day ?? "-"}</p>
        </div>
      </div>

      {data.next_event ? (
        <div className="rounded-xl border border-(--surface-3) bg-(--surface-3)/40 p-3 text-xs">
          <p className="font-semibold text-(--ink-1)">Next event</p>
          <p className="mt-1 text-(--muted)">Name: {data.next_event.name ?? "-"}</p>
          <p className="text-(--muted)">Day: {data.next_event.day ?? "-"}</p>
          <p className="text-(--muted)">Amount: {formatCurrency(Number(data.next_event.amount || 0))}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-(--surface-3) bg-(--surface-3)/40 p-3 text-xs text-(--muted)">
          No upcoming event.
        </div>
      )}
    </div>
  );
}
