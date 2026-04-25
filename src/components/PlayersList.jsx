import React, { useState, useEffect } from "react";
import api from "../services/api";
import { formatOverall } from "../utils/playerData";

function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get("/Players")
      .then((response) => {
        setPlayers(response.data);
        setErrorMessage("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar jogadores:", error);
        setErrorMessage(
          error.response?.data?.message ??
            error.message ??
            "Nao foi possivel carregar os jogadores."
        );
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Carregando jogadores...</p>;
  }

  if (errorMessage) {
    return <p>Erro ao carregar jogadores: {errorMessage}</p>;
  }

  return (
    <div>
      <h2>Elenco Atual</h2>
      {players.length === 0 ? (
        <p>Nenhum jogador cadastrado no banco de dados.</p>
      ) : (
        <ul>
          {players.map((player) => (
            <li key={player.id}>
              <strong>{player.name}</strong> - Overall: {formatOverall(player.overall)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlayersList;
