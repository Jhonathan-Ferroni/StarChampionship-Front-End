import React from "react";
import PlayersList from "./components/PlayersList";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>StarChampionship</h1>
      <hr />
      <PlayersList />
    </div>
  );
}

export default App;
