// File: src/pages/PlayerDetails.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import {
  formatOverall,
  getPlayerImageUrl,
  normalizePlayer,
} from "../utils/playerData";

const PLAYER_CARD_STATS = [
  { key: "speed", label: "PAC" },
  { key: "shoot", label: "SHO" },
  { key: "pass", label: "PAS" },
  { key: "dribble", label: "DRI" },
  { key: "defense", label: "DEF" },
  { key: "strength", label: "PHY" },
  { key: "firstTouch", label: "FTS" },
  { key: "ballControl", label: "CTL" },
];

function getCardTier(overallValue) {
  const numericOverall = Number(overallValue);

  if (Number.isNaN(numericOverall)) {
    return "player-fifa-card--silver";
  }

  if (numericOverall < 50) {
    return "player-fifa-card--bronze";
  }

  if (numericOverall <= 65) {
    return "player-fifa-card--silver";
  }

  return "player-fifa-card--gold";
}

function PlayerDetailsPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchPlayer() {
      try {
        const response = await api.get(`/api/players/${id}`);

        if (mounted) {
          setPlayer(normalizePlayer(response.data));
          setError("");
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.response?.data?.message ||
              requestError.response?.data?.title ||
              "Nao foi possivel carregar os detalhes do player.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayer();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="card">Carregando player...</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  if (!player) {
    return <div className="card">Player nao encontrado.</div>;
  }

  const playerName = player.name ?? player.playerName ?? "Player";
  const playerImageUrl = getPlayerImageUrl(player);
  const playerMeta = [player.team, player.nationality]
    .filter(Boolean)
    .join(" / ");
  const playerStats = PLAYER_CARD_STATS.filter(({ key }) => {
    const value = player[key];
    return value !== undefined && value !== null && value !== "";
  });

  return (
    <section className="page-grid player-details-page">
      <div className="card player-details-shell">
        <div className="player-details-actions">
          <div className="actions-cell">
            <Link to="/" className="secondary-button">
              Home
            </Link>
            <Link to={`/players/${id}/edit`} className="primary-button">
              Editar
            </Link>
            <Link to="/players" className="secondary-button">
              Voltar
            </Link>
          </div>
        </div>

        <div className="player-fifa-wrapper">
          <article
            className={`player-fifa-card ${getCardTier(player.overall)}`}
          >
            <div className="player-fifa-top">
              <div className="player-rating-block">
                <span className="player-rating-value">
                  {formatOverall(player.overall)}
                </span>
                <span className="player-rating-label">OVR</span>
              </div>

              <div className="player-fifa-portrait">
                {playerImageUrl ? (
                  <img src={playerImageUrl} alt={playerName} />
                ) : (
                  <span>{playerName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="player-fifa-nameplate">
              <h2>{playerName}</h2>
              {playerMeta ? <p>{playerMeta}</p> : null}
            </div>

            {playerStats.length > 0 ? (
              <dl className="player-fifa-stats">
                {playerStats.map(({ key, label }) => (
                  <div key={key} className="player-fifa-stat">
                    <dt>{label}</dt>
                    <dd>{formatOverall(player[key])}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="player-fifa-empty">
                Sem estatisticas cadastradas para exibir no card.
              </p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}

export default PlayerDetailsPage;
