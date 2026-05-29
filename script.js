const setupScreen = document.getElementById("setupScreen");
const scoreScreen = document.getElementById("scoreScreen");

const gameMode = document.getElementById("gameMode");
const teamAFields = document.getElementById("teamAFields");
const teamBFields = document.getElementById("teamBFields");
const startButton = document.getElementById("startButton");

const googleScriptUrlInput = document.getElementById("googleScriptUrl");
const saveConfigButton = document.getElementById("saveConfigButton");
const configStatus = document.getElementById("configStatus");

const matchTypeLabel = document.getElementById("matchTypeLabel");

const teamAZone = document.getElementById("teamAZone");
const teamBZone = document.getElementById("teamBZone");

const teamAName = document.getElementById("teamAName");
const teamBName = document.getElementById("teamBName");
const teamAParticipants = document.getElementById("teamAParticipants");
const teamBParticipants = document.getElementById("teamBParticipants");

const teamAScore = document.getElementById("teamAScore");
const teamBScore = document.getElementById("teamBScore");

const minusAButton = document.getElementById("minusAButton");
const minusBButton = document.getElementById("minusBButton");
const backButton = document.getElementById("backButton");
const resetButton = document.getElementById("resetButton");
const finishButton = document.getElementById("finishButton");

const GOOGLE_SCRIPT_URL_KEY = "contadorPontosGoogleScriptUrl";

const modeLabels = {
  "1": "Individual",
  "2": "Dupla",
  "3": "Trio",
};

const colorPalettes = [
  { start: "#2563eb", end: "#1d4ed8" },
  { start: "#16a34a", end: "#15803d" },
  { start: "#dc2626", end: "#991b1b" },
  { start: "#9333ea", end: "#6d28d9" },
  { start: "#ea580c", end: "#c2410c" },
  { start: "#0891b2", end: "#0e7490" },
  { start: "#be123c", end: "#9f1239" },
  { start: "#4f46e5", end: "#3730a3" },
  { start: "#0f766e", end: "#115e59" },
  { start: "#a16207", end: "#854d0e" },
];

function getRandomPalette(exceptIndex = -1) {
  let index = Math.floor(Math.random() * colorPalettes.length);

  while (index === exceptIndex && colorPalettes.length > 1) {
    index = Math.floor(Math.random() * colorPalettes.length);
  }

  return { index, palette: colorPalettes[index] };
}

function applyRandomTeamColors() {
  const teamAColor = getRandomPalette();
  const teamBColor = getRandomPalette(teamAColor.index);

  document.documentElement.style.setProperty("--team-a-start", teamAColor.palette.start);
  document.documentElement.style.setProperty("--team-a-end", teamAColor.palette.end);
  document.documentElement.style.setProperty("--team-b-start", teamBColor.palette.start);
  document.documentElement.style.setProperty("--team-b-end", teamBColor.palette.end);
}

let scoreA = 0;
let scoreB = 0;
let currentMatchType = "Individual";
let currentNamesA = [];
let currentNamesB = [];

function loadSavedGoogleScriptUrl() {
  const savedUrl = localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || "";
  googleScriptUrlInput.value = savedUrl;

  if (savedUrl) {
    configStatus.textContent = "URL salva neste navegador.";
  }
}

function saveGoogleScriptUrl() {
  const url = googleScriptUrlInput.value.trim();

  if (!url) {
    localStorage.removeItem(GOOGLE_SCRIPT_URL_KEY);
    configStatus.textContent = "URL removida.";
    return;
  }

  if (!url.startsWith("https://script.google.com/macros/s/") || !url.endsWith("/exec")) {
    configStatus.textContent = "A URL parece inválida. Use a URL do Web App terminada em /exec.";
    return;
  }

  localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, url);
  configStatus.textContent = "URL salva com sucesso.";
}

function getGoogleScriptUrl() {
  return (localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || googleScriptUrlInput.value || "").trim();
}

function createParticipantFields(teamContainer, teamName, amount) {
  teamContainer.innerHTML = "";

  for (let index = 1; index <= amount; index++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `${teamName} - Participante ${index}`;
    input.dataset.team = teamName;
    input.dataset.index = String(index);
    teamContainer.appendChild(input);
  }
}

function renderParticipantFields() {
  const amount = Number(gameMode.value);
  createParticipantFields(teamAFields, "Time A", amount);
  createParticipantFields(teamBFields, "Time B", amount);
}

function getNames(container, fallbackTeamName) {
  const inputs = Array.from(container.querySelectorAll("input"));

  return inputs.map((input, index) => {
    const value = input.value.trim();
    return value || `${fallbackTeamName} P${index + 1}`;
  });
}

