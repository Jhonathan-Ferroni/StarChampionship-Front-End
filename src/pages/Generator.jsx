// File: src/pages/Generator.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  formatOverall,
  getPlayerImageUrl,
  getTeamCollection,
  normalizePlayer,
  normalizePlayers,
} from "../utils/playerData";

function buildTeamsLocally(players, numberOfTeams, selectedCaptains = {}, hasFixedCaptains = false) {
  const teamCount = Math.max(2, Number(numberOfTeams) || 2);
  const normalizedPlayers = [...players].sort(
    (left, right) => (Number(right.overall) || 0) - (Number(left.overall) || 0),
  );

  const teams = Array.from({ length: teamCount }, (_, index) => ({
    teamIndex: index,
    players: [],
    totalScore: 0,
  }));

  const assignedIds = new Set();

  if (hasFixedCaptains) {
    for (const [teamIndexKey, captainId] of Object.entries(selectedCaptains)) {
      const teamIndex = Number(teamIndexKey);
      const captain = normalizedPlayers.find(
        (player) => player.idLabel === captainId,
      );

      if (!captain || Number.isNaN(teamIndex) || !teams[teamIndex]) {
        continue;
      }

      teams[teamIndex].players.push(captain);
      teams[teamIndex].totalScore += Number(captain.overall) || 0;
      assignedIds.add(captain.idLabel);
    }
  }

  for (const player of normalizedPlayers) {
    if (assignedIds.has(player.idLabel)) {
      continue;
    }

    const targetTeam = [...teams].sort(
      (left, right) =>
        left.totalScore - right.totalScore ||
        left.players.length - right.players.length,
    )[0];

    targetTeam.players.push(player);
    targetTeam.totalScore += Number(player.overall) || 0;
  }

  const totals = teams.map((team) => team.totalScore);
  const score = totals.length > 0 ? Math.max(...totals) - Math.min(...totals) : 0;

  return {
    Teams: teams.map((team, index) => ({
      TeamNumber: index + 1,
      TotalScore: Number(team.totalScore.toFixed(2)),
      Players: team.players,
    })),
    Score: Number(score.toFixed(2)),
    GeneratedBy: "frontend-fallback",
  };
}

