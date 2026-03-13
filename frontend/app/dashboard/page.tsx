"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import RiskBadge from "@/components/RiskBadge";
import EmptyState from "@/components/EmptyState";
import NavLineChart from "@/components/charts/NavLineChart";
import AgentExecutionDisplay from "../../components/agent-execution-display";
import { dashboardAPI } from "@/services/dashboard";
import { runsAPI } from "@/services/runs";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatPercent } from "@/utils/format";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const getLastExecutionKey = (userId?: string) =>
  userId ? `lastAutonomyExecution:${userId}` : "lastAutonomyExecution";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [lastExecution, setLastExecution] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setLastExecution(null);
      return;
    }

    const raw = localStorage.getItem(getLastExecutionKey(user.id));
    if (!raw) {
      setLastExecution(null);
      return;
    }

    try {
      setLastExecution(JSON.parse(raw));
    } catch {
      setLastExecution(null);
    }
  }, [user?.id]);

  const summaryQuery = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => dashboardAPI.getSummary(),
    enabled: !!user?.id,
  });

  const runsQuery = useQuery({
    queryKey: ["runs", user?.id],
    queryFn: () => runsAPI.getRuns(),
    enabled: !!user?.id,
  });

  const summary = summaryQuery.data?.data;
  const runs = runsQuery.data?.data || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                  Command Center
                </p>
                <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                  Dashboard Overview
                </h1>
              </div>
              <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                <Button variant="secondary" onClick={() => summaryQuery.refetch()}>
                  Refresh
                </Button>
                <Button onClick={() => router.push("/setup")}>Run New Cycle</Button>
              </div>
            </div>

            {summaryQuery.isLoading ? (
              <Card>
                <p className="text-sm text-(--muted)">Loading dashboard...</p>
              </Card>
            ) : summary ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Net Worth" value={formatCurrency(summary.net_worth)} />
                <StatCard label="Total Invested" value={formatCurrency(summary.total_invested)} />
                <StatCard
                  label="Unrealized P&L"
                  value={formatCurrency(summary.total_unrealized_pnl)}
                />
                <StatCard
                  label="Total Return"
                  value={formatPercent(summary.total_return_pct)}
                />
              </div>
            ) : (
              <EmptyState
                title="No dashboard data"
                description="Run your first autonomy cycle to populate the dashboard."
                actionLabel="Run first cycle"
                actionHref="/setup"
              />
            )}

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-(--ink-1)">
                    NAV Trend
                  </h2>
                </div>
                {summary?.nav_trend?.length ? (
                  <NavLineChart data={summary.nav_trend} />
                ) : (
                  <p className="mt-6 text-sm text-(--muted)">
                    Start investing to see portfolio growth.
                  </p>
                )}
              </Card>
              <Card>
                <h2 className="text-lg font-semibold text-(--ink-1)">
                  Autonomy Status
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-(--muted)">Runs completed</span>
                    <span className="font-semibold">
                      {summary?.runs_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-(--muted)">Last run risk</span>
                    <RiskBadge risk={summary?.last_run_risk} />
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-(--ink-1)">
                  Recent Runs
                </h2>
                <Button variant="ghost" onClick={() => router.push("/runs")}>
                  View all
                </Button>
              </div>
              {runsQuery.isLoading ? (
                <p className="mt-4 text-sm text-(--muted)">Loading runs...</p>
              ) : runs.length ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {runs.slice(0, 6).map((run: any) => (
                    <button
                      key={run.run_id}
                      className="rounded-2xl border border-black/10 bg-(--surface-1) p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-(--surface-2)"
                      onClick={() => router.push(`/replay/${run.run_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                          Run {run.run_id.slice(0, 6)}
                        </div>
                        <RiskBadge risk={run.risk_level} />
                      </div>
                      <div className="mt-3 text-lg font-semibold text-(--ink-1)">
                        {run.strategy}
                      </div>
                      <p className="text-sm text-(--muted)">
                        Final balance {formatCurrency(run.final_balance)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-(--muted)">
                  No runs yet. Run your first cycle.
                </p>
              )}
            </Card>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-(--ink-1)">
                  Latest Agent Outputs
                </h2>
                <Button variant="ghost" onClick={() => router.push("/setup")}>
                  Run Cycle
                </Button>
              </div>

              {lastExecution?.agent_outputs ? (
                <div className="mt-4">
                  <AgentExecutionDisplay
                    compact
                    agentOutputs={lastExecution.agent_outputs}
                    ledger={lastExecution.ledger || []}
                    runId={lastExecution.run_id}
                    finalBalance={lastExecution.final_balance}
                    riskLevel={lastExecution.risk_level}
                    strategy={lastExecution.strategy}
                  />
                </div>
              ) : (
                <p className="mt-4 text-sm text-(--muted)">
                  No agent output snapshot found yet. Run a cycle from Setup to display full agent pipeline results here.
                </p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
