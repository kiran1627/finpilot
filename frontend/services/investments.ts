import api from "./api";

export const investmentsAPI = {
  getInvestments: () => api.get("/api/investments"),
};
