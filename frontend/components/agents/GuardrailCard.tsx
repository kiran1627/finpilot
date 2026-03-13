import { AgentCardProps } from "./types";

export default function GuardrailCard({ data }: AgentCardProps) {
  const checks = data.checks || {};

  return (
    <div className="space-y-3 text-sm text-(--ink-2)">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Guardrail Output</p>
      <p className="font-semibold text-(--ink-1)">
        {data.execution_allowed ? "All safety checks passed" : "Guardrail blocked execution"}
      </p>

      <div className="rounded-xl bg-black/20 p-3 text-xs">
        <p className="text-(--muted)">Execution allowed</p>
        <p className={data.execution_allowed ? "mt-1 font-semibold text-emerald-300" : "mt-1 font-semibold text-rose-300"}>
          {data.execution_allowed ? "True" : "False"}
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {Object.entries(checks).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
            <p className="capitalize text-(--muted)">{key.replaceAll("_", " ")}</p>
            <p className={value ? "mt-1 text-emerald-300" : "mt-1 text-rose-300"}>
              {value ? "True" : "False"}
            </p>
          </div>
        ))}
      </div>
      {data.reason && <p className="text-xs text-(--muted)">{data.reason}</p>}
    </div>
  );
}
