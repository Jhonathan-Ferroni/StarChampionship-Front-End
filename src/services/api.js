// File: src/services/api.js
import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiresAt");

      if (window.location.pathname !== "/login") {
        const nextPath = encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
        window.location.assign(`/login?redirect=${nextPath}`);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
