import RiskBadge from "@/components/RiskBadge";
import { formatCurrency } from "@/utils/format";
import { AgentCardProps } from "./types";

export default function PredictionCard({ data }: AgentCardProps) {
  const projected = Number(data.projected_balance || 0);
  const riskScore = typeof data.risk_score === "number" ? data.risk_score : null;

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Prediction Output</p>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl bg-black/20 p-3">
          <p className="text-xs text-(--muted)">Projected balance</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{formatCurrency(projected)}</p>
        </div>
        <div className="rounded-xl bg-black/20 p-3">
          <p className="text-xs text-(--muted)">Risk level</p>
          <div className="mt-1"><RiskBadge risk={data.risk_level} /></div>
        </div>
      </div>

      {riskScore !== null && (
        <div className="rounded-xl bg-black/20 p-3 text-xs">
          <p className="text-(--muted)">Risk score</p>
          <p className="mt-1 font-semibold text-(--ink-1)">{riskScore}</p>
        </div>
      )}

      {typeof data.summary === "string" && data.summary.trim().length > 0 && (
        <div className="rounded-xl bg-black/20 p-3 text-xs text-(--muted)">{data.summary}</div>
      )}

      {Array.isArray(data.signals) && data.signals.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-(--muted)">
          {data.signals.map((signal: string, idx: number) => (
            <li key={idx}>{signal}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
