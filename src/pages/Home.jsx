// File: src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatOverall, normalizePlayers } from "../utils/playerData";

function HomePage() {
  const [info, setInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchHomeData() {
      try {
        const response = await api.get("/api/players");
        const players = normalizePlayers(response.data);

        if (!mounted) {
          return;
        }

        setInfo({
          totalPlayers: players.length,
          withImage: players.filter((player) => player.imageUrl).length,
          averageOverall:
            players.length > 0
              ? formatOverall(
                  players.reduce(
                    (total, player) => total + (Number(player.overall) || 0),
                    0,
                  ) / players.length,
                  "0",
                )
              : "0",
        });

        setHealth({
          apiStatus: "online",
          playersEndpoint: "/api/players",
          generatorMode: "frontend fallback",
        });
        setError("");
      } catch {
        if (mounted) {
          setError("Nao foi possivel carregar os dados iniciais da aplicacao.");
          setInfo({ totalPlayers: 0, withImage: 0, averageOverall: "0" });
          setHealth({
            apiStatus: "offline",
            playersEndpoint: "/api/players",
            generatorMode: "frontend fallback",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="page-grid">
      <div className="hero-card">
        <div>
          <h2 className="eyebrow">StarChampionship</h2>
          <p>
            Crie, edite e organize seus jogadores para gerar times mais
            equilibrados no seu futebol!
          </p>
        </div>

        <div className="card-row">
          <Link to="/players" className="primary-button">
            Ver players
          </Link>
          <Link to="/generator" className="secondary-button">
            Abrir Gerador
          </Link>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="stats-grid">
        <div className="card">
          <div className="section-heading">
            <h2>Geral</h2>
          </div>

          {loading ? (
            <p>Carregando informacoes...</p>
          ) : (
            <pre className="result-box light">
              {JSON.stringify(info, null, 2)}
            </pre>
          )}
        </div>

        <div className="card">
          <div className="section-heading">
            <h2>Health</h2>
          </div>

          {loading ? (
            <p>Carregando health check...</p>
          ) : (
            <pre className="result-box light">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
