// File: src/App.jsx
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import PlayersListPage from "./pages/PlayersList";
import SheetsPage from "./pages/Sheets";
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
  return (
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
  );
}

export default App;
