"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { runsAPI } from "@/services/runs";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RiskBadge from "@/components/RiskBadge";
import { formatCurrency } from "@/utils/format";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { RunSummary } from "@/types/api";

function formatDateTime(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RunsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStrategy, setFilterStrategy] = useState("all");

  const runsQuery = useQuery({
    queryKey: ["runs", user?.id],
    queryFn: () => runsAPI.getRuns(),
    enabled: !!user?.id,
  });

  const runs = useMemo<RunSummary[]>(() => {
    const payload = runsQuery.data?.data ?? runsQuery.data;
    if (!Array.isArray(payload)) return [];
    return payload as RunSummary[];
  }, [runsQuery.data]);

  const availableStrategies = useMemo(() => {
    return Array.from(
      new Set(
        runs
          .map((run) => run.strategy)
          .filter((value): value is string => !!value)
          .map((value) => value.toLowerCase())
      )
    );
  }, [runs]);

  const filtered = useMemo(() => {
    return runs
      .filter((run) =>
        filterRisk === "all"
          ? true
          : (run.risk_level || "").toUpperCase() === filterRisk
      )
      .filter((run) =>
        filterStrategy === "all"
          ? true
          : (run.strategy || "").toLowerCase() === filterStrategy
      )
      .filter((run) => {
        if (!search) return true;
        const needle = search.toLowerCase();
        return (
          (run.run_id || "").toLowerCase().includes(needle) ||
          (run.strategy || "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const left = new Date(a.started_at || 0).getTime();
        const right = new Date(b.started_at || 0).getTime();
        return right - left;
      });
  }, [runs, filterRisk, filterStrategy, search]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                History
              </p>
              <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                Autonomy Runs
              </h1>
            </div>

            <Card>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <input
                  placeholder="Search by run id or strategy"
                  className="rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1) placeholder:text-(--muted) outline-none focus:border-(--brand-1)"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select
                  className="rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1) outline-none focus:border-(--brand-1)"
                  value={filterRisk}
                  onChange={(event) => setFilterRisk(event.target.value)}
                >
                  <option value="all">All risks</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <select
                  className="rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1) outline-none focus:border-(--brand-1)"
                  value={filterStrategy}
                  onChange={(event) => setFilterStrategy(event.target.value)}
                >
                  <option value="all">All strategies</option>
                  {availableStrategies.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {strategy}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setFilterRisk("all");
                    setFilterStrategy("all");
                  }}
                >
                  Reset
                </Button>
              </div>
            </Card>

            <Card>
              {runsQuery.isLoading ? (
                <p className="text-sm text-(--muted)">Loading runs...</p>
              ) : runsQuery.isError ? (
                <div className="space-y-3">
                  <p className="text-sm text-(--muted)">
                    Could not load runs. Please try again.
                  </p>
                  <Button variant="secondary" onClick={() => runsQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : filtered.length ? (
                <div className="space-y-3">
                  {filtered.map((run) => (
                    <button
                      key={run.run_id}
                      onClick={() => router.push(`/replay/${encodeURIComponent(run.run_id)}`)}
                      className="flex w-full flex-col items-start justify-between gap-3 rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-4 text-left hover:bg-(--surface-2) sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                          {run.run_id.slice(0, 8)}
                        </p>
                        <p className="text-sm font-semibold capitalize text-(--ink-1)">
                          {run.strategy || "Unknown strategy"}
                        </p>
                        <p className="text-xs text-(--muted)">
                          Final balance {formatCurrency(run.final_balance || 0)}
                        </p>
                        <p className="text-xs text-(--muted)">
                          Started {formatDateTime(run.started_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <RiskBadge risk={run.risk_level || undefined} />
                        <p className="text-xs text-(--muted)">
                          Ended {formatDateTime(run.ended_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-(--muted)">
                  No runs found for the current filters.
                </p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
