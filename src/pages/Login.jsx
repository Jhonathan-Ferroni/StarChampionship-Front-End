// File: src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { isAuthenticated, login } from "../services/auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/players", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(password);

    if (result.success) {
      const redirectTo = location.state?.from?.pathname ?? "/players";
      navigate(redirectTo, { replace: true });
      return;
    }

    setError(result.error || "Nao foi possivel fazer login.");
    setLoading(false);
  }

  return (
    <section className="login-page">
      <div className="login-hero">
        <span className="eyebrow">StarChampionship</span>
        <h2>Painel administrativo</h2>
        <p>
          Entre para administrar players, consultar o status da API e gerar
          times com os atletas cadastrados.
        </p>
      </div>

      <LoginForm
        password={password}
        error={error}
        loading={loading}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
      />
    </section>
  );
}

export default LoginPage;
