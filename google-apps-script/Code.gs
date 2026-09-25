/**
 * =============================================================================
 * ESCALA DE LOUVOR 2K26 - GOOGLE APPS SCRIPT
 * MOTOR DE NOTIFICAÇÕES & DETECTOR DE ALTERAÇÕES DIRETAS NO GOOGLE SHEETS
 * =============================================================================
 *
 * Funcionalidades:
 * 1. API Web App (doGet / doPost) para o APP WEB
 * 2. Gatilho Instalável (onEdit / onChange) para detectar edições feitas diretamente na planilha
 * 3. Comparação de Snapshot (PropertiesService) para identificar pessoas removidas,
 *    adicionadas, mudança de função/instrumento, alteração de louvores/uniformes,
 *    aprovação/recusa de trocas e novos recados
 * 4. Persistência de links de YouTube na aba correta (LINK_LOUVORES) mantendo a aba ESCALA limpa
 * 5. Notificação para TODOS os integrantes escalados (dirigente, mesário, vocais e músicos)
 * 6. Anti-duplicidade estrita por (destinatario + eventoId)
 */

// URL do Backend Web da aplicação (atualize com a URL do seu deploy / Cloud Run / Vercel)
var BACKEND_WEB_URL = "https://ais-dev-77nuvy7w7gn6yjpeqn43yn-297576237917.us-east1.run.app";

// Nomes das Abas Oficiais
var ABA_ESCALA = "ESCALA";
var ABA_INTEGRANTES = "INTEGRANTES";
var ABA_SOLICITACOES = "SOLICITAÇÕES";
var ABA_RECADOS = "RECADOS";
var ABA_NOTIFICACOES = "NOTIFICAÇÕES";
var ABA_LINK_LOUVORES = "LINK_LOUVORES";

/**
 * =============================================================================
 * 1. CONFIGURAÇÃO DE GATILHO INSTALÁVEL (1-CLIQUE)
 * =============================================================================
 */
function setupInstallableTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Remove gatilhos anteriores da mesma função para evitar duplicidade
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onSheetEditTrigger") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Cria novo gatilho instalável ao editar a planilha
  ScriptApp.newTrigger("onSheetEditTrigger")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  Logger.log("✅ Gatilho instalável 'onSheetEditTrigger' criado com sucesso!");
}

/**
 * =============================================================================
 * 2. GATILHO EXECUTADO A CADA EDIÇÃO DIRETA NA PLANILHA
 * =============================================================================
 */
function onSheetEditTrigger(e) {
  if (!e || !e.range) return;

  try {
    var sheet = e.range.getSheet();
    var sheetName = sheet.getName();
    var row = e.range.getRow();
    var col = e.range.getColumn();

    // Filtra apenas abas monitoradas e linhas de dados (linha > 1)
    if (row <= 1) return;
    if (sheetName !== ABA_ESCALA && sheetName !== ABA_SOLICITACOES && sheetName !== ABA_RECADOS && sheetName !== ABA_LINK_LOUVORES) {
      return;
    }

    Logger.log("[CHANGE-DETECTOR-GAS] Edição detectada na aba: " + sheetName + " (Linha: " + row + ", Coluna: " + col + ")");

    // 1. Executa detecção local de snapshot e geração de eventos
    detectAndProcessSheetChanges("GOOGLE_SHEETS");

    // 2. Notifica o Backend Web via Webhook para sincronização em tempo real
    notifyBackendWebhook(sheetName, row);

  } catch (err) {
    Logger.log("Erro no gatilho onSheetEditTrigger: " + err.toString());
  }
}

/**
 * Envia notificação HTTP para o Webhook do Backend
 */
