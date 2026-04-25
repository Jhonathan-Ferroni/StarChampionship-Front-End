// File: src/components/LoginForm.jsx
function LoginForm({
  password,
  error,
  loading,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <form className="card login-card" onSubmit={onSubmit}>
      <div className="section-heading">
        <h2>Entrar</h2>
        <p>Use a senha de acesso do StarChampionship para continuar.</p>
      </div>

      <label className="field">
        <span>Senha</span>
        <input
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Digite sua senha"
          autoComplete="current-password"
          disabled={loading}
          required
        />
      </label>

      {error ? <div className="alert error">{error}</div> : null}

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default LoginForm;
