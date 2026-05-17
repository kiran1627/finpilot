import { formatCurrency } from "@/utils/format";
import { AgentCardProps } from "./types";

export default function InvestmentAllocationCard({ data }: AgentCardProps) {
  const userCap = Number(data.user_cap_pct || 0);
  const investable = Number(data.investable_amount || 0);
  const surplus = Number(data.surplus || 0);

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Allocation Output</p>
      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-xl bg-(--surface-3) p-3">
          <p className="text-xs text-(--muted)">Safety buffer</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{formatCurrency(Number(data.safety_buffer || 0))}</p>
        </div>
        <div className="rounded-xl bg-(--surface-3) p-3">
          <p className="text-xs text-(--muted)">Surplus</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{formatCurrency(surplus)}</p>
        </div>
        <div className="rounded-xl bg-(--surface-3) p-3">
          <p className="text-xs text-(--muted)">Investable</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{formatCurrency(investable)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-(--surface-3) p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-(--muted)">User cap applied</span>
          <span className="text-(--ink-1)">{userCap}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-(--surface-2)">
          <div className="h-full rounded-full bg-(--brand-3)" style={{ width: `${Math.max(0, Math.min(userCap, 100))}%` }} />
        </div>
      </div>

      <div className="rounded-xl bg-(--surface-3) p-3 text-xs">
        <p className="text-(--muted)">Risk gate passed</p>
        <p className={data.risk_gate_passed ? "mt-1 font-semibold text-emerald-600 dark:text-emerald-400" : "mt-1 font-semibold text-rose-600 dark:text-rose-400"}>
          {data.risk_gate_passed ? "True" : "False"}
        </p>
      </div>

      {data.reason && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{data.reason}</p>}
    </div>
  );
}
