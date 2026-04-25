// File: src/pages/Generator.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  getPlayerImageUrl,
  getTeamCollection,
  normalizePlayers,
} from "../utils/playerData";

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

  useEffect(() => {
    let mounted = true;

    async function fetchGeneratorPlayers() {
      try {
        const response = await api.get("/api/generator/players");
        let items = normalizePlayers(response.data);

        if (items.length === 0) {
          const fallbackResponse = await api.get("/api/players");
          items = normalizePlayers(fallbackResponse.data);
        }

        if (mounted) {
          setPlayers(items);
          setSelectedIds(items.map((player) => player.idLabel));
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
      const response = await api.post("/api/generator/generate", payload);
      setResult(response.data);
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
    <section className="page-grid two-columns">
      <form className="card" onSubmit={handleGenerate}>
        <div className="section-heading">
          <h2>Generator</h2>
          <p>Selecione players e gere times usando `POST /api/generator/generate`.</p>
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

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={hasFixedCaptains}
            onChange={(event) => setHasFixedCaptains(event.target.checked)}
          />
          <span>Usar capitaes fixos</span>
        </label>

        <div className="player-picker">
          <strong>Players disponiveis ({selectedIds.length} selecionados)</strong>
          {loading ? (
            <p>Carregando lista para o generator...</p>
          ) : players.length === 0 ? (
            <p>Nenhum player retornado pela API para o generator.</p>
          ) : (
            players.map((player) => (
              <button
                key={player.idLabel}
                type="button"
                className={`picker-card ${selectedIds.includes(player.idLabel) ? "active" : ""}`}
                onClick={() => togglePlayer(player.idLabel)}
              >
                <div className="player-thumb">
                  {getPlayerImageUrl(player) ? (
                    <img src={getPlayerImageUrl(player)} alt={player.name} />
                  ) : (
                    <span>{player.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>

                <div className="picker-copy">
                  <strong>{player.name}</strong>
                  <span>
                    {player.position || "Sem posicao"}
                    {player.overall ? ` • Overall ${player.overall}` : ""}
                  </span>
                </div>
              </button>
            ))
          )}
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

      <div className="card">
        <div className="section-heading">
          <h2>Resultado</h2>
          <p>Resposta esperada: `Teams` e `Score`.</p>
        </div>

        {result ? (
          <div className="page-grid">
            {getTeamCollection(result).length > 0 ? (
              <div className="team-result-grid">
                {getTeamCollection(result).map((team, index) => (
                  <article key={index} className="team-card">
                    <h3>Time {index + 1}</h3>
                    <pre className="result-box light">
                      {JSON.stringify(team, null, 2)}
                    </pre>
                  </article>
                ))}
              </div>
            ) : null}

            <pre className="result-box">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : (
          <p>Nenhum sorteio executado ainda.</p>
        )}
      </div>
    </section>
  );
}

export default GeneratorPage;