function notifyBackendWebhook(sheetName, row) {
  if (!BACKEND_WEB_URL) return;
  try {
    var url = BACKEND_WEB_URL + "/api/webhook/sheets-change";
    var payload = JSON.stringify({
      aba: sheetName,
      linha: row,
      origem: "GOOGLE_SHEETS",
      timestamp: new Date().toISOString()
    });

    var options = {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log("Aviso ao notificar webhook: " + err.toString());
  }
}

/**
 * =============================================================================
 * 3. CONTROLADOR WEB API: doGet
 * =============================================================================
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = (params.action || "getEscalaData").trim();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "getEscalaData") {
      var escalaSheet = ss.getSheetByName(ABA_ESCALA);
      var integrantesSheet = ss.getSheetByName(ABA_INTEGRANTES);
      var solicitacoesSheet = ss.getSheetByName(ABA_SOLICITACOES);
      var recadosSheet = ss.getSheetByName(ABA_RECADOS);
      var linkSheet = ss.getSheetByName(ABA_LINK_LOUVORES);
      var notifSheet = ss.getSheetByName(ABA_NOTIFICACOES);

      var escala = [];
      if (escalaSheet) {
        var eData = escalaSheet.getDataRange().getValues();
        for (var i = 1; i < eData.length; i++) {
          var dt = formatDateValue(eData[i][0]);
          if (dt) {
            escala.push({
              data: dt,
              dirigente: String(eData[i][1] || "").trim(),
              vocal: String(eData[i][2] || "").trim(),
              musicos: String(eData[i][3] || "").trim(),
              mesario: String(eData[i][4] || "").trim(),
              louvores: String(eData[i][5] || "").trim(),
              uniforme: String(eData[i][6] || "").trim()
            });
          }
        }
      }

      var integrantes = [];
      if (integrantesSheet) {
        var intData = integrantesSheet.getDataRange().getValues();
        for (var j = 1; j < intData.length; j++) {
          var nome = String(intData[j][0] || "").trim();
          if (nome) {
            integrantes.push({
              nome: nome,
              funcao: String(intData[j][1] || "").trim(),
              senha: String(intData[j][2] || "").trim(),
              instrumento: String(intData[j][3] || "").trim(),
              tokenFcm: String(intData[j][4] || "").trim()
            });
          }
        }
      }

      var solicitacoes = [];
      if (solicitacoesSheet) {
        var solData = solicitacoesSheet.getDataRange().getValues();
        for (var k = 1; k < solData.length; k++) {
          var sData = formatDateValue(solData[k][0]);
          var quemPediu = String(solData[k][1] || "").trim();
          if (sData && quemPediu) {
            solicitacoes.push({
              id: "sol-" + sData.replace(/[^0-9]/g, "") + "-" + quemPediu + "-" + k,
              dataEscala: sData,
              quemPediu: quemPediu,
              funcao: String(solData[k][2] || "").trim(),
              instrumento: String(solData[k][3] || "").trim(),
              substituto: String(solData[k][4] || "").trim(),
              motivo: String(solData[k][5] || "").trim(),
              status: String(solData[k][6] || "PENDENTE").trim().toUpperCase(),
              dataCriacao: String(solData[k][7] || "").trim()
            });
          }
        }
      }

      var recados = [];
      if (recadosSheet) {
        var recData = recadosSheet.getDataRange().getValues();
        for (var r = 1; r < recData.length; r++) {
          var rId = String(recData[r][0] || "").trim();
          var rTit = String(recData[r][1] || "").trim();
          if (rId || rTit) {
            recados.push({
              id: rId || "recado-" + r,
              titulo: rTit,
              mensagem: String(recData[r][2] || "").trim(),
              imagemUrl: String(recData[r][3] || "").trim(),
              ativo: String(recData[r][4] || "SIM").trim().toUpperCase(),
              dataCriacao: String(recData[r][5] || "").trim()
            });
          }
        }
      }

      var linkLouvores = [];
      if (linkSheet) {
        var colMapLink = mapearColunasLinkLouvores(linkSheet);
        var linkData = linkSheet.getDataRange().getValues();
        for (var l = 1; l < linkData.length; l++) {
          var row = linkData[l];
          var lDt = "";
          for (var di = 0; di < colMapLink.colDataIndices.length; di++) {
              lDt = formatDateValue(row[colMapLink.colDataIndices[di] - 1]);
              if (lDt) break;
          }
          var lNome = String(row[colMapLink.colLouvor - 1] || "").trim();
          var lUrl = String(row[colMapLink.colLinkYoutube - 1] || "").trim();
          var lOrdem = row[colMapLink.colOrdem - 1] || l;
          var lId = String(row[colMapLink.colId - 1] || ("link-" + l));

          if (lDt && lNome) {
            var extractedId = extractYouTubeVideoIdGas(lUrl);
            linkLouvores.push({
              id: lId,
              dataEscala: lDt,
              data: lDt,
              ordem: lOrdem,
              louvor: lNome,
              titulo: lNome,
              link_youtube: lUrl,
              linkYoutube: lUrl,
              youtubeUrl: lUrl,
              url: lUrl,
              youtubeVideoId: extractedId,
              videoId: extractedId
            });
          }
        }
      }

      var notificacoes = [];
      if (notifSheet) {
        var notData = notifSheet.getDataRange().getValues();
        for (var n = 1; n < notData.length; n++) {
          var nDest = String(notData[n][1] || "").trim();
          if (nDest) {
            notificacoes.push({
              id: String(notData[n][0] || "notif-" + n),
              destinatario: nDest,
              titulo: String(notData[n][2] || "").trim(),
              mensagem: String(notData[n][3] || "").trim(),
              tipo: String(notData[n][4] || "GERAL").trim(),
              data: String(notData[n][5] || "").trim(),
              lida: String(notData[n][6] || "NAO").trim().toUpperCase(),
              eventoId: String(notData[n][7] || "").trim(),
              origem: String(notData[n][8] || "GOOGLE_SHEETS").trim()
            });
          }
        }
      }

      return jsonResponse({
        sucesso: true,
        escala: escala,
        integrantes: integrantes,
        solicitacoes: solicitacoes,
        recados: recados,
        link_louvores: linkLouvores,
        linkLouvores: linkLouvores,
        notificacoes: notificacoes
      });
    }

    if (action === "getLinkLouvores") {
      var targetData = formatDateValue(params.data || params.dataEscala);
      var links = getLinksLouvoresPorData(ss, targetData);
      return jsonResponse({ sucesso: true, linkLouvores: links, link_louvores: links, dados: links });
    }

    return jsonResponse({ sucesso: false, mensagem: "Ação GET não reconhecida: " + action });
  } catch (err) {
    return jsonResponse({ sucesso: false, mensagem: "Erro no doGet: " + err.toString() });
  }
}

/**
 * =============================================================================
 * 4. CONTROLADOR WEB API: doPost
 * =============================================================================
 */
function doPost(e) {
  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (ex) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var action = (params.action || "").trim();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ATUALIZAÇÃO COMPLETA DA ESCALA (updateFullEscala / updateEscalaCompleta / createEscala / criarEscala)
    if (action === "updateFullEscala" || action === "updateEscalaCompleta" || action === "createEscala" || action === "criarEscala") {
      var targetData = formatDateValue(params.dataEscala || params.data || params.dataCulto);
      if (!targetData) {
        return jsonResponse({ sucesso: false, mensagem: "Data da escala é obrigatória." });
      }

      var escalaSheet = ss.getSheetByName(ABA_ESCALA);
      if (!escalaSheet) {
        escalaSheet = ss.insertSheet(ABA_ESCALA);
        escalaSheet.appendRow(["Data", "Dirigente", "Vocal", "Músicos", "Mesário", "Louvores", "Uniforme"]);
      }

      var dataRange = escalaSheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < dataRange.length; i++) {
        if (formatDateValue(dataRange[i][0]) === targetData) {
          rowIndex = i + 1; // 1-indexed
          break;
        }
      }

      if (rowIndex === -1) {
        escalaSheet.appendRow([targetData, "", "", "", "", "", ""]);
        rowIndex = escalaSheet.getLastRow();
      }

      var dirigente = params.dirigente !== undefined ? String(params.dirigente).trim() : undefined;
      var vocal = params.vocal !== undefined ? String(params.vocal).trim() : undefined;
      var musicos = params.musicos !== undefined ? String(params.musicos).trim() : undefined;
      var mesario = params.mesario !== undefined ? String(params.mesario).trim() : undefined;
      var louvores = params.louvores !== undefined ? String(params.louvores).trim() : undefined;
      var uniforme = params.uniforme !== undefined ? String(params.uniforme).trim() : undefined;

      if (dirigente !== undefined) escalaSheet.getRange(rowIndex, 2).setValue(dirigente);
      if (vocal !== undefined) escalaSheet.getRange(rowIndex, 3).setValue(vocal);
      if (musicos !== undefined) escalaSheet.getRange(rowIndex, 4).setValue(musicos);
      if (mesario !== undefined) escalaSheet.getRange(rowIndex, 5).setValue(mesario);
      if (louvores !== undefined) {
        var cleanLouvTxt = limparLinksDeTexto(louvores);
        escalaSheet.getRange(rowIndex, 6).setValue(cleanLouvTxt);
      }
      if (uniforme !== undefined) escalaSheet.getRange(rowIndex, 7).setValue(uniforme);

      // Sincroniza louvores detalhados na aba LINK_LOUVORES
      var rawDetalhes = params.louvores_detalhes || params.link_louvores || params.linkLouvores || (Array.isArray(params.louvores) ? params.louvores : undefined);
      if (rawDetalhes !== undefined) {
        syncLinkLouvores(ss, targetData, rawDetalhes, louvores);
      } else if (louvores !== undefined) {
        salvarLinksLouvoresExtraidos(ss, targetData, louvores);
      }

      // Notifica escalados
      if (louvores !== undefined || uniforme !== undefined) {
        var updatedRow = escalaSheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
        var dNome = String(updatedRow[1] || "").trim();
        var vNome = String(updatedRow[2] || "").trim();
        var mNome = String(updatedRow[3] || "").trim();
        var msNome = String(updatedRow[4] || "").trim();
        var lTxt = String(updatedRow[5] || "").trim();
        var uTxt = String(updatedRow[6] || "").trim();

        var membros = extrairMembros(dNome, vNome, mNome, msNome);
        var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, lTxt + "||" + uTxt)
          .map(function(chr){return (chr+256).toString(16).slice(-2);}).join("").substring(0, 8);

        for (var m = 0; m < membros.length; m++) {
          criarNotificacaoNoSheets({
            destinatario: membros[m].nome,
            tipo: "LOUVORES_UNIFORMES",
            titulo: "Louvores e Uniformes",
            mensagem: "A Paz " + membros[m].nome + "! Os louvores e uniformes já estão disponíveis!",
            eventoId: "LOUVORES_UNIFORMES_" + targetData.replace(/[\/]/g, "_") + "_V" + hash,
            origem: "APP"
          });
        }
      }

      return jsonResponse({ sucesso: true, mensagem: "Escala completa e louvores atualizados com sucesso." });
    }

    // 2. ATUALIZAÇÃO DE CAMPO INDIVIDUAL DA ESCALA (updateEscala / atualizarEscala)
    if (action === "updateEscala" || action === "atualizarEscala") {
      var targetData = formatDateValue(params.dataEscala || params.data || params.dataCulto);
      var campo = String(params.campo || "").trim().toLowerCase();
      var valor = params.valor !== undefined ? String(params.valor) : "";
      var louvoresParam = params.louvores !== undefined ? String(params.louvores) : undefined;
      var uniformeParam = params.uniforme !== undefined ? String(params.uniforme) : undefined;

      if (!targetData) {
        return jsonResponse({ sucesso: false, mensagem: "Data da escala é obrigatória." });
      }

      var escalaSheet = ss.getSheetByName(ABA_ESCALA);
      if (!escalaSheet) {
        escalaSheet = ss.insertSheet(ABA_ESCALA);
        escalaSheet.appendRow(["Data", "Dirigente", "Vocal", "Músicos", "Mesário", "Louvores", "Uniforme"]);
      }

      var dataRange = escalaSheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < dataRange.length; i++) {
        if (formatDateValue(dataRange[i][0]) === targetData) {
          rowIndex = i + 1; // 1-indexed
          break;
        }
      }

      if (rowIndex === -1) {
        escalaSheet.appendRow([targetData, "", "", "", "", "", ""]);
        rowIndex = escalaSheet.getLastRow();
      }

      // Colunas: 1=Data, 2=Dirigente, 3=Vocal, 4=Músicos, 5=Mesário, 6=Louvores, 7=Uniforme
      if (campo === "dirigente") escalaSheet.getRange(rowIndex, 2).setValue(valor);
      else if (campo === "vocal") escalaSheet.getRange(rowIndex, 3).setValue(valor);
      else if (campo === "musicos") escalaSheet.getRange(rowIndex, 4).setValue(valor);
      else if (campo === "mesario") escalaSheet.getRange(rowIndex, 5).setValue(valor);
      else if (campo === "louvores") {
        var cleanValor = limparLinksDeTexto(valor);
        escalaSheet.getRange(rowIndex, 6).setValue(cleanValor);
      }
      else if (campo === "uniforme") escalaSheet.getRange(rowIndex, 7).setValue(valor);

      if (louvoresParam !== undefined && campo !== "louvores") {
        var cleanLouv = limparLinksDeTexto(louvoresParam);
        escalaSheet.getRange(rowIndex, 6).setValue(cleanLouv);
      }
      if (uniformeParam !== undefined && campo !== "uniforme") {
        escalaSheet.getRange(rowIndex, 7).setValue(uniformeParam);
      }

      // Sincroniza louvores detalhados se fornecidos no payload
      var rawDetalhes = params.louvores_detalhes || params.link_louvores || params.linkLouvores;
      if (rawDetalhes !== undefined) {
        syncLinkLouvores(ss, targetData, rawDetalhes, campo === "louvores" ? valor : louvoresParam);
      } else if (campo === "louvores" && valor) {
        salvarLinksLouvoresExtraidos(ss, targetData, valor);
      } else if (louvoresParam !== undefined) {
        salvarLinksLouvoresExtraidos(ss, targetData, louvoresParam);
      }

      // Dispara notificações se louvores ou uniforme foram alterados
      if (campo === "louvores" || campo === "uniforme" || louvoresParam !== undefined || uniformeParam !== undefined) {
        var updatedRow = escalaSheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
        var dirigente = String(updatedRow[1] || "").trim();
        var vocal = String(updatedRow[2] || "").trim();
        var musicos = String(updatedRow[3] || "").trim();
        var mesario = String(updatedRow[4] || "").trim();
        var louv = String(updatedRow[5] || "").trim();
        var unif = String(updatedRow[6] || "").trim();

        var membros = extrairMembros(dirigente, vocal, musicos, mesario);
        var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, louv + "||" + unif)
          .map(function(chr){return (chr+256).toString(16).slice(-2);}).join("").substring(0, 8);

        for (var m = 0; m < membros.length; m++) {
          criarNotificacaoNoSheets({
            destinatario: membros[m].nome,
            tipo: "LOUVORES_UNIFORMES",
            titulo: "Louvores e Uniformes",
            mensagem: "A Paz " + membros[m].nome + "! Os louvores e uniformes já estão disponíveis!",
            eventoId: "LOUVORES_UNIFORMES_" + targetData.replace(/[\/]/g, "_") + "_V" + hash,
            origem: "APP"
          });
        }
      }

      return jsonResponse({ sucesso: true, mensagem: "Escala atualizada com sucesso na planilha." });
    }

    // 3. SALVAR / SINCRONIZAR LINKS DE LOUVORES NA ABA LINK_LOUVORES
    if (action === "salvarLinkLouvores" || action === "syncLinkLouvores" || action === "salvarLouvores") {
      var targetData = formatDateValue(params.dataEscala || params.data || params.dataCulto);
      if (!targetData) {
        return jsonResponse({ sucesso: false, mensagem: "Data da escala é obrigatória." });
      }

      var itemsRaw = params.louvores_detalhes || params.link_louvores || params.linkLouvores || params.louvores || params.itens;
      var louvoresTexto = params.louvoresTexto || params.louvores_texto || params.textoLouvores;

      var synced = syncLinkLouvores(ss, targetData, itemsRaw, louvoresTexto);

      return jsonResponse({
        sucesso: true,
        mensagem: "Links de louvores salvos com sucesso na aba LINK_LOUVORES.",
        totalSalvos: synced.length,
        linkLouvores: synced,
        link_louvores: synced
      });
    }

    // 3. CRIAR NOTIFICAÇÃO
    if (action === "criarNotificacao") {
      criarNotificacaoNoSheets({
        destinatario: params.destinatario,
        titulo: params.titulo,
        mensagem: params.mensagem,
        tipo: params.tipo,
        eventoId: params.eventoId,
        origem: params.origem || "APP"
      });
      return jsonResponse({ sucesso: true, mensagem: "Notificação criada." });
    }

    // 4. SALVAR NOTIFICAÇÕES EM LOTE
    if (action === "salvarNotificacoesEmLote") {
      var notifs = [];
      if (typeof params.notificacoes === "string") {
        try { notifs = JSON.parse(params.notificacoes); } catch (e) {}
      } else if (Array.isArray(params.notificacoes)) {
        notifs = params.notificacoes;
      }
      for (var nIdx = 0; nIdx < notifs.length; nIdx++) {
        criarNotificacaoNoSheets(notifs[nIdx]);
      }
      return jsonResponse({ sucesso: true, mensagem: "Notificações salvas em lote." });
    }

    // 5. MARCAR NOTIFICAÇÃO COMO LIDA
    if (action === "marcarNotificacaoLida" || action === "marcarTodasNotificacoesLidas") {
      var notifSheet = ss.getSheetByName(ABA_NOTIFICACOES);
      if (notifSheet) {
        var nData = notifSheet.getDataRange().getValues();
        var targetId = String(params.id || "").trim();
        var targetDest = normalizarNome(params.destinatario || params.nome);

        for (var ni = 1; ni < nData.length; ni++) {
          var rowId = String(nData[ni][0] || "").trim();
          var rowDest = normalizarNome(nData[ni][1]);

          if (action === "marcarNotificacaoLida" && (rowId === targetId || (rowDest === targetDest && nData[ni][7] === params.eventoId))) {
            notifSheet.getRange(ni + 1, 7).setValue("SIM");
          } else if (action === "marcarTodasNotificacoesLidas" && (rowDest === targetDest || targetDest === "todos")) {
            notifSheet.getRange(ni + 1, 7).setValue("SIM");
          }
        }
      }
      return jsonResponse({ sucesso: true, mensagem: "Notificações marcadas como lidas." });
    }

    return jsonResponse({ sucesso: false, mensagem: "Ação POST não reconhecida: " + action });
  } catch (err) {
    return jsonResponse({ sucesso: false, mensagem: "Erro no doPost: " + err.toString() });
  }
}

