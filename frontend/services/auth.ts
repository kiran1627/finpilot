import api from "./api";

export const authAPI = {
  login: (data: URLSearchParams | { username: string; password: string }) =>
    api.post("/auth/login", data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),

  register: (data: { email: string; password: string; user_type?: string }) =>
    api.post("/auth/register", data),

  updateUserType: (data: { user_type: string }) =>
    api.patch("/auth/me/user-type", data),

  googleOAuth: (data: { id_token: string }) =>
    api.post("/auth/google", data),

  forgotPassword: (data: { email: string }) =>
    api.post("/auth/forgot-password", data),

  resetPassword: (data: { token: string; new_password: string }) =>
    api.post("/auth/reset-password", data),

  getMe: () => api.get("/auth/me"),
};
