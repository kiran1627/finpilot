"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import { ledgerAPI } from "@/services/ledger";

export default function LogsPage() {
  const [runId, setRunId] = useState("");
  const [debouncedRunId, setDebouncedRunId] = useState("");
  const [entryType, setEntryType] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRunId(runId);
    }, 400);
    return () => clearTimeout(timer);
  }, [runId]);

  const ledgerQuery = useQuery({
    queryKey: ["ledger", debouncedRunId],
    queryFn: () => ledgerAPI.getLedger(debouncedRunId || undefined),
  });

  const entries = ledgerQuery.data?.data || [];

  const filtered = useMemo(() => {
    return entries.filter((entry: any) =>
      entryType === "all" ? true : entry.entry_type === entryType
    );
  }, [entries, entryType]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                Ledger
              </p>
              <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                Audit Log
              </h1>
            </div>

            <Card>
              <div className="grid gap-4 lg:grid-cols-2">
                <input
                  placeholder="Filter by run id"
                  className="rounded-2xl border border-(--surface-3) bg-(--surface-2) px-4 py-3 text-(--ink-1) placeholder:text-(--muted)"
                  value={runId}
                  onChange={(event) => setRunId(event.target.value)}
                />
                <select
                  className="rounded-2xl border border-(--surface-3) bg-(--surface-2) px-4 py-3 text-(--ink-1)"
                  value={entryType}
                  onChange={(event) => setEntryType(event.target.value)}
                >
                  <option value="all">All entry types</option>
                  <option value="investment_execution">Investment execution</option>
                  <option value="event">Event</option>
                  <option value="state_snapshot">State snapshot</option>
                  <option value="final_snapshot">Final snapshot</option>
                </select>
              </div>
            </Card>

            <Card>
              {ledgerQuery.isLoading ? (
                <p className="text-sm text-(--muted)">Loading ledger...</p>
              ) : filtered.length ? (
                <div className="space-y-3 text-sm text-(--muted)">
                  {filtered.map((entry: any, index: number) => (
                    <div
                      key={entry.id || index}
                      className="rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4"
                    >
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
                            {entry.entry_type}
                          </p>
                          <p className="text-xs text-(--muted)">
                            {new Date(entry.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-(--muted)">
                          {entry.run_id || "-"}
                        </p>
                      </div>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-2xl bg-(--surface-3) p-3 text-xs text-(--ink-1)">
{typeof entry.payload === "string"
  ? JSON.stringify(JSON.parse(entry.payload), null, 2)
  : JSON.stringify(entry.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-(--muted)">No ledger entries.</p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