/**
 * =============================================================================
 * 5. MOTOR CENTRAL DE DETECÇÃO DE ALTERAÇÕES VIA SNAPSHOT
 * =============================================================================
 */
function detectAndProcessSheetChanges(origem) {
  origem = origem || "GOOGLE_SHEETS";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();

  var snapshotJson = props.getProperty("SHEETS_SNAPSHOT_V2");
  var previousSnapshot = null;

  if (snapshotJson) {
    try {
      previousSnapshot = JSON.parse(snapshotJson);
    } catch (e) {
      previousSnapshot = null;
    }
  }

  // 1. Lê os dados atuais das abas
  var escalaSheet = ss.getSheetByName(ABA_ESCALA);
  var integrantesSheet = ss.getSheetByName(ABA_INTEGRANTES);
  var solicitacoesSheet = ss.getSheetByName(ABA_SOLICITACOES);
  var recadosSheet = ss.getSheetByName(ABA_RECADOS);

  var escalaData = escalaSheet ? escalaSheet.getDataRange().getValues() : [];
  var integrantesData = integrantesSheet ? integrantesSheet.getDataRange().getValues() : [];
  var solicitacoesData = solicitacoesSheet ? solicitacoesSheet.getDataRange().getValues() : [];
  var recadosData = recadosSheet ? recadosSheet.getDataRange().getValues() : [];

  // Mapeia Integrantes
  var integrantesList = [];
  for (var i = 1; i < integrantesData.length; i++) {
    var nomeInt = String(integrantesData[i][0] || "").trim();
    var funcaoInt = String(integrantesData[i][1] || "").trim();
    if (nomeInt) {
      integrantesList.push({ nome: nomeInt, funcao: funcaoInt });
    }
  }

  // Monta estado atual da ESCALA
  var currentEscalas = {};
  for (var eIdx = 1; eIdx < escalaData.length; eIdx++) {
    var rowData = escalaData[eIdx];
    var dataStr = formatDateValue(rowData[0]);
    if (!dataStr) continue;

    var dirigente = String(rowData[1] || "").trim();
    var vocal = String(rowData[2] || "").trim();
    var musicos = String(rowData[3] || "").trim();
    var mesario = String(rowData[4] || "").trim();
    var louvores = String(rowData[5] || "").trim();
    var uniforme = String(rowData[6] || "").trim();

    var membros = extrairMembros(dirigente, vocal, musicos, mesario);
    var contentHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, louvores + "||" + uniforme)
      .map(function(chr){return (chr+256).toString(16).slice(-2);}).join("").substring(0, 8);

    currentEscalas[dataStr] = {
      data: dataStr,
      dirigente: dirigente,
      vocal: vocal,
      musicos: musicos,
      mesario: mesario,
      louvores: louvores,
      uniforme: uniforme,
      membros: membros,
      hash: contentHash
    };
  }

  // Monta estado atual de SOLICITAÇÕES
  var currentSolicitacoes = {};
  for (var sIdx = 1; sIdx < solicitacoesData.length; sIdx++) {
    var sRow = solicitacoesData[sIdx];
    var sData = formatDateValue(sRow[0]);
    var sQuemPediu = String(sRow[1] || "").trim();
    var sSubstituto = String(sRow[4] || "").trim();
    var sStatus = String(sRow[6] || "PENDENTE").trim().toUpperCase();
    var sId = sData + "_" + sQuemPediu;

    if (sData && sQuemPediu) {
      currentSolicitacoes[sId] = {
        id: sId,
        dataEscala: sData,
        quemPediu: sQuemPediu,
        substituto: sSubstituto,
        status: sStatus
      };
    }
  }

  // Monta estado atual de RECADOS
  var currentRecados = {};
  for (var rIdx = 1; rIdx < recadosData.length; rIdx++) {
    var rRow = recadosData[rIdx];
    var rId = String(rRow[0] || "").trim();
    var rTitulo = String(rRow[1] || "").trim();
    var rAtivo = String(rRow[4] || "SIM").trim().toUpperCase();

    if (rId) {
      currentRecados[rId] = {
        id: rId,
        titulo: rTitulo,
        ativo: rAtivo
      };
    }
  }

  var currentSnapshot = {
    initialized: true,
    timestamp: new Date().toISOString(),
    escalas: currentEscalas,
    solicitacoes: currentSolicitacoes,
    recados: currentRecados
  };

  // PRIMEIRA EXECUÇÃO: apenas inicializa o snapshot sem disparar notificações
  if (!previousSnapshot || !previousSnapshot.initialized) {
    Logger.log("[CHANGE-DETECTOR-GAS] Primeira execução: Snapshot inicial salvo com sucesso.");
    props.setProperty("SHEETS_SNAPSHOT_V2", JSON.stringify(currentSnapshot));
    return;
  }

  // COMPARAÇÃO ESCALA
  for (var dt in currentEscalas) {
    var nova = currentEscalas[dt];
    var antiga = previousSnapshot.escalas ? previousSnapshot.escalas[dt] : null;

    if (antiga) {
      var membrosNovos = nova.membros || [];
      var membrosAntigos = antiga.membros || [];

      // Removidos
      for (var a = 0; a < membrosAntigos.length; a++) {
        var mAnt = membrosAntigos[a];
        var achou = false;
        for (var b = 0; b < membrosNovos.length; b++) {
          if (normalizarNome(membrosNovos[b].nome) === normalizarNome(mAnt.nome)) {
            achou = true;
            break;
          }
        }
        if (!achou) {
          criarNotificacaoNoSheets({
            destinatario: mAnt.nome,
            tipo: "ESCALA",
            titulo: "Alteração na Escala",
            mensagem: "A Paz " + mAnt.nome + "! Você foi removido(a) da escala do dia " + dt + ".",
            eventoId: "ESCALA_REMOVIDO_" + dt.replace(/[\/]/g, "_") + "_" + normalizarNome(mAnt.nome).replace(/\s+/g, "_"),
            origem: origem
          });
        }
      }

      // Adicionados
      for (var c = 0; c < membrosNovos.length; c++) {
        var mNov = membrosNovos[c];
        var achouAnt = false;
        for (var d = 0; d < membrosAntigos.length; d++) {
          if (normalizarNome(membrosAntigos[d].nome) === normalizarNome(mNov.nome)) {
            achouAnt = true;
            break;
          }
        }
        if (!achouAnt) {
          var detalhe = mNov.instrumento ? mNov.funcao + " (" + mNov.instrumento + ")" : mNov.funcao;
          criarNotificacaoNoSheets({
            destinatario: mNov.nome,
            tipo: "ESCALA",
            titulo: "Nova Escala para Você",
            mensagem: "A Paz " + mNov.nome + "! Você foi escalado(a) para o culto do dia " + dt + " como " + detalhe + "!",
            eventoId: "ESCALA_ADICIONADO_" + dt.replace(/[\/]/g, "_") + "_" + normalizarNome(mNov.nome).replace(/\s+/g, "_"),
            origem: origem
          });
        }
      }

      // Mudança de Função/Instrumento
      for (var f = 0; f < membrosNovos.length; f++) {
        var mN = membrosNovos[f];
        for (var g = 0; g < membrosAntigos.length; g++) {
          var mA = membrosAntigos[g];
          if (normalizarNome(mN.nome) === normalizarNome(mA.nome)) {
            var fMudou = mN.funcao !== mA.funcao;
            var iMudou = (mN.instrumento || "") !== (mA.instrumento || "");
            if (fMudou || iMudou) {
              var detNovo = mN.instrumento ? mN.funcao + " (" + mN.instrumento + ")" : mN.funcao;
              criarNotificacaoNoSheets({
                destinatario: mN.nome,
                tipo: "ESCALA",
                titulo: "Função Alterada na Escala",
                mensagem: "A Paz " + mN.nome + "! Sua função na escala do dia " + dt + " foi alterada para " + detNovo + ".",
                eventoId: "ESCALA_ALTERADA_" + dt.replace(/[\/]/g, "_") + "_" + normalizarNome(mN.nome).replace(/\s+/g, "_") + "_" + mN.funcao,
                origem: origem
              });
            }
            break;
          }
        }
      }

      // Louvores e Uniformes
      if (nova.hash !== antiga.hash && nova.hash) {
        for (var mIdx = 0; mIdx < membrosNovos.length; mIdx++) {
          criarNotificacaoNoSheets({
            destinatario: membrosNovos[mIdx].nome,
            tipo: "LOUVORES_UNIFORMES",
            titulo: "Louvores e Uniformes",
            mensagem: "A Paz " + membrosNovos[mIdx].nome + "! Os louvores e uniformes já estão disponíveis!",
            eventoId: "LOUVORES_UNIFORMES_" + dt.replace(/[\/]/g, "_") + "_V" + nova.hash,
            origem: origem
          });
        }
      }
    }
  }

  // COMPARAÇÃO SOLICITAÇÕES
  for (var sKey in currentSolicitacoes) {
    var solNova = currentSolicitacoes[sKey];
    var solAntiga = previousSnapshot.solicitacoes ? previousSnapshot.solicitacoes[sKey] : null;

    if (solAntiga) {
      if (solAntiga.status === "PENDENTE" && solNova.status === "APROVADA") {
        criarNotificacaoNoSheets({
          destinatario: solNova.quemPediu,
          tipo: "SOLICITACAO_APROVADA",
          titulo: "Solicitação Aprovada",
          mensagem: "A Paz " + solNova.quemPediu + "! Sua solicitação foi aprovada!",
          eventoId: "SOLICITACAO_" + sKey.replace(/[^a-zA-Z0-9_-]/g, "_") + "_APROVADA_SOLICITANTE",
          origem: origem
        });
        if (solNova.substituto) {
          criarNotificacaoNoSheets({
            destinatario: solNova.substituto,
            tipo: "SOLICITACAO_APROVADA",
            titulo: "Nova Escala Atribuída",
            mensagem: "A Paz " + solNova.substituto + "! Nova escala pra você!",
            eventoId: "SOLICITACAO_" + sKey.replace(/[^a-zA-Z0-9_-]/g, "_") + "_APROVADA_SUBSTITUTO",
            origem: origem
          });
        }
      } else if (solAntiga.status === "PENDENTE" && solNova.status === "RECUSADA") {
        criarNotificacaoNoSheets({
          destinatario: solNova.quemPediu,
          tipo: "SOLICITACAO_RECUSADA",
          titulo: "Solicitação Recusada",
          mensagem: "A Paz " + solNova.quemPediu + "! Solicitação NÃO aprovada!",
          eventoId: "SOLICITACAO_" + sKey.replace(/[^a-zA-Z0-9_-]/g, "_") + "_RECUSADA_SOLICITANTE",
          origem: origem
        });
        if (solNova.substituto) {
          criarNotificacaoNoSheets({
            destinatario: solNova.substituto,
            tipo: "SOLICITACAO_RECUSADA",
            titulo: "Solicitação Não Aprovada",
            mensagem: "A Paz " + solNova.substituto + "! Sem alteração na escala!",
            eventoId: "SOLICITACAO_" + sKey.replace(/[^a-zA-Z0-9_-]/g, "_") + "_RECUSADA_SUBSTITUTO",
            origem: origem
          });
        }
      }
    }
  }

  // COMPARAÇÃO RECADOS
  for (var rKey in currentRecados) {
    var recNovo = currentRecados[rKey];
    var recAntigo = previousSnapshot.recados ? previousSnapshot.recados[rKey] : null;

    if (!recAntigo && recNovo.ativo === "SIM") {
      for (var intIdx = 0; intIdx < integrantesList.length; intIdx++) {
        criarNotificacaoNoSheets({
          destinatario: integrantesList[intIdx].nome,
          tipo: "NOVO_RECADO",
          titulo: "Novo Recado",
          mensagem: "ATENÇÃO! Tem um novo recado!",
          eventoId: "NOVO_RECADO_" + rKey,
          origem: origem
        });
      }
    }
  }

  // Atualiza snapshot
  props.setProperty("SHEETS_SNAPSHOT_V2", JSON.stringify(currentSnapshot));
}

