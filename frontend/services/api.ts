import axios from "axios";

const isBrowser = typeof window !== "undefined";
const isLocalBrowser =
  isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);

// In production-like browser contexts, do not default to localhost.
const fallbackApiUrl = isLocalBrowser ? "http://localhost:8000" : "";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || fallbackApiUrl,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("lastAutonomyExecution");

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("lastAutonomyExecution:")) {
          localStorage.removeItem(key);
        }
      });

      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
