"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RiskBadge from "@/components/RiskBadge";
import { runsAPI } from "@/services/runs";
import { formatCurrency } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import type { ReplayData } from "@/types/api";

function toLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(key: string, value: unknown) {
  if (typeof value === "number") {
    if (
      key.includes("balance") ||
      key.includes("amount") ||
      key.includes("invest") ||
      key.includes("allocation")
    ) {
      return formatCurrency(value);
    }
    return String(value);
  }
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function ReplayPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  const replayQuery = useQuery({
    queryKey: ["replay", user?.id, runId],
    queryFn: () => runsAPI.getReplay(runId),
    enabled: !!runId && !!user?.id,
  });

  const replay = useMemo<ReplayData | null>(() => {
    const payload = replayQuery.data?.data ?? replayQuery.data;
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      return null;
    }
    if ("error" in payload) {
      return null;
    }
    return payload as ReplayData;
  }, [replayQuery.data]);

  const steps = useMemo(() => replay?.steps ?? [], [replay]);
  const safeStepIndex = steps.length ? Math.min(stepIndex, steps.length - 1) : 0;
  const currentStep = steps[safeStepIndex];

  const visibleStepEntries = useMemo(() => {
    if (!currentStep) return [];
    return Object.entries(currentStep).filter(([key]) => key !== "type");
  }, [currentStep]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                  Replay
                </p>
                <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                  Run {runId}
                </h1>
              </div>
              <Button variant="secondary" onClick={() => router.push("/runs")}
                >Back to runs</Button>
            </div>

            {replayQuery.isLoading ? (
              <Card>Loading replay...</Card>
            ) : replayQuery.isError ? (
              <Card>
                <div className="space-y-3">
                  <p className="text-sm text-(--muted)">
                    Could not load replay. Please try again.
                  </p>
                  <Button variant="secondary" onClick={() => replayQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              </Card>
            ) : replay ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                      Initial balance
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(replay.initial_balance || 0)}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                      Final balance
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(replay.final_balance || 0)}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                      Strategy
                    </p>
                    <p className="mt-2 text-xl font-semibold capitalize">
                      {replay.strategy || "Unknown"}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                      Risk
                    </p>
                    <div className="mt-2">
                      <RiskBadge risk={replay.risk_level || undefined} />
                    </div>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <Card>
                    <h2 className="text-lg font-semibold text-(--ink-1)">
                      Timeline
                    </h2>
                    <div className="mt-4 space-y-3">
                      {steps.map((step, index) => (
                        <button
                          key={index}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm  ${
                            index === safeStepIndex
                                ? "border-(--brand-1) bg-(--surface-2)"
                              : "border-black/10 bg-white"
                          }`}
                          onClick={() => setStepIndex(index)}
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                            Step {index + 1}
                          </p>
                          <p className="mt-1 font-semibold text-(--ink-2)">
                            {toLabel(step.type || "unknown")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-(--ink-1)">
                        Step details
                      </h2>
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={stepIndex === 0}
                          onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
                        >
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          disabled={safeStepIndex === steps.length - 1}
                          onClick={() =>
                            setStepIndex((prev) =>
                              Math.min(prev + 1, steps.length - 1)
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    {currentStep ? (
                      <div className="mt-4 space-y-3 text-sm text-(--muted)">
                        <p>Type: {toLabel(currentStep.type || "unknown")}</p>
                        {visibleStepEntries.map(([key, value]) => (
                          <div key={key}>
                            {typeof value === "object" && value !== null ? (
                              <>
                                <p>{toLabel(key)}:</p>
                                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-(--surface-2) p-4 text-xs text-(--ink-2)">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              </>
                            ) : (
                              <p>
                                {toLabel(key)}: {formatValue(key, value)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-(--muted)">
                        Select a step to inspect.
                      </p>
                    )}
                  </Card>
                </div>
              </>
            ) : (
              <Card>Replay not found.</Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
