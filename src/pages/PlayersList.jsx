// File: src/pages/PlayersList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  formatOverall,
  getPlayerImageUrl,
  normalizePlayers,
} from "../utils/playerData";

function PlayersListPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchPlayers() {
      try {
        const response = await api.get("/api/players");

        if (mounted) {
          setPlayers(normalizePlayers(response.data));
          setError("");
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.response?.data?.message ||
              requestError.response?.data?.title ||
              "Nao foi possivel carregar os players.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm("Deseja realmente remover este player?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/players/${id}`);
      setPlayers((currentPlayers) =>
        currentPlayers.filter((player) => player.id !== id),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.title ||
          "Nao foi possivel remover o player.",
      );
    }
  }

  return (
    <section className="page-grid">
      <div className="section-heading">
        <h2>Players</h2>
        <p>Lista completa dos jogadores retornados por `GET /api/players`.</p>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="card">Carregando players...</div>
      ) : (
        <div className="card">
          <div className="card-row">
            <strong>{players.length} players</strong>
            <div className="actions-cell">
              <Link to="/" className="secondary-button">
                Home
              </Link>
              <Link to="/players/new" className="primary-button">
                Novo player
              </Link>
            </div>
          </div>

          {players.length === 0 ? (
            <p>Nenhum player cadastrado.</p>
          ) : (
            <div className="player-grid">
              {players.map((player) => (
                <article key={player.idLabel} className="player-card">
                  <div className="player-card-header">
                    <div className="player-thumb">
                      {getPlayerImageUrl(player) ? (
                        <img src={getPlayerImageUrl(player)} alt={player.name} />
                      ) : (
                        <span>{player.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <h3>{player.name}</h3>
                      <p>
                        ID {player.idLabel}
                        {player.team ? ` • ${player.team}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="player-meta">
                    <strong>Overall {formatOverall(player.overall)}</strong>
                    {player.imageUrl ? (
                      <a href={player.imageUrl} target="_blank" rel="noreferrer">
                        Abrir imagem
                      </a>
                    ) : (
                      <span>Sem imagem</span>
                    )}
                  </div>

                  <div className="actions-cell">
                    <Link to={`/players/${player.id}`}>Detalhes</Link>
                    <Link to={`/players/${player.id}/edit`}>Editar</Link>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(player.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default PlayersListPage;
