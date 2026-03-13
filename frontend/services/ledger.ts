import api from "./api";

export const ledgerAPI = {
  getLedger: (runId?: string) =>
    api.get("/api/ledger", {
      params: runId ? { run_id: runId } : {},
    }),
};