/**
 * Cria notificação na aba NOTIFICAÇÕES da planilha garantindo anti-duplicidade
 */
function criarNotificacaoNoSheets(notif) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_NOTIFICACOES);
  if (!sheet) {
    sheet = ss.insertSheet(ABA_NOTIFICACOES);
    sheet.appendRow(["ID", "Destinatario", "Titulo", "Mensagem", "Tipo", "Data", "Lida", "EventoId", "Origem"]);
  }

  var data = sheet.getDataRange().getValues();
  var normDest = normalizarNome(notif.destinatario);
  var normEvento = (notif.eventoId || "").trim();

  // Verifica anti-duplicidade
  for (var i = 1; i < data.length; i++) {
    var dDest = normalizarNome(data[i][1]);
    var dEvento = String(data[i][7] || "").trim();
    if ((dDest === normDest || dDest === "todos") && dEvento === normEvento && normEvento !== "") {
      return; // Já existe
    }
  }

  var id = notif.id || Utilities.getUuid();
  var nowIso = notif.data || new Date().toISOString();
  sheet.appendRow([
    id,
    notif.destinatario,
    notif.titulo,
    notif.mensagem,
    notif.tipo,
    nowIso,
    notif.lida || "NAO",
    notif.eventoId || "",
    notif.origem || "GOOGLE_SHEETS"
  ]);

  Logger.log("[NOTIFICACAO-CRIADA] Destinatario: " + notif.destinatario + " | Evento: " + notif.eventoId + " | Origem: " + (notif.origem || "GOOGLE_SHEETS"));
}

