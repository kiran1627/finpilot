import RiskBadge from "@/components/RiskBadge";
import { formatCurrency } from "@/utils/format";
import { AgentCardProps } from "./types";

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNarrativeMeta(agentKey: string | undefined, data: Record<string, any>) {
  if (agentKey === "investment_advisor") {
    const risk = data.risk_level || "current";
    const source = data.source ? `Source: ${data.source}.` : "";
    return {
      badge: "Allocation Advisory",
      summary:
        data.summary ||
        `${source} Suggested allocation percentages are calibrated to ${risk.toString().toLowerCase()} risk bounds and investable surplus.`,
    };
  }

  if (agentKey === "investment_explanation") {
    const investedAmount = typeof data.invested_amount === "number" ? formatCurrency(data.invested_amount) : null;
    const risk = data.risk_level ? ` under a ${data.risk_level.toString().toLowerCase()} risk profile` : "";
    return {
      badge: "Execution Rationale",
      summary:
        data.summary ||
        (investedAmount
          ? `Executed ${investedAmount}${risk}. Allocation details include asset split, rationale, and projection metrics.`
          : `No allocation was executed in this cycle${risk}; rationale reflects current constraint and execution state.`),
    };
  }

  const strategy = data.chosen_strategy ? `'${data.chosen_strategy}'` : "the selected";
  const confidence = data.confidence ? ` Confidence: ${data.confidence}.` : "";
  return {
    badge: "Decision Narrative",
    summary:
      data.summary ||
      `System selected ${strategy} strategy after risk scoring and guardrail validation.${confidence}`,
  };
}

export default function ExplanationCard({ data, agentKey }: AgentCardProps) {
  const isAdvisor = agentKey === "investment_advisor";
  const lines = Array.isArray(data.reasoning)
    ? data.reasoning
    : typeof data.text === "string"
    ? data.text.split("\n").filter(Boolean)
    : [];
  const narrative = getNarrativeMeta(agentKey, data);
  const suggestedPercentages =
    data && typeof data.suggested_percentages === "object" && data.suggested_percentages !== null
      ? data.suggested_percentages
      : {};
  const categories =
    data && typeof data.categories === "object" && data.categories !== null ? data.categories : {};
  const exampleFunds =
    data && typeof data.example_funds === "object" && data.example_funds !== null ? data.example_funds : {};
  const advisorAssets = Object.keys(suggestedPercentages);

  if (isAdvisor) {
    return (
      <div className="space-y-3 text-sm text-(--ink-2)">
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">{narrative.badge}</p>
          {typeof data.source === "string" && (
            <p className="mt-1 text-xs text-(--muted)">Source: {data.source}</p>
          )}
          {typeof narrative.summary === "string" && narrative.summary.trim().length > 0 && (
            <p className="mt-1 text-(--ink-1)">{narrative.summary}</p>
          )}
        </div>

        {data.risk_level && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-(--muted)">Risk profile:</span>
            <RiskBadge risk={data.risk_level} />
          </div>
        )}

        {advisorAssets.length > 0 ? (
          <div className="space-y-2">
            {advisorAssets.map((asset) => {
              const pct = suggestedPercentages[asset];
              const category = categories[asset];
              const funds = Array.isArray(exampleFunds[asset]) ? exampleFunds[asset] : [];

              return (
                <div key={asset} className="rounded-xl bg-black/20 p-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-(--ink-1)">{labelize(asset)}</p>
                    <p className="text-cyan-300">{typeof pct === "number" ? `${pct}%` : "-"}</p>
                  </div>
                  <p className="mt-1 text-(--muted)">Category: {typeof category === "string" ? category : "-"}</p>
                  <p className="mt-1 text-(--muted)">
                    Example funds: {funds.length > 0 ? funds.join(", ") : "-"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-(--muted)">No advisor allocation returned by backend.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">{narrative.badge}</p>
        {typeof narrative.summary === "string" && narrative.summary.trim().length > 0 ? (
          <p className="mt-1 text-(--ink-1)">{narrative.summary}</p>
        ) : (
          <p className="mt-1 text-xs text-(--muted)">No summary returned by backend.</p>
        )}
      </div>

      {typeof data.invested_amount === "number" && (
        <p className="text-xs text-(--muted)">Invested amount: {formatCurrency(data.invested_amount)}</p>
      )}

      {data.risk_level && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-(--muted)">Risk profile:</span>
          <RiskBadge risk={data.risk_level} />
        </div>
      )}

      {lines.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-(--muted)">
          {lines.slice(0, 5).map((line: string, index: number) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}

      {data.confidence && <p className="text-xs text-emerald-300">Confidence: {data.confidence}</p>}
    </div>
  );
}
