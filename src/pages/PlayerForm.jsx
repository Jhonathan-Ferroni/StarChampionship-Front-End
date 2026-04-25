// File: src/pages/PlayerForm.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import {
  buildPlayerPayload,
  formatFieldLabel,
  normalizePlayers,
  toFormValue,
} from "../utils/playerData";

const fieldGroups = [
  {
    title: "Basico",
    fields: [
      { key: "name", label: "Nome", type: "text", required: true, placeholder: "Nome do player" },
      { key: "overall", label: "Overall", type: "number", placeholder: "Ex.: 87" },
      { key: "imageUrl", label: "Image URL", type: "url", placeholder: "https://..." },
      { key: "position", label: "Posicao", type: "text", placeholder: "Ex.: ST" },
      { key: "team", label: "Time", type: "text", placeholder: "Nome do time" },
      { key: "nationality", label: "Nacionalidade", type: "text", placeholder: "Pais" },
    ],
  },
  {
    title: "Fisico",
    fields: [
      { key: "age", label: "Idade", type: "number" },
      { key: "height", label: "Altura", type: "number" },
      { key: "weight", label: "Peso", type: "number" },
    ],
  },
  {
    title: "Atributos",
    fields: [
      { key: "pace", label: "Pace", type: "number" },
      { key: "shooting", label: "Shooting", type: "number" },
      { key: "passing", label: "Passing", type: "number" },
      { key: "dribbling", label: "Dribbling", type: "number" },
      { key: "defense", label: "Defense", type: "number" },
      { key: "physical", label: "Physical", type: "number" },
    ],
  },
];

const baseFormValues = fieldGroups
  .flatMap((group) => group.fields)
  .reduce((accumulator, field) => ({ ...accumulator, [field.key]: "" }), {});

function PlayerFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(baseFormValues);
  const [originalPlayer, setOriginalPlayer] = useState({});
  const [templatePlayer, setTemplatePlayer] = useState({});
  const [extraFields, setExtraFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function prepareForm() {
      try {
        try {
          const sampleResponse = await api.get("/api/players");
          const samplePlayers = normalizePlayers(sampleResponse.data);

          if (mounted && samplePlayers.length > 0) {
            setTemplatePlayer(samplePlayers[0].__raw ?? {});
          }
        } catch {
          if (mounted) {
            setTemplatePlayer({});
          }
        }

        if (mode === "edit" && id) {
          try {
            const response = await api.get(`/api/players/${id}`);
            const loadedPlayer = response.data ?? {};

            if (mounted) {
              setOriginalPlayer(loadedPlayer);
              setPlayer((currentPlayer) => ({
                ...currentPlayer,
                ...Object.fromEntries(
                  Object.keys(baseFormValues).map((key) => [key, toFormValue(loadedPlayer[key])]),
                ),
                name: toFormValue(
                  loadedPlayer.name ?? loadedPlayer.Name ?? loadedPlayer.playerName ?? loadedPlayer.PlayerName,
                ),
                overall: toFormValue(loadedPlayer.overall ?? loadedPlayer.Overall),
                imageUrl: toFormValue(
                  loadedPlayer.imageUrl ??
                    loadedPlayer.ImageUrl ??
                    loadedPlayer.photoUrl ??
                    loadedPlayer.PhotoUrl,
                ),
                position: toFormValue(
                  loadedPlayer.position ?? loadedPlayer.Position ?? loadedPlayer.role ?? loadedPlayer.Role,
                ),
                team: toFormValue(
                  loadedPlayer.team ?? loadedPlayer.Team ?? loadedPlayer.club ?? loadedPlayer.Club,
                ),
                nationality: toFormValue(
                  loadedPlayer.nationality ??
                    loadedPlayer.Nationality ??
                    loadedPlayer.country ??
                    loadedPlayer.Country,
                ),
                age: toFormValue(loadedPlayer.age ?? loadedPlayer.Age),
                height: toFormValue(loadedPlayer.height ?? loadedPlayer.Height),
                weight: toFormValue(loadedPlayer.weight ?? loadedPlayer.Weight),
                pace: toFormValue(
                  loadedPlayer.pace ?? loadedPlayer.Pace ?? loadedPlayer.speed ?? loadedPlayer.Speed,
                ),
                shooting: toFormValue(
                  loadedPlayer.shooting ??
                    loadedPlayer.Shooting ??
                    loadedPlayer.finishing ??
                    loadedPlayer.Finishing,
                ),
                passing: toFormValue(loadedPlayer.passing ?? loadedPlayer.Passing),
                dribbling: toFormValue(loadedPlayer.dribbling ?? loadedPlayer.Dribbling),
                defense: toFormValue(
                  loadedPlayer.defense ??
                    loadedPlayer.Defense ??
                    loadedPlayer.defending ??
                    loadedPlayer.Defending,
                ),
                physical: toFormValue(
                  loadedPlayer.physical ??
                    loadedPlayer.Physical ??
                    loadedPlayer.physicality ??
                    loadedPlayer.Physicality,
                ),
              }));

              const knownKeys = new Set([
                ...Object.keys(baseFormValues),
                "Name",
                "name",
                "PlayerName",
                "playerName",
                "Overall",
                "overall",
                "ImageUrl",
                "imageUrl",
                "PhotoUrl",
                "photoUrl",
                "Position",
                "position",
                "Role",
                "role",
                "Team",
                "team",
                "Club",
                "club",
                "Nationality",
                "nationality",
                "Country",
                "country",
                "Age",
                "age",
                "Height",
                "height",
                "Weight",
                "weight",
                "Pace",
                "pace",
                "Speed",
                "speed",
                "Shooting",
                "shooting",
                "Finishing",
                "finishing",
                "Passing",
                "passing",
                "Dribbling",
                "dribbling",
                "Defense",
                "defense",
                "Defending",
                "defending",
                "Physical",
                "physical",
                "Physicality",
                "physicality",
              ]);

              setExtraFields(
                Object.entries(loadedPlayer)
                  .filter(
                    ([key, value]) =>
                      !knownKeys.has(key) &&
                      value !== null &&
                      value !== undefined &&
                      typeof value !== "object",
                  )
                  .map(([key, value]) => ({
                    key,
                    label: formatFieldLabel(key),
                    type: typeof value === "number" ? "number" : "text",
                  })),
              );

              setPlayer((currentPlayer) => ({
                ...currentPlayer,
                ...Object.fromEntries(
                  Object.entries(loadedPlayer)
                    .filter(
                      ([key, value]) =>
                        !knownKeys.has(key) &&
                        value !== null &&
                        value !== undefined &&
                        typeof value !== "object",
                    )
                    .map(([key, value]) => [key, toFormValue(value)]),
                ),
              }));
            }
          } catch (requestError) {
            if (mounted) {
              setError(
                requestError.response?.data?.message ||
                  requestError.response?.data?.title ||
                  "Nao foi possivel carregar o player para edicao.",
              );
            }
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    prepareForm();

    return () => {
      mounted = false;
    };
  }, [id, mode]);

  function handleChange(field, value) {
    setPlayer((currentPlayer) => ({
      ...currentPlayer,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = buildPlayerPayload(
      {
        ...player,
        name: player.name.trim(),
      },
      originalPlayer,
      templatePlayer,
    );

    try {
      if (mode === "edit" && id) {
        await api.put(`/api/players/${id}`, payload);
        navigate(`/players/${id}`, { replace: true });
      } else {
        const response = await api.post("/api/players", payload);
        const createdId = response.data?.id;
        navigate(createdId ? `/players/${createdId}` : "/players", {
          replace: true,
        });
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.title ||
          "Nao foi possivel salvar o player.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card">Carregando formulario...</div>;
  }

  return (
    <section className="page-grid">
      <form className="card" onSubmit={handleSubmit}>
        <div className="section-heading">
          <h2>{mode === "edit" ? "Editar player" : "Novo player"}</h2>
          <p>
            {mode === "edit"
              ? "Atualize os dados e envie para `PUT /api/players/{id}`."
              : "Preencha os campos para criar um novo player com `POST /api/players`."}
          </p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {fieldGroups.map((group) => (
          <section key={group.title} className="form-section">
            <h3>{group.title}</h3>
            <div className="form-grid">
              {group.fields.map((field) => (
                <label key={field.key} className="field">
                  <span>{field.label}</span>
                  <input
                    type={field.type}
                    value={player[field.key] ?? ""}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </label>
              ))}
            </div>
          </section>
        ))}

        {extraFields.length > 0 ? (
          <section className="form-section">
            <h3>Campos adicionais detectados na API</h3>
            <div className="form-grid">
              {extraFields.map((field) => (
                <label key={field.key} className="field">
                  <span>{field.label}</span>
                  <input
                    type={field.type}
                    value={player[field.key] ?? ""}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>
        ) : null}

        <div className="card-row">
          <Link to="/" className="secondary-button">
            Home
          </Link>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>

          <Link
            to={mode === "edit" && id ? `/players/${id}` : "/players"}
            className="secondary-button"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}

export default PlayerFormPage;