function updateScore() {
  teamAScore.textContent = scoreA;
  teamBScore.textContent = scoreB;
}

function changeScreen(screenName) {
  setupScreen.classList.toggle("active", screenName === "setup");
  scoreScreen.classList.toggle("active", screenName === "score");
}

function startMatch() {
  const namesA = getNames(teamAFields, "Time A");
  const namesB = getNames(teamBFields, "Time B");

  currentMatchType = modeLabels[gameMode.value];
  currentNamesA = namesA;
  currentNamesB = namesB;

  scoreA = 0;
  scoreB = 0;

  matchTypeLabel.textContent = `Partida ${currentMatchType}`;
  teamAName.textContent = namesA.join(" / ");
  teamBName.textContent = namesB.join(" / ");
  teamAParticipants.textContent = namesA.join(", ");
  teamBParticipants.textContent = namesB.join(", ");

  applyRandomTeamColors();
  updateScore();
  changeScreen("score");
}

function addPoints(team, points = 1) {
  if (team === "A") {
    scoreA += points;
  } else {
    scoreB += points;
  }

  updateScore();
}

function addPoint(team) {
  addPoints(team, 1);
}

function removePoint(team) {
  if (team === "A") {
    scoreA = Math.max(0, scoreA - 1);
  } else {
    scoreB = Math.max(0, scoreB - 1);
  }

  updateScore();
}

function resetScore() {
  scoreA = 0;
  scoreB = 0;
  updateScore();
}

function buildFinishPayload(winner) {
  return {
    data: new Date().toISOString(),
    tipo: currentMatchType,
    time_vencedor: winner,
    times: [
      {
        time: "A",
        nomes: currentNamesA,
        pontos: scoreA,
      },
      {
        time: "B",
        nomes: currentNamesB,
        pontos: scoreB,
      },
    ],
  };
}

async function sendToGoogleSheets(payload) {
  const scriptUrl = getGoogleScriptUrl();

  if (!scriptUrl) {
    throw new Error(
      "Configure a URL do Google Apps Script antes de terminar a partida. Volte para a primeira tela e cole a URL em 'Configurar gravação no Google Sheets'."
    );
  }

  // Apps Script normalmente não libera CORS para páginas externas.
  // Por isso usamos no-cors: a gravação é enviada, mas o navegador não consegue ler a resposta.
  await fetch(scriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
}

async function finishMatch() {
  if (scoreA === scoreB) {
    alert("A partida está empatada. Para gravar, precisa existir um vencedor: Time A ou Time B.");
    return;
  }

  const winner = scoreA > scoreB ? "A" : "B";
  const winnerName = winner === "A" ? "Time A" : "Time B";

  const confirmed = confirm(
    `Terminar e gravar a partida no Google Sheets?\n\nVencedor: ${winnerName}\nPlacar: Time A ${scoreA} x ${scoreB} Time B`
  );

  if (!confirmed) {
    return;
  }

  const payload = buildFinishPayload(winner);

  finishButton.disabled = true;
  finishButton.textContent = "Gravando...";

  try {
    await sendToGoogleSheets(payload);
    alert("Partida enviada para o Google Sheets. Confira a planilha para confirmar a gravação.");
    resetScore();
    changeScreen("setup");
  } catch (error) {
    alert(error.message || "Não foi possível enviar a partida para o Google Sheets.");
  } finally {
    finishButton.disabled = false;
    finishButton.textContent = "Terminar Partida";
  }
}

gameMode.addEventListener("change", renderParticipantFields);
saveConfigButton.addEventListener("click", saveGoogleScriptUrl);

startButton.addEventListener("click", startMatch);

teamAZone.addEventListener("click", () => addPoint("A"));
teamBZone.addEventListener("click", () => addPoint("B"));

teamAZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    addPoint("A");
  }
});

teamBZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    addPoint("B");
  }
});

minusAButton.addEventListener("click", (event) => {
  event.stopPropagation();
  removePoint("A");
});

minusBButton.addEventListener("click", (event) => {
  event.stopPropagation();
  removePoint("B");
});

document.querySelectorAll(".score-action-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const team = button.dataset.team;
    const points = Number(button.dataset.points);

    addPoints(team, points);
  });
});

backButton.addEventListener("click", () => changeScreen("setup"));
resetButton.addEventListener("click", resetScore);
finishButton.addEventListener("click", finishMatch);

loadSavedGoogleScriptUrl();
renderParticipantFields();
