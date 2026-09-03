const BACKEND = "https://football-stats-v3.onrender.com";

const REFRESH_MS = 60000; // 1 minuto

const liveAlert = document.getElementById("liveAlert");
const liveMatches = document.getElementById("liveMatches");
const liveTotalEl = document.getElementById("liveTotal");
const window2045El = document.getElementById("window2045");
const alerts80El = document.getElementById("alerts80");
function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function renderMatch(match) {
  const stats = match.stats || {};

  const elapsed = safeNumber(match.elapsed);
  const index = safeNumber(match.liveIndex);

  let level = "🟢 OSSERVAZIONE";

  if (index >= 80) {
    level = "🔴 ALERT GOL";
  } else if (index >= 70) {
    level = "🟠 PRE-ALERT";
  }

  return `
    <div class="live-card">

      <div class="live-league">
        ${esc(match.league?.name || "Campionato")}
      </div>

      <h3>
        ${esc(match.home?.name || "Casa")}
        -
        ${esc(match.away?.name || "Trasferta")}
      </h3>

      <div class="live-score">
        ⏱️ ${elapsed}'
        &nbsp;&nbsp;
        ⚽ ${safeNumber(match.goals?.home)}
        -
        ${safeNumber(match.goals?.away)}
      </div>

      <hr>

      <div class="live-stat">
        🎯 Tiri in porta:
        <strong>
          ${safeNumber(stats.shotsOnGoalHome)}
          -
          ${safeNumber(stats.shotsOnGoalAway)}
        </strong>
      </div>

      <div class="live-stat">
        🥅 Tiri totali:
        <strong>
          ${safeNumber(stats.totalShotsHome)}
          -
          ${safeNumber(stats.totalShotsAway)}
        </strong>
      </div>

      <div class="live-stat">
        🚩 Corner:
        <strong>
          ${safeNumber(stats.cornersHome)}
          -
          ${safeNumber(stats.cornersAway)}
        </strong>
      </div>

      <div class="live-stat">
        🟨 Cartellini:
        <strong>
          ${safeNumber(stats.yellowHome)}
          -
          ${safeNumber(stats.yellowAway)}
        </strong>
      </div>

      <hr>

      <div class="live-index">
        ${level}
      </div>

      <div class="live-index-number">
        ⚽ Indice GOL LIVE:
        <strong>${index}/100</strong>
      </div>

      <div class="live-note">
        Finestra analizzata: 20'–45' primo tempo
      </div>

    </div>
  `;
}

async function loadLive() {
  try {
    liveAlert.textContent =
      "🔴 LIVE — aggiornamento partite in corso...";

    const response = await fetch(
      `${BACKEND}/api/live-goal`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
if (liveTotalEl) liveTotalEl.textContent = safeNumber(data.liveTotal);
if (window2045El) window2045El.textContent = safeNumber(data.window2045);
if (alerts80El) alerts80El.textContent = safeNumber(data.alerts80);
    let matches = Array.isArray(data.matches)
      ? data.matches
      : [];

    // Sicurezza aggiuntiva anche lato V4:
    // solo primo tempo tra 20' e 45'
    matches = matches.filter(match => {
      const minute = safeNumber(match.elapsed);

      return (
        match.status === "1H" &&
        minute >= 20 &&
        minute <= 45
      );
    });

    matches.sort(
      (a, b) =>
        safeNumber(b.liveIndex) -
        safeNumber(a.liveIndex)
    );

    const alerts = matches.filter(
      match => safeNumber(match.liveIndex) >= 80
    );

    if (alerts.length > 0) {
      liveAlert.classList.add("live-active");

      liveAlert.innerHTML =
  `<span class="live-dot"></span> LIVE GOL — ${alerts.length} ` +
  `${alerts.length === 1 ? "AVVISO" : "AVVISI"}`;
} else {
  liveAlert.classList.remove("live-active");

  liveAlert.innerHTML =
    `<span class="live-dot idle"></span> LIVE — nessun alert ≥80 al momento`;
    }

    if (!matches.length) {
      liveMatches.innerHTML = `
        <div class="live-card">
          Nessuna partita tra il 20° e il 45°
          del primo tempo in questo momento.
        </div>
      `;

      return;
    }

    liveMatches.innerHTML =
      matches.map(renderMatch).join("");

  } catch (error) {
    console.error("Errore LIVE:", error);

    liveAlert.classList.remove("live-active");

    liveAlert.textContent =
      "❌ LIVE temporaneamente non disponibile";

    liveMatches.innerHTML = `
      <div class="live-card">
        ${esc(error.message)}
      </div>
    `;
  }
}

loadLive();

setInterval(loadLive, REFRESH_MS);
