import { formatCurrency } from "@/utils/format";
import { AgentCardProps, pct } from "./types";

export default function DecisionCard({ data }: AgentCardProps) {
  const selected = data.selected_strategy;
  const selectedStats = data.strategy_comparison?.[selected];
  const comparisons =
    data && typeof data.strategy_comparison === "object" && data.strategy_comparison !== null
      ? Object.entries(data.strategy_comparison)
      : [];

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Decision Output</p>
      <div className="rounded-xl border border-(--brand-3)/30 bg-(--brand-3)/10 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-(--brand-3)">Selected Strategy</p>
        <p className="mt-1 text-lg font-semibold capitalize text-(--ink-1)">{selected || "-"}</p>
      </div>

      {typeof data.evaluation_model === "string" && data.evaluation_model.trim().length > 0 && (
        <div className="rounded-xl bg-(--surface-3) p-3 text-xs">
          <p className="text-(--muted)">Evaluation model</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{data.evaluation_model}</p>
        </div>
      )}

      {selectedStats && (
        <div className="rounded-xl bg-(--surface-3) p-3 text-xs">
          <p>Final score: {selectedStats.final_score ?? data.final_score ?? "-"}</p>
          <p>Ending balance: {formatCurrency(selectedStats.ending_balance || 0)}</p>
          <p>Drawdown: {pct(selectedStats.max_drawdown)}</p>
          <p>Constraint satisfaction: {selectedStats.violations === 0 ? "100%" : "Below 100%"}</p>
        </div>
      )}

      {comparisons.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-(--surface-3)">
          <table className="w-full min-w-130 text-left text-xs">
            <thead className="bg-(--surface-2) text-(--muted)">
              <tr>
                <th className="px-3 py-2">Strategy</th>
                <th className="px-3 py-2">Final score</th>
                <th className="px-3 py-2">Ending balance</th>
                <th className="px-3 py-2">Sharpe (clamped)</th>
                <th className="px-3 py-2">Violations</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map(([strategy, metrics]: [string, any]) => (
                <tr key={strategy} className="border-t border-(--surface-3)">
                  <td className="px-3 py-2 font-semibold capitalize text-(--ink-1)">{strategy}</td>
                  <td className="px-3 py-2">{metrics?.final_score ?? "-"}</td>
                  <td className="px-3 py-2">{formatCurrency(Number(metrics?.ending_balance || 0))}</td>
                  <td className="px-3 py-2">{metrics?.sharpe_score_clamped ?? "-"}</td>
                  <td className="px-3 py-2">{metrics?.violations ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
