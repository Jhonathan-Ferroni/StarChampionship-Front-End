// File: src/App.jsx
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/Login";
import PlayersListPage from "./pages/PlayersList";
import PlayerDetailsPage from "./pages/PlayerDetails";
import PlayerFormPage from "./pages/PlayerForm";
import GeneratorPage from "./pages/Generator";
import useAuth from "./hooks/useAuth";

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
          <p>Gerencie autenticacao, jogadores e geracao de times.</p>
        </div>

        {isAuthenticated ? (
          <div className="topbar-actions">
            <nav className="nav-links" aria-label="Navegacao principal">
              <Link to="/players">Players</Link>
              <Link to="/players/new">Novo player</Link>
              <Link to="/generator">Generator</Link>
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
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/players" replace />} />
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
  );
}

export default App;
