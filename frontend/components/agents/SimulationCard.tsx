import { formatCurrency } from "@/utils/format";
import { AgentCardProps, pct } from "./types";

type Row = {
  name: string;
  ending_balance: number;
  volatility: number;
  max_drawdown: number;
};

export default function SimulationCard({ data }: AgentCardProps) {
  const results = (data.results || {}) as Record<string, Row>;
  const rows = Object.entries(results).map(([name, value]) => ({ ...value, name }));

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Simulation Output</p>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl bg-black/20 p-3 text-xs">
          <p className="text-(--muted)">Horizon (days)</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{data.horizon_days ?? "-"}</p>
        </div>
        <div className="rounded-xl bg-black/20 p-3 text-xs">
          <p className="text-(--muted)">Strategies evaluated</p>
          <p className="mt-1 font-semibold text-(--ink-1)">
            {Array.isArray(data.strategies_evaluated) ? data.strategies_evaluated.join(", ") : rows.map((row) => row.name).join(", ") || "-"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-130 text-left text-xs">
          <thead className="bg-white/5 text-(--muted)">
            <tr>
              <th className="px-3 py-2">Strategy</th>
              <th className="px-3 py-2">Final Balance</th>
              <th className="px-3 py-2">Volatility</th>
              <th className="px-3 py-2">Drawdown</th>
              <th className="px-3 py-2">Violations</th>
              <th className="px-3 py-2">Sharpe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-white/10">
                <td className="px-3 py-2 font-semibold capitalize text-(--ink-1)">{row.name}</td>
                <td className="px-3 py-2">{formatCurrency(row.ending_balance || 0)}</td>
                <td className="px-3 py-2">{pct(row.volatility)}</td>
                <td className="px-3 py-2">{pct(row.max_drawdown)}</td>
                <td className="px-3 py-2">{(row as any).violations ?? "-"}</td>
                <td className="px-3 py-2">{(row as any).sharpe_score ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