/**
 * Mapeia dinamicamente as colunas da aba LINK_LOUVORES baseado nos nomes dos cabeçalhos
 */
function mapearColunasLinkLouvores(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 5);
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var map = {
    colId: -1,
    colDataIndices: [],
    colOrdem: -1,
    colLouvor: -1,
    colLinkYoutube: -1,
    maxCols: lastCol
  };

  for (var c = 0; c < headerRow.length; c++) {
    var rawHead = String(headerRow[c] || "").trim();
    var head = normalizarNome(rawHead).replace(/[^a-z0-9]/g, "");

    if (map.colId === -1 && (head === "id" || head === "uuid" || head === "codigo" || head === "cod")) {
      map.colId = c + 1;
    } else if (head === "data" || head === "dataescala" || head === "dataculto" || head === "data_escala") {
      map.colDataIndices.push(c + 1);
    } else if (map.colOrdem === -1 && (head === "ordem" || head === "posicao" || head === "seq" || head === "numero" || head === "ord")) {
      map.colOrdem = c + 1;
    } else if (map.colLouvor === -1 && (head === "louvor" || head === "titulo" || head === "musica" || head === "nome" || head === "hino")) {
      map.colLouvor = c + 1;
    } else if (map.colLinkYoutube === -1 && (head.indexOf("youtube") !== -1 || head.indexOf("link") !== -1 || head === "url" || head === "video")) {
      map.colLinkYoutube = c + 1;
    }
  }

  // Fallback seguro caso algum cabeçalho não tenha sido identificado
  if (map.colId === -1) map.colId = 1;
  if (map.colData === -1) map.colData = 2;
  if (map.colOrdem === -1) map.colOrdem = 3;
  if (map.colLouvor === -1) map.colLouvor = 4;
  if (map.colLinkYoutube === -1) map.colLinkYoutube = 5;

  map.maxCols = Math.max(map.maxCols, map.colId, map.colData, map.colOrdem, map.colLouvor, map.colLinkYoutube);
  return map;
}

