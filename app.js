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
1: --% &nbsp; X: --% &nbsp; 2: --%
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
