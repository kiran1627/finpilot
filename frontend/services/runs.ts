import api from "./api";

export const runsAPI = {
  getRuns: () => api.get("/api/runs"),
  getReplay: (runId: string) => api.get(`/api/runs/${runId}/replay`),
};