/**
 * Garante que a aba LINK_LOUVORES exista e possua estrutura de cabeçalhos íntegra
 */
function garantirEstruturaLinkLouvores(ss) {
  var sheet = ss.getSheetByName(ABA_LINK_LOUVORES);
  if (!sheet) {
    sheet = ss.insertSheet(ABA_LINK_LOUVORES);
    sheet.appendRow(["ID", "DATA", "ORDEM", "LOUVOR", "LINK_YOUTUBE"]);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "DATA", "ORDEM", "LOUVOR", "LINK_YOUTUBE"]);
  }

  var colMap = mapearColunasLinkLouvores(sheet);
  return { sheet: sheet, colMap: colMap };
}

/**
 * Sincroniza louvores detalhados com seus links de YouTube na aba LINK_LOUVORES
 */
function syncLinkLouvores(ss, targetData, louvoresInput, louvoresTexto) {
  var cleanData = formatDateValue(targetData);
  if (!cleanData) return [];

  var struct = garantirEstruturaLinkLouvores(ss);
  var sheet = struct.sheet;
  var colMap = struct.colMap;

  var items = [];
  if (louvoresInput) {
    if (typeof louvoresInput === "string") {
      try {
        items = JSON.parse(louvoresInput);
      } catch (e) {
        items = [];
      }
    } else if (Array.isArray(louvoresInput)) {
      items = louvoresInput;
    }
  }

  // Se não foi passado array estruturado mas foi passado texto com links, extrai
  if ((!items || items.length === 0) && louvoresTexto) {
    var extracted = extrairLouvoresDeTexto(louvoresTexto, cleanData);
    if (extracted && extracted.length > 0) {
      items = extracted;
    }
  }

  Logger.log("[YT DEBUG] Início de sincronização para data: " + cleanData + " | Total louvores recebidos: " + (items ? items.length : 0));

  // Remove registros anteriores daquela data
  var dataRange = sheet.getDataRange().getValues();
  for (var r = dataRange.length - 1; r >= 1; r--) {
    var rowDate = "";
    for (var di = 0; di < colMap.colDataIndices.length; di++) {
        rowDate = formatDateValue(dataRange[r][colMap.colDataIndices[di] - 1]);
        if (rowDate) break;
    }
    
    if (rowDate === cleanData) {
      sheet.deleteRow(r + 1);
    }
  }

  var synced = [];

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var louvorNome = String(it.louvor || it.titulo || it.nome || it.music || "").trim();
    if (!louvorNome) continue;

    var ytVideoId = String(it.youtubeVideoId || it.videoId || it.video_id || "").trim();
    var rawUrl = String(it.link_youtube || it.linkYoutube || it.youtube || it.youtubeUrl || it.youtube_url || it.url || "").trim();

    if (!rawUrl && ytVideoId) {
      rawUrl = "https://www.youtube.com/watch?v=" + ytVideoId;
    }
    if (!ytVideoId && rawUrl) {
      ytVideoId = extractYouTubeVideoIdGas(rawUrl) || "";
    }

    var ordem = it.ordem || it.posicao || (i + 1);
    var id = it.id || Utilities.getUuid();

    // Constrói linha com tamanho exato para respeitar a posição dinâmica das colunas
    var newRow = new Array(colMap.maxCols).fill("");
    newRow[colMap.colId - 1] = id;
    for (var di = 0; di < colMap.colDataIndices.length; di++) {
        newRow[colMap.colDataIndices[di] - 1] = cleanData;
    }
    newRow[colMap.colOrdem - 1] = ordem;
    newRow[colMap.colLouvor - 1] = louvorNome;
    newRow[colMap.colLinkYoutube - 1] = rawUrl;

    sheet.appendRow(newRow);
    var targetRowIndex = sheet.getLastRow();

    Logger.log("[YT DEBUG] Louvor: " + louvorNome + " | Link recebido: " + rawUrl + " | Coluna LINK_YOUTUBE: " + colMap.colLinkYoutube + " | Linha: " + targetRowIndex + " | Resultado: gravado com sucesso");

    synced.push({
      id: id,
      data: cleanData,
      dataEscala: cleanData,
      ordem: ordem,
      louvor: louvorNome,
      titulo: louvorNome,
      link_youtube: rawUrl,
      linkYoutube: rawUrl,
      youtubeUrl: rawUrl,
      url: rawUrl,
      youtubeVideoId: ytVideoId,
      videoId: ytVideoId
    });
  }

  // Atualiza texto limpo na aba ESCALA se texto foi fornecido
  if (louvoresTexto !== undefined) {
    var cleanTxt = limparLinksDeTexto(String(louvoresTexto));
    var escalaSheet = ss.getSheetByName(ABA_ESCALA);
    if (escalaSheet) {
      var eRange = escalaSheet.getDataRange().getValues();
      for (var er = 1; er < eRange.length; er++) {
        if (formatDateValue(eRange[er][0]) === cleanData) {
          escalaSheet.getRange(er + 1, 6).setValue(cleanTxt);
          break;
        }
      }
    }
  }

  return synced;
}

