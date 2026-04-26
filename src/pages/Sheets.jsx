import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatOverall, normalizePlayers } from "../utils/playerData";

const SHEET_COLUMNS = [
  { key: "name", label: "Nome", type: "text" },
  { key: "speed", label: "PAC", type: "number" },
  { key: "shoot", label: "SHO", type: "number" },
  { key: "pass", label: "PAS", type: "number" },
  { key: "dribble", label: "DRI", type: "number" },
  { key: "defense", label: "DEF", type: "number" },
  { key: "strength", label: "PHY", type: "number" },
  { key: "firstTouch", label: "FTS", type: "number" },
  { key: "ballControl", label: "CTL", type: "number" },
  { key: "overall", label: "OVR", type: "number" },
];

function comparePlayers(leftPlayer, rightPlayer, sortConfig) {
  const leftValue = leftPlayer?.[sortConfig.key];
  const rightValue = rightPlayer?.[sortConfig.key];

  if (sortConfig.type === "text") {
    const normalizedLeft = String(leftValue ?? "").trim();
    const normalizedRight = String(rightValue ?? "").trim();

    if (!normalizedLeft && !normalizedRight) {
      return 0;
    }

    if (!normalizedLeft) {
      return 1;
    }

    if (!normalizedRight) {
      return -1;
    }

    const comparison = normalizedLeft.localeCompare(normalizedRight, "pt-BR", {
      sensitivity: "base",
    });

    return sortConfig.direction === "asc" ? comparison : comparison * -1;
  }

  const normalizedLeft = Number(leftValue);
  const normalizedRight = Number(rightValue);
  const leftIsMissing = Number.isNaN(normalizedLeft);
  const rightIsMissing = Number.isNaN(normalizedRight);

  if (leftIsMissing && rightIsMissing) {
    return 0;
  }

  if (leftIsMissing) {
    return 1;
  }

  if (rightIsMissing) {
    return -1;
  }

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  if (sortConfig.direction === "asc") {
    return normalizedLeft - normalizedRight;
  }

  return normalizedRight - normalizedLeft;
}

function SheetsPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
    type: "text",
  });

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
              "Nao foi possivel carregar a planilha de players.",
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

  function handleSort(column) {
    setSortConfig((currentConfig) => {
      if (currentConfig.key === column.key) {
        return {
          ...currentConfig,
          direction: currentConfig.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: column.key,
        direction: column.type === "text" ? "asc" : "desc",
        type: column.type,
      };
    });
  }

  const sortedPlayers = [...players].sort((leftPlayer, rightPlayer) =>
    comparePlayers(leftPlayer, rightPlayer, sortConfig),
  );

  return (
    <section className="page-grid">
      <div className="section-heading">
        <h2>Planilha de Players</h2>
        <p>
          Clique no cabecalho de qualquer coluna para ordenar os jogadores pela
          estatistica desejada.
        </p>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="card">Carregando planilha...</div>
      ) : (
        <div className="card">
          <div className="card-row">
            <strong>{players.length} players</strong>
            <div className="actions-cell">
              <Link to="/" className="secondary-button">
                Home
              </Link>
              <Link to="/players" className="secondary-button">
                Cards
              </Link>
              <Link to="/players/new" className="primary-button">
                Novo player
              </Link>
            </div>
          </div>

          {players.length === 0 ? (
            <p>Nenhum player cadastrado.</p>
          ) : (
            <div className="table-wrapper">
              <table className="sheet-table">
                <thead>
                  <tr>
                    {SHEET_COLUMNS.map((column) => {
                      const isActive = sortConfig.key === column.key;
                      const directionLabel =
                        isActive && sortConfig.direction === "asc" ? "^" : "v";

                      return (
                        <th key={column.key} scope="col">
                          <button
                            type="button"
                            className={`table-sort-button${isActive ? " active" : ""}`}
                            onClick={() => handleSort(column)}
                          >
                            <span>{column.label}</span>
                            <span className="table-sort-indicator">
                              {isActive ? directionLabel : "+/-"}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                    <th scope="col" className="sheet-actions-heading">
                      Acoes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedPlayers.map((player) => (
                    <tr key={player.idLabel}>
                      <td className="sheet-name-cell">{player.name}</td>
                      <td>{formatOverall(player.speed)}</td>
                      <td>{formatOverall(player.shoot)}</td>
                      <td>{formatOverall(player.pass)}</td>
                      <td>{formatOverall(player.dribble)}</td>
                      <td>{formatOverall(player.defense)}</td>
                      <td>{formatOverall(player.strength)}</td>
                      <td>{formatOverall(player.firstTouch)}</td>
                      <td>{formatOverall(player.ballControl)}</td>
                      <td className="sheet-overall-cell">
                        {formatOverall(player.overall)}
                      </td>
                      <td>
                        <div className="sheet-actions-cell">
                          <Link
                            to={`/players/${player.id}`}
                            className="sheet-action-link"
                          >
                            Card
                          </Link>
                          <Link
                            to={`/players/${player.id}/edit`}
                            className="sheet-action-link"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            className="sheet-action-link danger"
                            onClick={() => handleDelete(player.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default SheetsPage;
