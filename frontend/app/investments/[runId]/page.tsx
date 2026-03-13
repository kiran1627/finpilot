"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RiskBadge from "@/components/RiskBadge";
import AllocationAnalyticsEChart from "@/components/charts/AllocationAnalyticsEChart";
import { runsAPI } from "@/services/runs";
import { formatCurrency, formatPercent } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import type { ReplayData, ReplayStep } from "@/types/api";

type AllocationDetail = {
  assetKey: string;
  category: string;
  instrumentName: string;
  amount: number;
  weightPct: number;
  growthRatePct: number;
  projectedValue: number;
};

function getRuleBasedInstrument(assetKey: string) {
  const key = assetKey.toLowerCase();

  if (key.includes("gold")) {
    return {
      category: "Gold",
      instrumentName: "Sovereign Gold Bonds",
      growthRatePct: 8.5,
    };
  }

  if (key.includes("debt") || key.includes("bond") || key.includes("fixed")) {
    return {
      category: "Bond",
      instrumentName: "Government Bonds",
      growthRatePct: 7.1,
    };
  }

  if (key.includes("cash") || key.includes("liquid") || key.includes("reserve")) {
    return {
      category: "Cash",
      instrumentName: "Treasury Cash Reserve",
      growthRatePct: 4.0,
    };
  }

  if (key.includes("bank") || key.includes("mid") || key.includes("small")) {
    return {
      category: "Mutual Fund",
      instrumentName: "Bank Nifty ETF",
      growthRatePct: 12.5,
    };
  }

  if (key.includes("large") || key.includes("index") || key.includes("nifty")) {
    return {
      category: "Mutual Fund",
      instrumentName: "Nifty 50 Index Fund",
      growthRatePct: 11.8,
    };
  }

  if (key.includes("equity") || key.includes("growth")) {
    return {
      category: "Mutual Fund",
      instrumentName: "ICICI Prudential Flexi Cap Fund",
      growthRatePct: 12.1,
    };
  }

  return {
    category: "Bond",
    instrumentName: "Government Bonds",
    growthRatePct: 6.8,
  };
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getInvestmentExecutions(steps: ReplayStep[]) {
  return steps.filter((step) => step.type === "investment_execution");
}

export default function InvestmentRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const replayQuery = useQuery({
    queryKey: ["investment-run-detail", user?.id, runId],
    queryFn: () => runsAPI.getReplay(runId),
    enabled: !!runId && !!user?.id,
    retry: 2,
    refetchOnWindowFocus: false,
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

  const investmentExecutions = useMemo(() => {
    return getInvestmentExecutions(replay?.steps ?? []);
  }, [replay?.steps]);

  const totalInvested = useMemo(() => {
    return investmentExecutions.reduce((sum, step) => {
      return sum + toNumber(step.invested_amount);
    }, 0);
  }, [investmentExecutions]);

  const allocationBreakdown = useMemo<AllocationDetail[]>(() => {
    const aggregated: Record<string, number> = {};

    investmentExecutions.forEach((step) => {
      const allocation = step.allocation ?? {};
      Object.entries(allocation).forEach(([assetKey, amount]) => {
        aggregated[assetKey] = (aggregated[assetKey] ?? 0) + toNumber(amount);
      });
    });

    const entries = Object.entries(aggregated);

    return entries
      .map(([assetKey, amount]) => {
        const mapped = getRuleBasedInstrument(assetKey);
        const weightPct = totalInvested > 0 ? (amount / totalInvested) * 100 : 0;
        const projectedValue = amount * (1 + mapped.growthRatePct / 100);

        return {
          assetKey,
          category: mapped.category,
          instrumentName: mapped.instrumentName,
          amount,
          weightPct,
          growthRatePct: mapped.growthRatePct,
          projectedValue,
        };
      })
      .sort((left, right) => right.amount - left.amount);
  }, [investmentExecutions, totalInvested]);

  const projectedPortfolioValue = useMemo(() => {
    return allocationBreakdown.reduce((sum, entry) => sum + entry.projectedValue, 0);
  }, [allocationBreakdown]);

  const projectedGrowthPct = useMemo(() => {
    if (totalInvested <= 0) return 0;
    return ((projectedPortfolioValue - totalInvested) / totalInvested) * 100;
  }, [projectedPortfolioValue, totalInvested]);

  const firstExecution = investmentExecutions[0];
  const latestExecution = investmentExecutions[investmentExecutions.length - 1];

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                  Portfolio
                </p>
                <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                  Run Investment Details
                </h1>
                <p className="mt-1 text-sm text-(--muted)">Run ID {runId}</p>
              </div>
              <Button variant="secondary" onClick={() => router.push("/investments")}>Back</Button>
            </div>

            {replayQuery.isLoading ? (
              <Card>Loading run details...</Card>
            ) : replayQuery.isError ? (
              <Card>
                <div className="space-y-3">
                  <p className="text-sm text-(--muted)">
                    Could not load run details. Please try again.
                  </p>
                  <Button variant="secondary" onClick={() => replayQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              </Card>
            ) : replay ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">
                      Total invested
                    </p>
                    <p className="mt-2 text-xl font-semibold text-(--ink-1)">
                      {formatCurrency(totalInvested)}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">
                      Strategy
                    </p>
                    <p className="mt-2 text-xl font-semibold capitalize text-(--ink-1)">
                      {replay.strategy || "Unknown"}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">
                      Risk profile
                    </p>
                    <div className="mt-2">
                      <RiskBadge risk={replay.risk_level || undefined} />
                    </div>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">
                      Projected 1Y value
                    </p>
                    <p className="mt-2 text-xl font-semibold text-(--ink-1)">
                      {formatCurrency(projectedPortfolioValue)}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">
                      Projected growth
                    </p>
                    <p className="mt-2 text-xl font-semibold text-(--ink-1)">
                      {formatPercent(projectedGrowthPct)}
                    </p>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <h2 className="text-lg font-semibold text-(--ink-1)">
                      Backend execution snapshot
                    </h2>
                    <div className="mt-4 space-y-2 text-sm text-(--ink-2)">
                      <p>Executions in run: {investmentExecutions.length}</p>
                      <p>
                        Balance before first execution {formatCurrency(toNumber(firstExecution?.balance_before))}
                      </p>
                      <p>
                        Balance after latest execution {formatCurrency(toNumber(latestExecution?.balance_after))}
                      </p>
                      <p>
                        Final run balance {formatCurrency(toNumber(replay.final_balance))}
                      </p>
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-lg font-semibold text-(--ink-1)">
                      Raw investment log
                    </h2>
                    <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-(--surface-2) p-4 text-xs text-(--ink-2)">
                      {JSON.stringify(investmentExecutions, null, 2)}
                    </pre>
                  </Card>
                </div>

                <Card>
                  <h2 className="text-lg font-semibold text-(--ink-1)">
                    Allocation analytics 
                  </h2>
                  <div className="mt-4">
                    {allocationBreakdown.length ? (
                      <AllocationAnalyticsEChart data={allocationBreakdown} />
                    ) : (
                      <p className="text-(--ink-2)">No investment execution logs found for this run.</p>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card>Run details not found.</Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
