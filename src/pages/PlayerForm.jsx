// File: src/pages/PlayerForm.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toFormValue } from "../utils/playerData";

const fieldGroups = [
  {
    title: "Básico",
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
    title: "Técnica",
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

// Inicia o estado do formulário apenas com as chaves exatas mapeadas
const baseFormValues = fieldGroups
  .flatMap((group) => group.fields)
  .reduce((accumulator, field) => ({ ...accumulator, [field.key]: "" }), {});

function PlayerFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(baseFormValues);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlayer() {
      if (mode === "edit" && id) {
        try {
          const response = await api.get(`/api/players/${id}`);
          const loadedPlayer = response.data ?? {};

          if (mounted) {
            // Mapeia estritamente os campos do C# (lidando com as variações de PascalCase e camelCase)
            setPlayer({
              name: toFormValue(loadedPlayer.name ?? loadedPlayer.Name),
              imageUrl: toFormValue(
                loadedPlayer.imageUrl ?? loadedPlayer.ImageUrl,
              ),
              shoot: toFormValue(loadedPlayer.shoot ?? loadedPlayer.Shoot),
              dribble: toFormValue(
                loadedPlayer.dribble ?? loadedPlayer.Dribble,
              ),
              firstTouch: toFormValue(
                loadedPlayer.firstTouch ?? loadedPlayer.FirstTouch,
              ),
              ballControl: toFormValue(
                loadedPlayer.ballControl ?? loadedPlayer.BallControl,
              ),
              pass: toFormValue(loadedPlayer.pass ?? loadedPlayer.Pass),
              speed: toFormValue(loadedPlayer.speed ?? loadedPlayer.Speed),
              defense: toFormValue(
                loadedPlayer.defense ?? loadedPlayer.Defense,
              ),
              strength: toFormValue(
                loadedPlayer.strength ?? loadedPlayer.Strength,
              ),
            });
          }
        } catch (requestError) {
          if (mounted) {
            setError(
              requestError.response?.data?.message ||
                requestError.response?.data?.title ||
                "Não foi possível carregar o player para edição.",
            );
          }
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    loadPlayer();

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

    // Constrói o payload estrito garantindo que apenas os campos do modelo sejam enviados
    // e convertendo os atributos numéricos corretamente. O Overall é omitido pois é calculado na API.
    const payload = {
      name: player.name.trim(),
      imageUrl: player.imageUrl || null,
      shoot: Number(player.shoot) || 0,
      dribble: Number(player.dribble) || 0,
      firstTouch: Number(player.firstTouch) || 0,
      ballControl: Number(player.ballControl) || 0,
      pass: Number(player.pass) || 0,
      speed: Number(player.speed) || 0,
      defense: Number(player.defense) || 0,
      strength: Number(player.strength) || 0,
    };

    try {
      if (mode === "edit" && id) {
        // Se a API exigir o ID no corpo do PUT, adicione: payload.id = id;
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
          "Não foi possível salvar o player.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card">Carregando formulário...</div>;
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
