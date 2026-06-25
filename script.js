function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // CASO 1: CADASTRO DE USUÁRIO
    if (data.action === "register") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usuarios");
      sheet.appendRow([data.nome, data.matricula, data.email, data.senha]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // CASO 2: CADASTRO DE PRODUTO
    if (data.action === "add") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Produtos");
      var id = Utilities.getUuid();
      sheet.appendRow([id, data.produto, data.validade]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // CASO 1: LOGIN DO USUÁRIO
  if (action === "login") {
    var sheet = ss.getSheetByName("Usuarios");
    var rows = sheet.getDataRange().getValues();
    var emailInput = e.parameter.email;
    var senhaInput = e.parameter.senha;
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][2].toString().toLowerCase() === emailInput.toLowerCase() && rows[i][3].toString() === senhaInput) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          user: { nome: rows[i][0], matricula: rows[i][1] }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Credenciais incorretas."})).setMimeType(ContentService.MimeType.JSON);
  }
  
  // CASO 2: RECUPERAÇÃO DE SENHA (Busca e mostra os dados na tela)
  if (action === "recover") {
    var sheet = ss.getSheetByName("Usuarios");
    var rows = sheet.getDataRange().getValues();
    var emailInput = e.parameter.email;
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][2].toString().toLowerCase() === emailInput.toLowerCase()) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Sua matrícula é: " + rows[i][1] + " e sua senha é: " + rows[i][3]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "E-mail não encontrado no sistema."})).setMimeType(ContentService.MimeType.JSON);
  }
  
  // CASO 3: BUSCAR PRODUTOS
  if (action === "getProducts") {
    var sheet = ss.getSheetByName("Produtos");
    var rows = sheet.getDataRange().getValues();
    var produtos = [];
    
    for (var i = 1; i < rows.length; i++) {
      var dataValidade = (rows[i][2] instanceof Date) ? Utilities.formatDate(rows[i][2], Session.getScriptTimeZone(), "yyyy-MM-dd") : rows[i][2];
      produtos.push({ id: rows[i][0], produto: rows[i][1], validade: dataValidade });
    }
    return ContentService.createTextOutput(JSON.stringify(produtos)).setMimeType(ContentService.MimeType.JSON);
  }
}
