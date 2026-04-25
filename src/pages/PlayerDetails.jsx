// File: src/pages/PlayerDetails.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import {
  formatOverall,
  getDisplayEntries,
  getPlayerImageUrl,
  normalizePlayer,
} from "../utils/playerData";

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

  return (
    <section className="page-grid">
      <div className="card">
        <div className="player-hero">
          <div className="player-thumb large">
            {getPlayerImageUrl(player) ? (
              <img src={getPlayerImageUrl(player)} alt={player.name} />
            ) : (
              <span>{player.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h2>{player.name ?? player.playerName ?? "Player"}</h2>
            <p>
              Detalhes retornados por `GET /api/players/{id}`.
              {player.team ? ` Time: ${player.team}.` : ""}
              {player.overall !== undefined && player.overall !== null && player.overall !== ""
                ? ` Overall: ${formatOverall(player.overall)}.`
                : ""}
            </p>
          </div>

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

        <dl className="details-grid">
          {getDisplayEntries(player).map(({ key, label, value }) => (
            <div key={key} className="detail-item">
              <dt>{label}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default PlayerDetailsPage;
