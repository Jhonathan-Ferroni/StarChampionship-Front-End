// File: src/hooks/useAuth.js
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, isAuthenticated as hasValidToken, login, logout } from "../services/auth";

function useAuth() {
  const navigate = useNavigate();
  const token = getToken();

  return useMemo(
    () => ({
      token,
      isAuthenticated: hasValidToken(),
      login: async (password) => {
        const result = await login(password);

        if (result.success) {
          navigate("/players", { replace: true });
        }

        return result;
      },
      logout: () => logout(navigate),
    }),
    [navigate, token],
  );
}

export default useAuth;
