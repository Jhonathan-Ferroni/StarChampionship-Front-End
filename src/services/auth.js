// File: src/services/auth.js
import api from "./api";

const TOKEN_KEY = "token";
const EXPIRES_AT_KEY = "tokenExpiresAt";

function readTokenPayload(data) {
  return {
    token: data?.token ?? data?.Token ?? "",
    expiresAt: data?.expiresAt ?? data?.ExpiresAt ?? "",
    success: data?.success ?? data?.Success ?? false,
  };
}

function normalizeError(error) {
  if (error.response?.status === 401) {
    return "Senha invalida. Confira a credencial e tente novamente.";
  }

  if (error.response?.status === 400) {
    return (
      error.response?.data?.message ||
      error.response?.data?.title ||
      "Requisicao invalida. Revise os dados e tente novamente."
    );
  }

  if (error.response?.status >= 500) {
    return "O servidor esta indisponivel no momento. Tente novamente em instantes.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.title ||
    error.message ||
    "Nao foi possivel completar a autenticacao."
  );
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function login(password) {
  try {
    const endpoints = ["/api/auth/login", "/api/account/login"];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint, { password });
        const payload = readTokenPayload(response.data);
        const token = payload.token;
        const expiresAt = payload.expiresAt;
        const success = payload.success || Boolean(token);

        if (!success || !token) {
          return {
            success: false,
            token: "",
            expiresAt: "",
            error: "A API respondeu sem token valido.",
          };
        }

        localStorage.setItem(TOKEN_KEY, token);

        if (expiresAt) {
          localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
        } else {
          localStorage.removeItem(EXPIRES_AT_KEY);
        }

        return {
          success: true,
          token,
          expiresAt,
          error: "",
        };
      } catch (endpointError) {
        lastError = endpointError;

        if (endpointError.response?.status === 404) {
          continue;
        }

        throw endpointError;
      }
    }

    return {
      success: false,
      token: "",
      expiresAt: "",
      error: normalizeError(lastError || new Error("Endpoint de login nao encontrado.")),
    };
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);

    return {
      success: false,
      token: "",
      expiresAt: "",
      error: normalizeError(error),
    };
  }
}

export function logout(navigate) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);

  if (typeof navigate === "function") {
    navigate("/login", { replace: true });
    return;
  }

  window.location.assign("/login");
}

export default {
  login,
  getToken,
  logout,
  isAuthenticated,
};
