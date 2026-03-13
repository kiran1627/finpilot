"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import RiskBadge from "@/components/RiskBadge";
import { formatCurrency } from "@/utils/format";
import PerceptionCard from "@/components/agents/PerceptionCard";
import PredictionCard from "@/components/agents/PredictionCard";
import SimulationCard from "@/components/agents/SimulationCard";
import DecisionCard from "@/components/agents/DecisionCard";
import GuardrailCard from "@/components/agents/GuardrailCard";
import ExecutionCard from "@/components/agents/ExecutionCard";
import ExplanationCard from "@/components/agents/ExplanationCard";
import RealityExecutionCard from "@/components/agents/RealityExecutionCard";
import InvestmentAllocationCard from "@/components/agents/InvestmentAllocationCard";

type Props = {
  agentOutputs: Record<string, any>;
  ledger?: Array<Record<string, any>>;
  runId: string;
  finalBalance: number;
  riskLevel: string;
  strategy: string;
  compact?: boolean;
};

type AgentDef = {
  key: string;
  label: string;
  runningLabel: string;
};

const AGENTS: AgentDef[] = [
  { key: "perception", label: "Perception Agent", runningLabel: "Observing environment..." },
  { key: "prediction", label: "Prediction Agent", runningLabel: "Forecasting balance and risk..." },
  { key: "simulation", label: "Simulation Agent", runningLabel: "Evaluating strategy scenarios..." },
  { key: "decision", label: "Decision Agent", runningLabel: "Scoring and selecting strategy..." },
  { key: "guardrail", label: "Guardrail Agent", runningLabel: "Validating constraints..." },
  { key: "reality_execution", label: "Reality Execution", runningLabel: "Applying real-world events..." },
  { key: "investment_allocation", label: "Allocation Agent", runningLabel: "Sizing investable surplus..." },
  { key: "investment_advisor", label: "Advisor Agent", runningLabel: "Advising optimal distribution..." },
  { key: "investment_execution", label: "Execution Agent", runningLabel: "Executing allocation..." },
  { key: "investment_explanation", label: "Explanation Agent", runningLabel: "Generating investment narrative..." },
  { key: "explanation", label: "Final Summary Agent", runningLabel: "Compiling rationale and confidence..." },
];

function renderContent(agentKey: string, output: any) {
  switch (agentKey) {
    case "perception":
      return <PerceptionCard data={output} />;
    case "prediction":
      return <PredictionCard data={output} />;
    case "simulation":
      return <SimulationCard data={output} />;
    case "decision":
      return <DecisionCard data={output} />;
    case "guardrail":
      return <GuardrailCard data={output} />;
    case "reality_execution":
      return <RealityExecutionCard data={output} />;
    case "investment_allocation":
      return <InvestmentAllocationCard data={output} />;
    case "investment_advisor":
      return <ExplanationCard data={output} agentKey={agentKey} />;
    case "investment_execution":
      return <ExecutionCard data={output} />;
    case "investment_explanation":
      return <ExplanationCard data={output} agentKey={agentKey} />;
    case "explanation":
      return <ExplanationCard data={output} agentKey={agentKey} />;
    default:
      return (
        <pre className="whitespace-pre-wrap wrap-break-word rounded-2xl bg-black/30 p-3 text-xs text-(--ink-2)">
          {JSON.stringify(output, null, 2)}
        </pre>
      );
  }
}

export default function AgentExecutionDisplay({
  agentOutputs,
  ledger = [],
  runId,
  finalBalance,
  riskLevel,
  strategy,
  compact = false,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeAgents = useMemo(
    () => AGENTS.filter((agent) => agentOutputs?.[agent.key] !== undefined),
    [agentOutputs]
  );

  useEffect(() => {
    if (compact) {
      setCurrentStep(activeAgents.length);
      setIsPlaying(false);
      return;
    }

    if (!isPlaying || currentStep >= activeAgents.length) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, activeAgents.length));
    }, 1300);

    return () => clearTimeout(timer);
  }, [compact, currentStep, isPlaying, activeAgents.length]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-(--ink-1) sm:text-xl">Autonomous Intelligence Replay</h2>
            <p className="text-sm text-(--muted)">Run ID: {runId}</p>
          </div>
          {!compact && (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className="rounded-xl bg-(--brand-1) px-4 py-2 text-sm text-white"
              >
                {isPlaying ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => setCurrentStep(activeAgents.length)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-(--ink-1)"
              >
                Show all
              </button>
            </div>
          )}
        </div>

        {activeAgents.length === 0 ? (
          <p className="mt-4 text-sm text-(--muted)">No agent outputs available for this run.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {activeAgents.map((agent, index) => {
              const isComplete = index < currentStep;
              const isActive = index === currentStep - 1;
              const output =
                agent.key === "reality_execution"
                  ? { ...agentOutputs[agent.key], __ledger: ledger }
                  : agentOutputs[agent.key];

              return (
                <div
                  key={agent.key}
                  className={`rounded-2xl border p-3.5 transition-all duration-300 ${
                    isActive
                      ? "border-(--brand-1) bg-(--surface-2) shadow-[0_0_0_1px_var(--brand-1)]"
                      : isComplete
                      ? "border-white/10 bg-(--surface-2)"
                      : "border-white/5 opacity-45"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="font-semibold text-(--ink-1)">{agent.label}</h3>
                      {isActive && <p className="text-xs text-cyan-300">{agent.runningLabel}</p>}
                      {isComplete && !isActive && <p className="text-xs text-emerald-300">Completed</p>}
                    </div>
                  </div>

                  {isComplete && <div className="mt-3 rounded-xl bg-black/20 p-3">{renderContent(agent.key, output)}</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {currentStep >= activeAgents.length && activeAgents.length > 0 && !compact && (
        <Card>
          <h2 className="text-lg font-semibold text-(--ink-1)">Decision Outcome</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Final Balance</p>
              <p className="mt-1 text-2xl font-semibold text-(--ink-1)">{formatCurrency(finalBalance)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Risk</p>
              <div className="mt-1">
                <RiskBadge risk={riskLevel} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Chosen Strategy</p>
              <p className="mt-1 text-xl font-semibold capitalize text-(--ink-1)">{strategy}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
