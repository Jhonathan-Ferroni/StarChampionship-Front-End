import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatOverall, normalizePlayers } from "../utils/playerData";

function getPlayerImageUrl(player) {
  return player?.imageUrl || null;
}

// Lógica para definir se a carta é Ouro, Prata ou Bronze baseado no OVR
function getCardTierClass(overall) {
  if (overall >= 75) return "player-fifa-card--gold";
  if (overall >= 65) return "player-fifa-card--silver";
  return "player-fifa-card--bronze";
}

function HomePage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Busca e embaralha os jogadores
  useEffect(() => {
    let mounted = true;

    async function fetchPlayers() {
      try {
        const response = await api.get("/api/players");
        const players = normalizePlayers(response.data);

        if (mounted && players.length > 0) {
          // Embaralha o array aleatoriamente
          const shuffled = players.sort(() => 0.5 - Math.random());
          // Pega até 5 jogadores para o carrossel
          setFeaturedPlayers(shuffled.slice(0, 5));
        }
      } catch (err) {
        if (mounted) {
          setError("Não foi possível carregar os jogadores em destaque.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPlayers();

    return () => {
      mounted = false;
    };
  }, []);

  // Lógica do temporizador do carrossel (troca a cada 4 segundos)
  useEffect(() => {
    if (featuredPlayers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredPlayers.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [featuredPlayers.length]);

  const currentPlayer = featuredPlayers[currentIndex];

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

      {/* Seção do Carrossel */}
      {!loading && featuredPlayers.length > 0 && (
        <div className="card">
          <h3
            style={{
              marginBottom: "1rem",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            Jogadores em Destaque
          </h3>

          {/* Usamos o layout de carta do próprio CSS, com maxWidth para ficar menor na Home */}
          <div
            className="player-fifa-wrapper"
            style={{ maxWidth: "340px", margin: "0 auto" }}
          >
            <div
              className={`player-fifa-card ${getCardTierClass(currentPlayer.overall)}`}
            >
              <div className="player-fifa-top">
                <div className="player-rating-block">
                  <span className="player-rating-value">
                    {formatOverall(currentPlayer.overall)}
                  </span>
                  <span className="player-rating-label">OVR</span>
                </div>

                <div className="player-fifa-portrait">
                  {getPlayerImageUrl(currentPlayer) ? (
                    <img
                      src={getPlayerImageUrl(currentPlayer)}
                      alt={currentPlayer.name}
                    />
                  ) : (
                    <span>{currentPlayer.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="player-fifa-nameplate">
                <h2>{currentPlayer.name}</h2>
                <p>
                  ID {currentPlayer.idLabel}{" "}
                  {currentPlayer.team ? ` • ${currentPlayer.team}` : ""}
                </p>
              </div>

              <div className="player-fifa-stats">
                <div className="player-fifa-stat">
                  <dt>PAC</dt>
                  <dd>{currentPlayer.pac || "--"}</dd>
                </div>
                <div className="player-fifa-stat">
                  <dt>SHO</dt>
                  <dd>{currentPlayer.sho || "--"}</dd>
                </div>
                <div className="player-fifa-stat">
                  <dt>PAS</dt>
                  <dd>{currentPlayer.pas || "--"}</dd>
                </div>
                <div className="player-fifa-stat">
                  <dt>DRI</dt>
                  <dd>{currentPlayer.dri || "--"}</dd>
                </div>
                <div className="player-fifa-stat">
                  <dt>DEF</dt>
                  <dd>{currentPlayer.def || "--"}</dd>
                </div>
                <div className="player-fifa-stat">
                  <dt>PHY</dt>
                  <dd>{currentPlayer.phy || "--"}</dd>
                </div>
              </div>
            </div>
          </div>

          <div
            className="actions-cell"
            style={{ justifyContent: "center", marginTop: "1.5rem" }}
          >
            <Link
              to={`/players/${currentPlayer.id}`}
              className="primary-button"
            >
              Ver Perfil Completo
            </Link>
          </div>

          {/* Indicadores do carrossel */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1.5rem",
              justifyContent: "center",
            }}
          >
            {featuredPlayers.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  height: "10px",
                  width: "10px",
                  borderRadius: "50%",
                  backgroundColor: idx === currentIndex ? "#1357d6" : "#c8d4e7",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {loading && <div className="card text-center">Buscando destaques...</div>}
    </section>
  );
}

export default HomePage;
