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
        "https://api.football-data.org/v4/matches?dateFrom=" +
        date +
        "&dateTo=" +
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

      const games = data.matches || [];

      status.textContent = "Partite trovate: " + games.length;

      if (
