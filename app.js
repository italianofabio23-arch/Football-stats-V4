document.addEventListener("DOMContentLoaded", () => {

  const app = document.createElement("div");

  app.innerHTML = `
    <h2>⚽ Partite di oggi</h2>

    <div style="margin-bottom:15px;">
      <label>Data:</label>
      <input type="date" id="date">
      <button id="loadBtn">Aggiorna</button>
      <button id="topOnlyBtn">🔥 Solo TOP ≥80%</button>
    </div>
<div id="betSlip"></div>
    <div id="status">Pronto</div>
    <div id="matches"></div>
  `;

  document.body.appendChild(app);

  const dateInput = document.getElementById("date");
  const loadBtn = document.getElementById("loadBtn");
  const topOnlyBtn = document.getElementById("topOnlyBtn");
  const status = document.getElementById("status");
  const matches = document.getElementById("matches");
  const betSlip = document.getElementById("betSlip");
const standingsCache = {};
  let topOnly = false;
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
betSlip.innerHTML = "";
   const betSlipPicks = [];
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
      let visibleCount = 0;

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
          const leagueId = game.league?.id;
const season = game.league?.season;
const standingsKey = `${leagueId}-${season}`;

let standings = standingsCache[standingsKey] || [];

if (leagueId && season && !standingsCache[standingsKey]) {
  const r = await fetch(
    "https://football-stats-v3.onrender.com/api/football?path=/standings&league=" +
    leagueId +
    "&season=" +
    season
  );

  if (r.ok) {
    const standingsData = await r.json();
    standings = standingsData.standings?.[0]?.table || [];
  }

  standingsCache[standingsKey] = standings;
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
      if (isPrematch && topMarkets.length > 0) {
  betSlipPicks.push({
    home: home,
    away: away,
    market: topMarkets[0].name,
    value: topMarkets[0].value
  });
    } 
        const hi = (v) =>
  v >= 80
    ? `<span style="color:#ef4444;font-weight:800;">${v}%</span>`
    : v >= 70
      ? `<span style="color:#f59e0b;font-weight:800;">${v}%</span>`
      : `${v}%`;
        card.style.cssText = 
          "border:1px solid #334155;background:#111c30;padding:16px;margin:14px 0;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,0.25);line-height:1.5;";
          

      card.innerHTML = `
  <div style="font-size:13px;opacity:0.75;margin-bottom:5px;">
    ${competition}
  </div>

  <div style="font-size:20px;font-weight:bold;margin-bottom:6px;">
    ${home} - ${away}
  </div>

  <div style="margin-bottom:12px;">
    🕒 ${time}
    ${score ? ` &nbsp; ⚽ ${score}` : ""}
  </div>

  <div style="font-size:12px;opacity:0.65;margin-bottom:12px;">
    🔎 League ID: ${game.league?.id || "N/D"} |
    Home ID: ${game.teams?.home?.id || "N/D"} |
    Away ID: ${game.teams?.away?.id || "N/D"}
  </div>

  ${isPrematch ? `
    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:8px;">
      <b>⚽ xG</b><br>
      Casa: ${xgHome.toFixed(2)} &nbsp;&nbsp; Trasferta: ${xgAway.toFixed(2)}
    </div>

    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;">
      <b>🛡️ DOPPIA CHANCE</b><br>
      1X: ${hi(doubleChance1X)} &nbsp;&nbsp;
X2: ${hi(doubleChanceX2)} &nbsp;&nbsp;
12: ${hi(doubleChance12)}
    </div>

    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;">
      <b>⚽ OVER / UNDER 1.5</b><br>
      Over 1.5: ${hi(over15Prob)}<br>
Under 1.5: ${hi(under15Prob)}
    </div>

    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;">
      <b>🎯 OVER / UNDER 2.5</b><br>
      Over 2.5: ${hi(over25Prob)}<br>
Under 2.5: ${hi(under25Prob)}
    </div>

    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;">
      <b>🤝 GG / NG</b><br>
      GG: ${hi(ggProb)} &nbsp;&nbsp;
NG: ${hi(ngProb)}
    </div>

    ${topMarkets.length > 0 ? `
      <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;font-weight:bold;">
        🔥 TOP ≥80%:
        ${topMarkets.map(m => `${m.name} ${m.value}%`).join(" | ")}
      </div>
    ` : ""}

    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;">
      <b>📊 PRONOSTICO PRE-MATCH</b><br>
      1: ${hi(prediction.home)} &nbsp;&nbsp;
X: ${hi(prediction.draw)} &nbsp;&nbsp;
2: ${hi(prediction.away)}
    </div>
  ` : `
    <div style="border-top:1px solid #334155;padding-top:10px;margin-top:10px;">
      ⏱️ Pronostico non disponibile (partita iniziata/terminata)
    </div>
  `}
`;
if (topOnly && topMarkets.length === 0) continue;
        visibleCount++;
        matches.appendChild(card);
      }
status.textContent = "Partite trovate: " + visibleCount;
  const proposedPicks = betSlipPicks
  .sort((a, b) => b.value - a.value)
  .slice(0, 4);

if (proposedPicks.length >= 3) {
  betSlip.innerHTML = `
    <div style="border:1px solid #f59e0b;background:#172033;padding:16px;margin:18px 0;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,0.25);line-height:1.5;">
      <h3 style="margin:0 0 14px 0;font-size:21px;color:#fbbf24;">🔥 SCHEDINA TOP ≥80% PROPOSTA</h3>
      ${proposedPicks.map((pick, index) => `
        <div style="padding:10px 0;">
          <b>${index + 1}. ${pick.home} - ${pick.away}</b><br>
          <span style="font-size:17px;color:#fbbf24;font-weight:bold;">${pick.market} — ${pick.value}%</span>
        </div>
      `).join("<hr>")}
    </div>
  `;
} else {
  betSlip.innerHTML = "<b>🔥 Nessuna schedina TOP da almeno 3 eventi disponibile.</b>";
}
    } catch (error) {
      console.error(error);
      status.textContent = "❌ " + error.message;
    }
  }

  loadBtn.addEventListener("click", loadMatches);
  topOnlyBtn.addEventListener("click", () => {
  topOnly = !topOnly;
  topOnlyBtn.textContent = topOnly ? "⚽ Mostra tutte" : "🔥 Solo TOP ≥80%";
  loadMatches();
});
  loadMatches();

});
// ===== V4 - INIZIO ANALISI STATISTICHE =====
console.log("Modulo analisi V4 pronto");
// ===== V4 - FINE ANALISI STATISTICHE =====

// ===== AVVISO LIVE NELLA V4 =====
(function () {
  const liveButton = document.querySelector(".live-btn");
  if (!liveButton) return;

  const LIVE_URL =
    "https://football-stats-v3.onrender.com/api/live-goal";

  async function checkLiveGoalAlert() {
    try {
      const r = await fetch(LIVE_URL);
      if (!r.ok) throw new Error("LIVE non disponibile");

      const data = await r.json();
      const matches = Array.isArray(data.matches) ? data.matches : [];

      const alerts = matches.filter(
        match => Number(match.liveIndex || 0) >= 80
      );

      if (alerts.length > 0) {
        liveButton.classList.add("has-live-alert");
        liveButton.innerHTML =
          `🔴 LIVE GOL 20'-45' • ${alerts.length} ALERT`;
      } else {
        liveButton.classList.remove("has-live-alert");
        liveButton.innerHTML = "🔴 LIVE GOL 20'-45'";
      }

    } catch (error) {
      console.error("Controllo LIVE V4:", error);
      liveButton.classList.remove("has-live-alert");
      liveButton.innerHTML = "🔴 LIVE GOL 20'-45'";
    }
  }

  checkLiveGoalAlert();

  setInterval(checkLiveGoalAlert, 60000);
})();
