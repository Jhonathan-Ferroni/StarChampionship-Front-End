// File: src/App.jsx
import { useState, useEffect } from "react"; // <-- Adicionado os hooks do React
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import PlayersListPage from "./pages/PlayersList";
import SheetsPage from "./pages/Sheets";
import PlayerDetailsPage from "./pages/PlayerDetails";
import PlayerFormPage from "./pages/PlayerForm";
import GeneratorPage from "./pages/Generator";
import useAuth from "./hooks/useAuth";
import LoginForm from "./components/LoginForm";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AppShell({ children }) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>StarChampionship</h1>
          <p className="Title">O melhor balanceador de times de futebol!</p>
        </div>

        {isAuthenticated ? (
          <div className="topbar-actions">
            <nav className="nav-links" aria-label="Navegacao principal">
              <Link to="/">Home</Link>
              <Link to="/players">Jogadores</Link>
              <Link to="/players/sheets">Planilha</Link>
              <Link to="/players/new">Novo jogador</Link>
              <Link to="/generator">Gerador</Link>
            </nav>

            <button type="button" className="secondary-button" onClick={logout}>
              Sair
            </button>
          </div>
        ) : null}
      </header>

      <main>{children}</main>
    </div>
  );
}

function App() {
  // 1. Criamos o estado que controla se a caixinha de login aparece ou não
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 2. Criamos o escutador que vai ouvir o grito do interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsLoginModalOpen(true); // Abre a caixinha quando expirar
    };

    window.addEventListener("onSessionExpired", handleSessionExpired);

    return () => {
      window.removeEventListener("onSessionExpired", handleSessionExpired);
    };
  }, []);

  return (
    <>
      <AppShell>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/players"
            element={
              <ProtectedRoute>
                <PlayersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players/new"
            element={
              <ProtectedRoute>
                <PlayerFormPage mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players/sheets"
            element={
              <ProtectedRoute>
                <SheetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players/:id"
            element={
              <ProtectedRoute>
                <PlayerDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players/:id/edit"
            element={
              <ProtectedRoute>
                <PlayerFormPage mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generator"
            element={
              <ProtectedRoute>
                <GeneratorPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      {/* 3. A nossa Caixinha de Login (Modal) que fica invisível até o estado mudar para true */}
      {isLoginModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Sessão Expirada</h2>
            <p>
              Sua sessão de segurança expirou. Por favor, faça login novamente.
            </p>

            <LoginForm onSuces={() => setIsLoginModalOpen(false)} />

            <button
              type="button"
              className="secondary-button"
              style={{ marginTop: "15px" }}
              onClick={() => setIsLoginModalOpen(false)}
            ></button>
          </div>
        </div>
      )}
    </>
  );
}

// Estilos básicos inline apenas para a caixinha aparecer centralizada (pode trocar pelas suas classes CSS depois)
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  color: "#000",
  padding: "30px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  textAlign: "center",
  maxWidth: "400px",
};

export default App;
