// File: src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function HomePage() {
  const [info, setInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchHomeData() {
      try {
        const [infoResponse, healthResponse] = await Promise.allSettled([
          api.get("/api/home"),
          api.get("/api/home/health"),
        ]);

        if (!mounted) {
          return;
        }

        if (infoResponse.status === "fulfilled") {
          setInfo(infoResponse.value.data);
        }

        if (healthResponse.status === "fulfilled") {
          setHealth(healthResponse.value.data);
        }

        if (infoResponse.status === "rejected" && healthResponse.status === "rejected") {
          setError("Nao foi possivel carregar os dados iniciais da aplicacao.");
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
          <span className="eyebrow">Painel</span>
          <h2>Central do StarChampionship</h2>
          <p>
            Acesse os players, acompanhe a API e monte os times com uma navegação
            mais direta.
          </p>
        </div>

        <div className="card-row">
          <Link to="/players" className="primary-button">
            Ver players
          </Link>
          <Link to="/generator" className="secondary-button">
            Abrir generator
          </Link>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="stats-grid">
        <div className="card">
          <div className="section-heading">
            <h2>App</h2>
            <p>Informacoes vindas de `GET /api/home`.</p>
          </div>

          {loading ? (
            <p>Carregando informacoes...</p>
          ) : (
            <pre className="result-box light">{JSON.stringify(info, null, 2)}</pre>
          )}
        </div>

        <div className="card">
          <div className="section-heading">
            <h2>Health</h2>
            <p>Status retornado por `GET /api/home/health`.</p>
          </div>

          {loading ? (
            <p>Carregando health check...</p>
          ) : (
            <pre className="result-box light">{JSON.stringify(health, null, 2)}</pre>
          )}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
