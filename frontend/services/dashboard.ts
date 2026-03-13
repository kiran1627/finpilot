import api from "./api";

export const dashboardAPI = {
  getSummary: () => api.get("/api/dashboard/summary"),
};
