// File: src/services/api.js
import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

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
      // 1. Dispara um alerta global avisando que a sessão caiu
      window.dispatchEvent(new CustomEvent("onSessionExpired"));

      // 2. Retorna uma Promise "vazia" que nunca resolve nem rejeita.
      // Isso impede que o fluxo siga para o .then() ou .catch() do componente e quebre a tela.
      return new Promise(() => {});
    }

    // Se o erro não for 401, segue a vida e rejeita normalmente
    return Promise.reject(error);
  },
);

export default api;
