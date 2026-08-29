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
const standingsCache = {};
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

      for (const game of games) {
        console.log("DATI PARTITA:", game);
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
        const homeId = game.teams?.home?.id;
        const awayId = game.teams?.away?.id;
        const leagueCode = game.league?.code;
        let standings = standingsCache[leagueCode];
if (!standings && leagueCode) {
  const r = await fetch("https://football-stats-v3.onrender.com/api/football?path=/standings&league=" + leagueCode);
  const data = await r.json();
  standings = data.standings?.[0]?.table || [];
  standingsCache[leagueCode] = standings;
}          
        const homeTeam = standings.find(t => t.team?.id === homeId);  
        const awayTeam = standings.find(t => t.team?.id === awayId);
        const leaguePlayed = standings.reduce(
  (sum, t) => sum + (t.playedGames ?? 0), 0
);

const leagueGoals = standings.reduce(
  (sum, t) => sum + (t.goalsFor ?? 0), 0
);

const leagueAvg =
  leaguePlayed > 0 && leagueGoals > 0
    ? leagueGoals / leaguePlayed
    : 1.35;

const priorGames = 5;

const smoothRate = (value, played) =>
  (value + leagueAvg * priorGames) /
  (played + priorGames);

const homePlayed = homeTeam?.playedGames ?? 0;
const awayPlayed = awayTeam?.playedGames ?? 0;

const homeGF = smoothRate(
  homeTeam?.goalsFor ?? 0,
  homePlayed
);

const homeGA = smoothRate(
  homeTeam?.goalsAgainst ?? 0,
  homePlayed
);

const awayGF = smoothRate(
  awayTeam?.goalsFor ?? 0,
  awayPlayed
);

const awayGA = smoothRate(
  awayTeam?.goalsAgainst ?? 0,
  awayPlayed
);

const homeAttack = homeGF / leagueAvg;
const homeDefense = homeGA / leagueAvg;
const awayAttack = awayGF / leagueAvg;
const awayDefense = awayGA / leagueAvg;

const xgHome = Math.max(
  0.20,
  leagueAvg *
    homeAttack *
    awayDefense *
    1.12
);

const xgAway = Math.max(
  0.20,
  leagueAvg *
    awayAttack *
    homeDefense *
    0.88
);

function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function poisson(k, lambda) {
  return (
    Math.exp(-lambda) *
    Math.pow(lambda, k) /
    factorial(k)
  );
}

let pHome = 0;
let pDraw = 0;
let pAway = 0;

for (let hg = 0; hg <= 10; hg++) {
  for (let ag = 0; ag <= 10; ag++) {
    const p =
      poisson(hg, xgHome) *
      poisson(ag, xgAway);

    if (hg > ag) pHome += p;
    else if (hg === ag) pDraw += p;
    else pAway += p;
  }
}

const totalProb = pHome + pDraw + pAway;

const homeProb = Math.round(
  (pHome / totalProb) * 100
);

const drawProb = Math.round(
  (pDraw / totalProb) * 100
);

const awayProb =
  100 - homeProb - drawProb;

const prediction = {
  home: homeProb,
  draw: drawProb,
  away: awayProb
};
        card.style.cssText =
          "border:1px solid #ccc;padding:12px;margin:10px 0;border-radius:8px;";

        card.innerHTML = `
          <small>${competition}</small><br>
          <strong>${home} - ${away}</strong><br>
          🕒 ${time}
          ${score ? `<br>⚽ ${score}` : ""}
          <br>🔎 League ID: ${game.league?.id || "N/D"} | Home ID: ${game.teams?.home?.id || "N/D"} | Away ID: ${game.teams?.away?.id || "N/D"}
        <br><b>📊 Pronostico:</b> 1: ${prediction.home}% &nbsp; X: ${prediction.draw}% &nbsp; 2: ${prediction.away}%
        `;

        matches.appendChild(card);
      }

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
