document.addEventListener("DOMContentLoaded", () => {

  const app = document.createElement("div");

  app.innerHTML = `
    <h2>⚽ Partite di oggi</h2>

    <div style="margin-bottom:15px;">
      <label>Data:</label>
      <input type="date" id="date">
      <button id="loadBtn">Aggiorna</button>
    </div>

    <div id="status">Pronto</div>
    <div id="matches"></div>
  `;

  document.body.appendChild(app);

  const dateInput = document.getElementById("date");
  const loadBtn = document.getElementById("loadBtn");
  const status = document.getElementById("status");
  const matches = document.getElementById("matches");

  const today = new Date();
  dateInput.value =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  async function loadMatches() {

    status.textContent = "⏳ Caricamento partite...";
    matches.innerHTML = "";

    try {

      const date = dateInput.value;

      const response = await fetch(
  "https://football-stats-v3.onrender.com/api/football?path=/fixtures&date=" +
  date
);

      if (!response.ok) {
        throw new Error(
          "Errore API: " +
          response.status +
          " " +
          response.statusText
        );
      }

      const data = await response.json();

      const games = data.response || [];

      status.textContent = "Partite trovate: " + games.length;

            if (games.length === 0) {
        matches.innerHTML = "<p>Nessuna partita trovata.</p>";
        return;
      }

      games.forEach(game => {
      const home = game.teams?.home?.name || "Casa";
      const away = game.teams?.away?.name || "Trasferta";
      const competition = game.league?.name || "";

        const time = game.fixture?.date
  ? new Date(game.fixture.date).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    })
  : "";
const homeGoals = game.goals?.home;
const awayGoals = game.goals?.away;
const score = homeGoals != null && awayGoals != null
  ? `${homeGoals} - ${awayGoals}`
  : "";
        const homeId = game.teams?.home?.id;
const awayId = game.teams?.away?.id;
const fixtureId = game.fixture?.id;
    const leagueCode = game.league?.code; 
        let prediction = {
  home: 0,
  draw: 0,
  away: 0
};

if (leagueCode && homeId && awayId) {
  try {
    const standingsResponse = await fetch(
      "https://football-stats-v3.onrender.com/api/football/competitions/" +
      leagueCode +
      "/standings"
    );

    if (standingsResponse.ok) {
      const standingsData = await standingsResponse.json();
      const table = standingsData?.standings?.[0]?.table || [];

      const homeTeam = table.find(t => t.team?.id === homeId);
      const awayTeam = table.find(t => t.team?.id === awayId);

      if (homeTeam && awayTeam) {
        const homeStrength = Math.max(
          1,
          (homeTeam.points || 0) +
          (homeTeam.goalDifference || 0) +
          5
        );

        const awayStrength = Math.max(
          1,
          (awayTeam.points || 0) +
          (awayTeam.goalDifference || 0)
        );

        const totalStrength = homeStrength + awayStrength;

        prediction.draw = 25;
        prediction.home = Math.round(
          (homeStrength / totalStrength) * 75
        );

        prediction.home = Math.max(
          10,
          Math.min(70, prediction.home)
        );

        prediction.away =
          100 - prediction.home - prediction.draw;
      }
    }
  } catch (e) {
    console.error("Errore classifica:", e);
  }
}
        const card = document.createElement("div");

        card.style.cssText =
          "border:1px solid #ccc;padding:12px;margin:10px 0;border-radius:8px;";

        card.innerHTML = `
          <small>${competition}</small><br>
          <strong>${home} - ${away}</strong><br>
          🕒 ${time}
          ${score ? `<br>⚽ ${score}` : ""}
          <br><br>
<b>📊 Analisi:</b><br>
1: ${prediction.home}% &nbsp; X: ${prediction.draw}% &nbsp; 2: ${prediction.away}%
        `;

        matches.appendChild(card);
      });

    } catch (error) {
      console.error(error);
      status.textContent = "❌ " + error.message;
    }
  }

  loadBtn.addEventListener("click", loadMatches);
  loadMatches();

});
// ===== V4 - INIZIO ANALISI STATISTICHE =====
console.log("Modulo analisi V4 pronto");
// ===== V4 - FINE ANALISI STATISTICHE =====
