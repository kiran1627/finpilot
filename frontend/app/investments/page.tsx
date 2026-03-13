"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/EmptyState";
import AllocationPieChart from "@/components/charts/AllocationPieChart";
import NavLineChart from "@/components/charts/NavLineChart";
import { investmentsAPI } from "@/services/investments";
import { ledgerAPI } from "@/services/ledger";
import { formatCurrency, formatPercent } from "@/utils/format";
import { Holding, LedgerEntry } from "@/types/api";

export default function InvestmentsPage() {
  const router = useRouter();

  const investmentsQuery = useQuery({
    queryKey: ["investments"],
    queryFn: () => investmentsAPI.getInvestments(),
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const ledgerQuery = useQuery({
    queryKey: ["ledger", "investment-executions"],
    queryFn: () => ledgerAPI.getLedger(),
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const data = investmentsQuery.data?.data;

  const allocationData = useMemo(() => {
    if (!data?.cumulative_allocation) return [];
    return Object.entries(data.cumulative_allocation).map(([name, value]) => ({
      name,
      value: Number(value || 0),
    }));
  }, [data]);

  const runIdsByHoldingIndex = useMemo(() => {
    const payload = ledgerQuery.data?.data;
    if (!Array.isArray(payload)) return [];

    return (payload as LedgerEntry[])
      .filter((entry) => entry.entry_type === "investment_execution" && !!entry.run_id)
      .sort((left, right) => {
        const leftTime = new Date(left.created_at || 0).getTime();
        const rightTime = new Date(right.created_at || 0).getTime();
        return leftTime - rightTime;
      })
      .map((entry) => String(entry.run_id));
  }, [ledgerQuery.data?.data]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                Portfolio
              </p>
              <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                Investments
              </h1>
            </div>

            {investmentsQuery.isLoading ? (
              <Card>
                <p className="text-sm text-(--muted)">Loading investments...</p>
              </Card>
            ) : investmentsQuery.isError ? (
              <Card>
                <p className="text-sm text-(--muted)">
                  Failed to load investments. Please try again.
                </p>
              </Card>
            ) : data ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total Value"
                    value={formatCurrency(data.total_portfolio_value)}
                  />
                  <StatCard
                    label="Total Invested"
                    value={formatCurrency(data.total_invested)}
                  />
                  <StatCard
                    label="Unrealized P&L"
                    value={formatCurrency(data.total_unrealized_pnl)}
                  />
                  <StatCard
                    label="Total Return"
                    value={formatPercent(data.total_return_pct)}
                  />
                </div>

                {data.total_invested === 0 ? (
                  <EmptyState
                    title="No investments yet"
                    description="Run an autonomy cycle to start building your portfolio."
                    actionLabel="Run cycle"
                    actionHref="/setup"
                  />
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <h2 className="text-lg font-semibold text-(--ink-1)">
                        Allocation
                      </h2>
                      <AllocationPieChart data={allocationData} />
                    </Card>
                    <Card>
                      <h2 className="text-lg font-semibold text-(--ink-1)">
                        NAV History
                      </h2>
                      <NavLineChart data={data.nav_history} />
                    </Card>
                  </div>
                )}

                <Card>
                  <h2 className="text-lg font-semibold text-(--ink-1)">
                    Holdings
                  </h2>
                  <div className="mt-4 space-y-2 text-sm text-(--muted)">
                    {data.holdings?.length ? (
                      data.holdings.map((holding: Holding, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const runId = runIdsByHoldingIndex[index];
                            if (!runId) return;
                            router.push(`/investments/${encodeURIComponent(runId)}`);
                          }}
                          disabled={!runIdsByHoldingIndex[index]}
                          className="flex w-full flex-col items-start justify-between gap-3 rounded-2xl border border-black/10 bg-(--surface-1) px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-(--surface-2) disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:bg-(--surface-1) sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="font-semibold text-(--ink-1)">
                              {holding.instrument || holding.name || "Instrument"}
                            </p>
                            <p>Invested {formatCurrency(holding.invested_amount || 0)}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-(--ink-1)">
                              {formatCurrency(holding.current_value)}
                            </p>
                            <p>
                              Return {formatPercent(holding.return_pct)}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p>No holdings found.</p>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card>
                <p className="text-sm text-(--muted)">Unable to load investments.</p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
