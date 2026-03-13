import api from "./api";

export const autonomyAPI = {
  runCycle: (data: any) => api.post("/run-autonomy-cycle", data),
};
