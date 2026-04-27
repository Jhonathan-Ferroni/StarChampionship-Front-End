// File: src/pages/PlayerForm.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import {
  buildPlayerPayload,
  formatFieldLabel,
  isOmittedPlayerField,
  normalizePlayers,
  toFormValue,
} from "../utils/playerData";

const fieldGroups = [
  {
    title: "Basico",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
        placeholder: "Nome do player",
      },
      {
        key: "imageUrl",
        label: "Image URL",
        type: "url",
        placeholder: "https://...",
      },
    ],
  },
  {
    title: "Tecnica",
    fields: [
      { key: "shoot", label: "Shoot", type: "number" },
      { key: "dribble", label: "Dribble", type: "number" },
      { key: "firstTouch", label: "First Touch", type: "number" },
      { key: "ballControl", label: "Ball Control", type: "number" },
      { key: "pass", label: "Pass", type: "number" },
    ],
  },
  {
    title: "Atributos",
    fields: [
      { key: "speed", label: "Speed", type: "number" },
      { key: "defense", label: "Defense", type: "number" },
      { key: "strength", label: "Strength", type: "number" },
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
                  Object.keys(baseFormValues).map((key) => [
                    key,
                    toFormValue(loadedPlayer[key]),
                  ]),
                ),
                name: toFormValue(
                  loadedPlayer.name ??
                    loadedPlayer.Name ??
                    loadedPlayer.playerName ??
                    loadedPlayer.PlayerName,
                ),
                overall: toFormValue(
                  loadedPlayer.overall ?? loadedPlayer.Overall,
                ),
                imageUrl: toFormValue(
                  loadedPlayer.imageUrl ??
                    loadedPlayer.ImageUrl ??
                    loadedPlayer.photoUrl ??
                    loadedPlayer.PhotoUrl,
                ),
                shoot: toFormValue(
                  loadedPlayer.shoot ??
                    loadedPlayer.Shoot ??
                    loadedPlayer.shooting ??
                    loadedPlayer.Shooting ??
                    loadedPlayer.finishing ??
                    loadedPlayer.Finishing,
                ),
                dribble: toFormValue(
                  loadedPlayer.dribble ??
                    loadedPlayer.Dribble ??
                    loadedPlayer.dribbling ??
                    loadedPlayer.Dribbling,
                ),
                firstTouch: toFormValue(
                  loadedPlayer.firstTouch ?? loadedPlayer.FirstTouch,
                ),
                ballControl: toFormValue(
                  loadedPlayer.ballControl ?? loadedPlayer.BallControl,
                ),
                pass: toFormValue(
                  loadedPlayer.pass ??
                    loadedPlayer.Pass ??
                    loadedPlayer.passing ??
                    loadedPlayer.Passing,
                ),
                speed: toFormValue(
                  loadedPlayer.speed ??
                    loadedPlayer.Speed ??
                    loadedPlayer.pace ??
                    loadedPlayer.Pace,
                ),
                defense: toFormValue(
                  loadedPlayer.defense ??
                    loadedPlayer.Defense ??
                    loadedPlayer.defending ??
                    loadedPlayer.Defending,
                ),
                strength: toFormValue(
                  loadedPlayer.strength ??
                    loadedPlayer.Strength ??
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
                "Shoot",
                "shoot",
                "Dribble",
                "dribble",
                "FirstTouch",
                "firstTouch",
                "BallControl",
                "ballControl",
                "Pass",
                "pass",
                "Speed",
                "speed",
                "Defense",
                "defense",
                "Defending",
                "defending",
                "Strength",
                "strength",
              ]);

              setExtraFields(
                Object.entries(loadedPlayer)
                  .filter(
                    ([key, value]) =>
                      !isOmittedPlayerField(key) &&
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
                        !isOmittedPlayerField(key) &&
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

    delete payload.id;
    delete payload.Id;

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

        {mode === "edit" && id ? (
          <div className="inline-badge">ID do player: {id}</div>
        ) : null}

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
                    onChange={(event) =>
                      handleChange(field.key, event.target.value)
                    }
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
                    onChange={(event) =>
                      handleChange(field.key, event.target.value)
                    }
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
