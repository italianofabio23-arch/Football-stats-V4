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
        const fixtureDate = game.fixture?.date ? new Date(game.fixture.date) : null;
const isPrematch = fixtureDate ? fixtureDate > new Date() : false;
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
        const homeForm = homeTeam?.form || "";
const awayForm = awayTeam?.form || "";
        const formScore = (form) => {
  const results = form.replace(/,/g, "").slice(-5);
  if (!results) return 0.5;

  let points = 0;

  for (const result of results) {
    if (result === "W") points += 3;
    else if (result === "D") points += 1;
  }

  return points / (results.length * 3);
};
        const homeFormScore = formScore(homeForm);
const awayFormScore = formScore(awayForm);
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
        const formDiff = homeFormScore - awayFormScore;
const homeFormFactor = 1 + formDiff * 0.15;
const awayFormFactor = 1 - formDiff * 0.15;

const xgHome = Math.max(
  0.20,
  leagueAvg *
    homeAttack *
    awayDefense *
    1.12 * homeFormFactor
);

const xgAway = Math.max(
  0.20,
  leagueAvg *
    awayAttack *
    homeDefense *
    0.88 * awayFormFactor
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
        let pOver15 = 0;
let pOver25 = 0;
let pGG = 0;

for (let hg = 0; hg <= 10; hg++) {
  for (let ag = 0; ag <= 10; ag++) {
    const p =
      poisson(hg, xgHome) *
      poisson(ag, xgAway);

    if (hg > ag) pHome += p;
    else if (hg === ag) pDraw += p;
    else pAway += p;
    if (hg + ag >= 2) pOver15 += p;
if (hg + ag >= 3) pOver25 += p;
if (hg > 0 && ag > 0) pGG += p;
  }
}

const totalProb = pHome + pDraw + pAway;
const over15Prob = Math.round((pOver15 / totalProb) * 100);
const over25Prob = Math.round((pOver25 / totalProb) * 100);
const ggProb = Math.round((pGG / totalProb) * 100);
        const under15Prob = 100 - over15Prob;
const under25Prob = 100 - over25Prob;
const ngProb = 100 - ggProb;
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
        const doubleChance1X = homeProb + drawProb;
const doubleChanceX2 = drawProb + awayProb;
const doubleChance12 = homeProb + awayProb;
      const topMarkets = [
  { name: "1X", value: doubleChance1X },
  { name: "X2", value: doubleChanceX2 },
  { name: "12", value: doubleChance12 },
  { name: "Over 1.5", value: over15Prob },
  { name: "Under 1.5", value: under15Prob },
  { name: "Over 2.5", value: over25Prob },
  { name: "Under 2.5", value: under25Prob },
  { name: "GG", value: ggProb },
  { name: "NG", value: ngProb }
]
.filter(market => market.value >= 80)
.sort((a, b) => b.value - a.value);
        card.style.cssText =
          "border:1px solid #ccc;padding:12px;margin:10px 0;border-radius:8px;";

        card.innerHTML = `
          <small>${competition}</small><br>
          <strong>${home} - ${away}</strong><br>
          🕒 ${time}
          ${score ? `<br>⚽ ${score}` : ""}
          <br>🔎 League ID: ${game.league?.id || "N/D"} | Home ID: ${game.teams?.home?.id || "N/D"} | Away ID: ${game.teams?.away?.id || "N/D"}
        ${isPrematch ? '<br>⚽ xG Casa: ' + xgHome.toFixed(2) + ' &nbsp; xG Trasferta: ' + xgAway.toFixed(2) : ''}
        ${isPrematch ? '<br>🛡️ Doppia Chance: 1X ' + doubleChance1X + '% &nbsp; X2 ' + doubleChanceX2 + '% &nbsp; 12 ' + doubleChance12 + '%' : ''}
      ${isPrematch ? '<br>⚽ Over 1.5: ' + over15Prob + '% &nbsp; Under 1.5: ' + under15Prob + '%<br>🎯 Over 2.5: ' + over25Prob + '% &nbsp; Under 2.5: ' + under25Prob + '%<br>🤝 GG: ' + ggProb + '% &nbsp; NG: ' + ngProb + '%' : ''}
       ${isPrematch && topMarkets.length > 0 ? '<br>🔥 TOP ≥80%: ' + topMarkets.map(m => m.name + ' ' + m.value + '%').join(' | ') : ''}
        ${isPrematch
  ? '<br><b>📊 Pronostico pre-match:</b> 1: ' + prediction.home + '% &nbsp; X: ' + prediction.draw + '% &nbsp; 2: ' + prediction.away + '%'
  : '<br><b>⏱️ Pronostico:</b> non disponibile (partita iniziata/terminata)'
        }
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
