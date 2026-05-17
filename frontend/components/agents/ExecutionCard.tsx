import { formatCurrency } from "@/utils/format";
import { AgentCardProps } from "./types";

export default function ExecutionCard({ data }: AgentCardProps) {
  const allocations = (data.allocation_amounts || data.allocation || {}) as Record<string, number>;
  const percentages = (data.allocation_percentages || {}) as Record<string, number>;
  const total =
    Number(data.total_invested || data.total_amount || 0) ||
    Object.values(allocations).reduce((sum, item) => sum + Number(item || 0), 0);
  const projection = data.long_term_projection;

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Investment Execution Output</p>
      <div className="rounded-xl bg-(--surface-3) p-3 text-xs">
        <p className="text-(--muted)">Executed</p>
        <p className={data.executed ? "mt-1 font-semibold text-emerald-600 dark:text-emerald-400" : "mt-1 font-semibold text-rose-600 dark:text-rose-400"}>
          {data.executed ? "True" : "False"}
        </p>
      </div>

      <div className="rounded-xl bg-(--surface-3) p-3">
        <p className="text-xs text-(--muted)">Total funds executed</p>
        <p className="mt-1 text-lg font-semibold text-(--ink-1)">{formatCurrency(total)}</p>
      </div>

      {(typeof data.allocation_source === "string" || typeof data.reason === "string") && (
        <div className="rounded-xl bg-(--surface-3) p-3 text-xs">
          {typeof data.allocation_source === "string" && (
            <p className="text-(--muted)">Allocation source: <span className="text-(--ink-1)">{data.allocation_source}</span></p>
          )}
          {typeof data.reason === "string" && (
            <p className="mt-1 text-(--muted)">Reason: <span className="text-(--ink-1)">{data.reason}</span></p>
          )}
        </div>
      )}

      <div className="space-y-2 rounded-xl bg-(--surface-3) p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Allocation Breakdown</p>
        {Object.entries(allocations).map(([asset, amount]) => {
          const numeric = Number(amount || 0);
          const width = total > 0 ? (numeric / total) * 100 : 0;
          const percentage = percentages[asset];
          return (
            <div key={asset} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-(--ink-1)">{asset.replaceAll("_", " ")}</span>
                <span>{formatCurrency(numeric)} {typeof percentage === "number" ? `(${percentage}%)` : ""}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-(--surface-2)">
                <div className="h-full rounded-full bg-(--brand-3) transition-all duration-700" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {projection && (
        <div className="rounded-xl bg-(--surface-3) p-3 text-xs">
          <p className="font-semibold text-(--ink-1)">Long-term projection</p>
          <p className="mt-1 text-(--muted)">Final value: {formatCurrency(Number(projection.final_value || 0))}</p>
          <p className="text-(--muted)">Annualized return: {typeof projection.annualized_return === "number" ? `${(projection.annualized_return * 100).toFixed(2)}%` : "-"}</p>
        </div>
      )}
    </div>
  );
}