/**
 * Extrai ID do vídeo do YouTube de qualquer formato de link suportado
 */
function extractYouTubeVideoIdGas(url) {
  if (!url || typeof url !== "string") return "";
  var clean = url.trim();
  if (!clean) return "";

  var patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = clean.match(patterns[i]);
    if (match) {
      return match[1] || match[0];
    }
  }
  return "";
}

/**
 * Extrai louvores e links do texto da escala
 */
function extrairLouvoresDeTexto(textoLouvores, dataEscala) {
  if (!textoLouvores) return [];
  var lines = String(textoLouvores).split("\n");
  var extracted = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    var cleanLine = line.replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, "").trim();
    var ytMatch = cleanLine.match(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/i);
    var url = "";
    if (ytMatch) {
      url = ytMatch[0];
      cleanLine = cleanLine
        .replace(url, "")
        .replace(/\(\s*\)/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/[\|\(\)\[\]\-]+$/, "")
        .trim();
    }

    if (cleanLine) {
      extracted.push({
        id: "link-" + dataEscala.replace(/[^0-9]/g, "") + "-" + (i + 1),
        data: dataEscala,
        dataEscala: dataEscala,
        ordem: i + 1,
        louvor: cleanLine,
        titulo: cleanLine,
        link_youtube: url,
        linkYoutube: url,
        youtubeUrl: url,
        url: url
      });
    }
  }
  return extracted;
}

