// File: src/pages/Generator.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

function GeneratorPage() {
  const [players, setPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [hasFixedCaptains, setHasFixedCaptains] = useState(false);
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

        if (mounted) {
          const items = Array.isArray(response.data) ? response.data : [];
          setPlayers(items);
          setSelectedIds(items.map((player) => player.id));
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

  async function handleGenerate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      SelectedIds: selectedIds,
      NumberOfTeams: Number(numberOfTeams),
      HasFixedCaptains: hasFixedCaptains,
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
          <strong>Players disponiveis</strong>
          {loading ? (
            <p>Carregando lista para o generator...</p>
          ) : (
            players.map((player) => (
              <label key={player.id} className="checkbox-field">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                />
                <span>
                  {player.name ?? player.playerName ?? "Player"}{" "}
                  {player.overall ? `(${player.overall})` : ""}
                </span>
              </label>
            ))
          )}
        </div>

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
          <pre className="result-box">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <p>Nenhum sorteio executado ainda.</p>
        )}
      </div>
    </section>
  );
}

export default GeneratorPage;
