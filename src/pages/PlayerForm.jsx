// File: src/pages/PlayerForm.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const defaultPlayer = {
  name: "",
  overall: "",
};

function PlayerFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(defaultPlayer);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !id) {
      return undefined;
    }

    let mounted = true;

    async function fetchPlayer() {
      try {
        const response = await api.get(`/api/players/${id}`);

        if (mounted) {
          setPlayer({
            ...response.data,
            name: response.data.name ?? response.data.playerName ?? "",
            overall: response.data.overall ?? "",
          });
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.response?.data?.message ||
              requestError.response?.data?.title ||
              "Nao foi possivel carregar o player para edicao.",
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
  }, [id, mode]);

  function handleChange(field, value) {
    setPlayer((currentPlayer) => ({
      ...currentPlayer,
      [field]: field === "overall" ? value.replace(/[^\d]/g, "") : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...player,
      name: player.name.trim(),
      overall: player.overall === "" ? null : Number(player.overall),
    };

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

        <label className="field">
          <span>Nome</span>
          <input
            type="text"
            value={player.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="Nome do player"
            required
          />
        </label>

        <label className="field">
          <span>Overall</span>
          <input
            type="text"
            value={player.overall}
            onChange={(event) => handleChange("overall", event.target.value)}
            placeholder="Ex.: 87"
          />
        </label>

        <div className="card-row">
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
