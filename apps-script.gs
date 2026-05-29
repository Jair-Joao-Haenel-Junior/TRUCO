/*
  Google Apps Script para gravar as partidas no Google Sheets.

  Como usar:
  1. Crie uma planilha no Google Sheets.
  2. Vá em Extensões > Apps Script.
  3. Cole este código no arquivo Code.gs.
  4. Clique em Implantar > Nova implantação > App da Web.
  5. Em "Executar como", escolha "Eu".
  6. Em "Quem pode acessar", escolha "Qualquer pessoa".
  7. Copie a URL terminada em /exec e cole no app web.
*/

// Se o script estiver vinculado à planilha, pode deixar vazio.
// Se for um script separado, cole o ID da planilha aqui.
const SPREADSHEET_ID = "";

const SHEET_PARTIDA = "Partida";
const SHEET_TIMES = "Times";

const HEADERS_PARTIDA = ["ID", "Data", "Tipo", "Time_vencedor"];
const HEADERS_TIMES = ["ID", "Id_partida", "Nomes", "Time", "Pontos"];

function doGet() {
  const spreadsheet = getSpreadsheet_();
  setupSheets_(spreadsheet);

  return jsonResponse_({
    sucesso: true,
    mensagem: "API do contador de pontos ativa.",
    planilha: spreadsheet.getName(),
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const dados = parseRequest_(e);
    validatePayload_(dados);

    const spreadsheet = getSpreadsheet_();
    const sheets = setupSheets_(spreadsheet);

    const idPartida = Utilities.getUuid();
    const dataPartida = dados.data ? new Date(dados.data) : new Date();

    sheets.partida.appendRow([
      idPartida,
      dataPartida,
      dados.tipo,
      dados.time_vencedor,
    ]);

    dados.times.forEach((time) => {
      const nomes = Array.isArray(time.nomes) ? time.nomes.join(" / ") : String(time.nomes || "");

      sheets.times.appendRow([
        Utilities.getUuid(),
        idPartida,
        nomes,
        time.time,
        Number(time.pontos || 0),
      ]);
    });

    return jsonResponse_({
      sucesso: true,
      idPartida,
    });
  } catch (error) {
    return jsonResponse_({
      sucesso: false,
      erro: error.message,
    });
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error("Nenhuma planilha ativa encontrada. Cole o ID da planilha na constante SPREADSHEET_ID.");
  }

  return active;
}

function setupSheets_(spreadsheet) {
  const partida = getOrCreateSheet_(spreadsheet, SHEET_PARTIDA, HEADERS_PARTIDA);
  const times = getOrCreateSheet_(spreadsheet, SHEET_TIMES, HEADERS_TIMES);

  return { partida, times };
}

function getOrCreateSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = headers.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Requisição sem corpo.");
  }

  return JSON.parse(e.postData.contents);
}

function validatePayload_(dados) {
  if (!dados) {
    throw new Error("Dados inválidos.");
  }

  if (!["Individual", "Dupla", "Trio"].includes(dados.tipo)) {
    throw new Error("Tipo inválido. Use Individual, Dupla ou Trio.");
  }

  if (!["A", "B"].includes(dados.time_vencedor)) {
    throw new Error("Time vencedor inválido. Use A ou B.");
  }

  if (!Array.isArray(dados.times) || dados.times.length !== 2) {
    throw new Error("Informe exatamente 2 times.");
  }

  dados.times.forEach((time) => {
    if (!["A", "B"].includes(time.time)) {
      throw new Error("O campo Time deve ser A ou B.");
    }

    if (time.pontos === undefined || time.pontos === null || Number.isNaN(Number(time.pontos))) {
      throw new Error("Pontos inválidos.");
    }
  });
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