/**
 * Extrai e salva links de YouTube encontrados no texto de louvores para a aba LINK_LOUVORES
 */
function salvarLinksLouvoresExtraidos(ss, dataEscala, textoLouvores) {
  if (!textoLouvores) return;
  var items = extrairLouvoresDeTexto(textoLouvores, dataEscala);
  syncLinkLouvores(ss, dataEscala, items, textoLouvores);
}

/**
 * Remove URLs do texto dos louvores para manter a aba ESCALA com os nomes das músicas limpos
 */
function limparLinksDeTexto(txt) {
  if (!txt) return "";
  var lines = String(txt).split("\n");
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (!l) continue;
    l = l
      .replace(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/gi, "")
      .replace(/\(\s*\)/g, "")
      .replace(/\[\s*\]/g, "")
      .replace(/[\|\(\)\[\]\-]+$/, "")
      .trim();
    if (l) out.push(l);
  }
  return out.join("\n");
}

function getLinksLouvoresPorData(ss, dataEscala) {
  var list = [];
  var sheet = ss.getSheetByName(ABA_LINK_LOUVORES);
  if (!sheet) return list;

  var colMap = mapearColunasLinkLouvores(sheet);
  var d = sheet.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) {
    var row = d[i];
    var rowDate = "";
    for (var di = 0; di < colMap.colDataIndices.length; di++) {
        rowDate = formatDateValue(row[colMap.colDataIndices[di] - 1]);
        if (rowDate) break;
    }
    
    if (rowDate === dataEscala) {
      var lUrl = String(row[colMap.colLinkYoutube - 1] || "").trim();
      var extractedId = extractYouTubeVideoIdGas(lUrl);
      var lNome = String(row[colMap.colLouvor - 1] || "").trim();
      var lId = String(row[colMap.colId - 1] || ("link-" + i));
      var lOrdem = row[colMap.colOrdem - 1] || i;

      list.push({
        id: lId,
        dataEscala: dataEscala,
        data: dataEscala,
        ordem: lOrdem,
        louvor: lNome,
        titulo: lNome,
        link_youtube: lUrl,
        linkYoutube: lUrl,
        youtubeUrl: lUrl,
        url: lUrl,
        youtubeVideoId: extractedId,
        videoId: extractedId
      });
    }
  }
  return list;
}

/**
 * Helpers
 */
function extrairMembros(dirigente, vocal, musicos, mesario) {
  var list = [];
  if (dirigente && dirigente.trim()) list.push({ nome: dirigente.trim(), funcao: "Dirigente" });
  if (mesario && mesario.trim()) list.push({ nome: mesario.trim(), funcao: "Mesário de Som" });
  if (vocal && vocal.trim()) {
    var vocs = vocal.split(/[,X\/]/i);
    for (var i = 0; i < vocs.length; i++) {
      var v = vocs[i].trim();
      if (v) list.push({ nome: v, funcao: "Vocal" });
    }
  }
  if (musicos && musicos.trim()) {
    var mus = musicos.split(/[,X\/]/i);
    for (var j = 0; j < mus.length; j++) {
      var m = mus[j].trim();
      if (m) {
        var match = m.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
          list.push({ nome: match[1].trim(), funcao: "Músico", instrumento: match[2].trim() });
        } else {
          list.push({ nome: m, funcao: "Músico" });
        }
      }
    }
  }
  return list;
}

function normalizarNome(txt) {
  if (!txt) return "";
  return txt.toString().toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function formatDateValue(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var d = ("0" + val.getDate()).slice(-2);
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var y = val.getFullYear();
    return d + "/" + m + "/" + y;
  }
  return String(val).trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