function GeneratorPage() {
  const [players, setPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [hasFixedCaptains, setHasFixedCaptains] = useState(false);
  const [selectedCaptains, setSelectedCaptains] = useState({});
  const [margin, setMargin] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [generatorMode, setGeneratorMode] = useState("api");

  useEffect(() => {
    let mounted = true;

    async function fetchGeneratorPlayers() {
      try {
        const fallbackResponse = await api.get("/api/players");
        const items = normalizePlayers(fallbackResponse.data);

        if (mounted) {
          setPlayers(items);
          setSelectedIds(items.map((player) => player.idLabel));
          setGeneratorMode("frontend-fallback");
          setError("");
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.response?.data?.message ||
              requestError.response?.data?.title ||
              "Nao foi possivel carregar os players do generator.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchGeneratorPlayers();

    return () => {
      mounted = false;
    };
  }, []);

  function togglePlayer(playerId) {
    setSelectedIds((currentIds) =>
      currentIds.includes(playerId)
        ? currentIds.filter((id) => id !== playerId)
        : [...currentIds, playerId],
    );
  }

  function setCaptainForTeam(teamIndex, captainId) {
    setSelectedCaptains((currentCaptains) => ({
      ...currentCaptains,
      [teamIndex]: captainId,
    }));
  }

  const selectedPlayers = players.filter((player) =>
    selectedIds.includes(player.idLabel),
  );
  const teams = result ? getTeamCollection(result) : [];
  const marginNumber = margin === "" ? null : Number(margin);
  const balanceScore = result?.Score;
  const balanceLimit = Number.isNaN(marginNumber) ? null : marginNumber;
  const isBalanced =
    typeof balanceScore === "number" &&
    typeof balanceLimit === "number" &&
    balanceScore <= balanceLimit;

  async function handleGenerate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (selectedIds.length === 0) {
      setError("Selecione pelo menos um player para gerar os times.");
      setSubmitting(false);
      return;
    }

    const captainPayload = hasFixedCaptains
      ? Object.fromEntries(
          Object.entries(selectedCaptains)
            .filter(([, captainId]) => captainId)
            .map(([teamIndex, captainId]) => {
              const captain = selectedPlayers.find(
                (player) => player.idLabel === captainId,
              );

              return [teamIndex, captain?.name ?? captainId];
            }),
        )
      : undefined;

    const payload = {
      SelectedIds: selectedPlayers.map((player) => {
        const numericId = Number(player.id);
        return Number.isNaN(numericId) ? player.id : numericId;
      }),
      NumberOfTeams: Number(numberOfTeams),
      HasFixedCaptains: hasFixedCaptains,
      SelectedCaptains: captainPayload,
      Margin: margin === "" ? undefined : Number(margin),
    };

    try {
      try {
        const response = await api.post("/api/generator/generate", payload);
        setGeneratorMode("api");
        setResult(response.data);
      } catch (requestError) {
        if (requestError.response?.status === 404) {
          setGeneratorMode("frontend-fallback");
          setResult(
            buildTeamsLocally(
              selectedPlayers,
              numberOfTeams,
              selectedCaptains,
              hasFixedCaptains,
            ),
          );
        } else {
          throw requestError;
        }
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.title ||
          "Nao foi possivel gerar os times.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-grid generator-layout">
      <div className="card generator-result-panel">
        <div className="section-heading">
          <h2>Resultado</h2>
          <p>Modo atual: {generatorMode === "api" ? "API" : "Fallback local"}.</p>
        </div>

        {result ? (
          <div className="page-grid">
            <div className="generator-summary-bar">
              <div className="generator-summary-pill">
                <span>Times</span>
                <strong>{teams.length || Number(numberOfTeams) || 0}</strong>
              </div>

              {typeof balanceScore === "number" ? (
                <div
                  className={`generator-summary-pill ${isBalanced ? "success" : "warning"}`}
                >
                  <span>Equilibrio</span>
                  <strong>{Math.round(balanceScore)}</strong>
                </div>
              ) : null}

              {balanceLimit !== null && !Number.isNaN(balanceLimit) ? (
                <div className="generator-summary-pill">
                  <span>Margem alvo</span>
                  <strong>{Math.round(balanceLimit)}</strong>
                </div>
              ) : null}
            </div>

            {teams.length > 0 ? (
              <div className="team-result-grid">
                {teams.map((team, index) => {
                  const teamPlayers = normalizePlayers(team.Players ?? team.players ?? []);
                  const totalScore = Number(team.TotalScore ?? team.totalScore ?? 0);

                  return (
                    <article key={index} className="team-card generator-team-card">
                      <div className="generator-team-header">
                        <div>
                          <h3>Time {team.TeamNumber ?? index + 1}</h3>
                          <p>{teamPlayers.length} jogadores selecionados</p>
                        </div>

                        <div className="generator-team-score">
                          <span>Total</span>
                          <strong>{Math.round(totalScore)}</strong>
                        </div>
                      </div>

                      <div className="team-player-grid">
                        {teamPlayers.map((player, playerIndex) => {
                          const normalizedPlayer = normalizePlayer(player, playerIndex);

                          return (
                            <article
                              key={`${normalizedPlayer.idLabel}-${playerIndex}`}
                              className="result-player-card"
                            >
                              <div className="player-thumb result-thumb">
                                {getPlayerImageUrl(normalizedPlayer) ? (
                                  <img
                                    src={getPlayerImageUrl(normalizedPlayer)}
                                    alt={normalizedPlayer.name}
                                  />
                                ) : (
                                  <span>{normalizedPlayer.name.slice(0, 1).toUpperCase()}</span>
                                )}
                              </div>

                              <div className="result-player-copy">
                                <strong>{normalizedPlayer.name}</strong>
                                <span>Overall {formatOverall(normalizedPlayer.overall)}</span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p>Nenhum time retornado.</p>
            )}
          </div>
        ) : (
          <p>Nenhum sorteio executado ainda.</p>
        )}
      </div>

      <form className="card generator-controls" onSubmit={handleGenerate}>
        <div className="section-heading">
          <h2>Generator</h2>
          <p>
            Selecione players e gere times. Quando o backend de generator nao
            estiver disponivel, o app usa um balanceamento local.
          </p>
        </div>

        <div className="card-row">
          <Link to="/" className="secondary-button">
            Home
          </Link>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setSelectedIds(players.map((player) => player.idLabel))}
          >
            Selecionar todos
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setSelectedIds([])}
          >
            Limpar selecao
          </button>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="generator-toolbar">
          <label className="field">
            <span>Numero de times</span>
            <input
              type="number"
              min="2"
              value={numberOfTeams}
              onChange={(event) => setNumberOfTeams(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Margem</span>
            <input
              type="number"
              min="0"
              value={margin}
              onChange={(event) => setMargin(event.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={hasFixedCaptains}
            onChange={(event) => setHasFixedCaptains(event.target.checked)}
          />
          <span>Usar capitaes fixos</span>
        </label>

        <div className="player-picker-block">
          <div className="player-picker-heading">
            <strong>Players disponiveis</strong>
            <span>{selectedIds.length} selecionados</span>
          </div>

          <div className="player-picker expanded">
            {loading ? (
              <p>Carregando lista para o generator...</p>
            ) : players.length === 0 ? (
              <p>Nenhum player retornado pela API para o generator.</p>
            ) : (
              players.map((player) => (
                <button
                  key={player.idLabel}
                  type="button"
                  className={`picker-card large ${selectedIds.includes(player.idLabel) ? "active" : ""}`}
                  onClick={() => togglePlayer(player.idLabel)}
                >
                  <div className="player-thumb picker-thumb">
                    {getPlayerImageUrl(player) ? (
                      <img src={getPlayerImageUrl(player)} alt={player.name} />
                    ) : (
                      <span>{player.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="picker-copy">
                    <strong>{player.name}</strong>
                    <span>Overall {formatOverall(player.overall)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {hasFixedCaptains ? (
          <div className="captains-grid">
            {Array.from({ length: Number(numberOfTeams) || 0 }, (_, index) => (
              <label key={index} className="field">
                <span>Capitao do time {index + 1}</span>
                <select
                  value={selectedCaptains[index] ?? ""}
                  onChange={(event) => setCaptainForTeam(index, event.target.value)}
                >
                  <option value="">Selecionar</option>
                  {selectedPlayers.map((player) => (
                    <option key={player.idLabel} value={player.idLabel}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? "Gerando..." : "Gerar times"}
        </button>
      </form>
    </section>
  );
}

export default GeneratorPage;
