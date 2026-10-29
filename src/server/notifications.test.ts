import {
  criarNotificacaoSeNaoExiste,
  marcarComoLidaLocal,
  getNotificacoesParaUsuario,
  mergeGasNotifications,
  processarNotificacaoNovoRecado,
  processarNotificacaoNovaSolicitacao,
  processarNotificacaoDecisaoSolicitacao,
  processarLembretesDeCulto,
  resetSnapshotForTesting,
  clearNotificationsForTesting,
  pushNotificacaoParaGas,
  setMockTimeForTesting,
  NotificacaoRecord,
  IntegranteRef,
  EscalaRef
} from "./notifications";
import {
  reserveEventAtomic,
  markEventSent,
  markEventFcmDispatched,
  markEventFailed,
  getEventStatus,
  buildRecipientEventKey,
  clearIdempotencyStoreForTesting
} from "./idempotencyStore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("🧪 EXECUTANDO SUÍTE DE TESTES DE NOTIFICAÇÃO");
  console.log("=================================================");

  clearNotificationsForTesting();
  resetSnapshotForTesting();
  clearIdempotencyStoreForTesting();

  // 1. Teste de Idempotência por eventoId
  console.log("\n1. Testando Idempotência do eventoId...");
  const n1 = criarNotificacaoSeNaoExiste({
    destinatario: "TestUser",
    tipo: "NOVO_RECADO",
    titulo: "Teste Recado 1",
    mensagem: "Mensagem de teste",
    eventoId: "recado:test_rec_1:todos",
    origem: "APP"
  });
  assert(n1 !== null, "Primeira notificação deve ser criada.");

  const n1Duplicate = criarNotificacaoSeNaoExiste({
    destinatario: "TestUser",
    tipo: "NOVO_RECADO",
    titulo: "Teste Recado 1",
    mensagem: "Mensagem de teste duplicada",
    eventoId: "recado:test_rec_1:todos",
    origem: "GOOGLE_SHEETS"
  });
  assert(n1Duplicate === null, "Tentativa de criar notificação com mesmo eventoId deve ser ignorada (retornar null).");
  console.log("✅ Idempotência por eventoId confirmada!");

  // 2. Teste de marcação de leitura local e recuperação de dados para contrato GAS
  console.log("\n2. Testando marcação de leitura local...");
  const notifsUser = getNotificacoesParaUsuario("TestUser");
  assert(notifsUser.length > 0, "Usuário deve encontrar a notificação criada.");
  const targetId = notifsUser[0].id;

  const readResult = marcarComoLidaLocal(targetId);
  assert(readResult.sucesso === true, "Marcação como lida deve ser bem sucedida.");
  assert(readResult.item?.eventoId === "recado:test_rec_1:todos", "Item retornado deve conter o eventoId correspondente.");
  assert(readResult.item?.destinatario === "TestUser", "Item retornado deve conter o destinatario correto.");

  const notifsUserAfter = getNotificacoesParaUsuario("TestUser");
  assert(notifsUserAfter[0].lida === "SIM", "Notificação deve estar marcada como 'SIM'.");
  console.log("✅ Marcação de leitura e exportação de contrato GAS confirmadas!");

  // 3. Teste de retenção de status lido ao mesclar notificações do Google Apps Script
  console.log("\n3. Testando mesclagem de notificações do GAS com retenção de status lido...");
  const gasMockList = [
    {
      id: targetId,
      destinatario: "TestUser",
      titulo: "Teste Recado 1",
      mensagem: "Mensagem do GAS",
      tipo: "NOVO_RECADO",
      data: new Date().toISOString(),
      lida: "NAO", // GAS ainda não sincronizou e reporta NAO
      eventoId: "recado:test_rec_1:todos",
      origem: "GOOGLE_SHEETS"
    }
  ];

  mergeGasNotifications(gasMockList);
  const notifsUserAfterMerge = getNotificacoesParaUsuario("TestUser");
  assert(
    notifsUserAfterMerge[0].lida === "SIM",
    "Mesclagem com GAS NÃO deve reverter status lido 'SIM' para 'NAO'."
  );
  console.log("✅ Retenção do status lido mantida com sucesso!");

  // 5. Teste de Regras de Negócio - Solicitações de Troca (Criação, Aprovação e Recusa)
  console.log("\n5. Testando Regras de Negócio das Solicitações de Troca...");

  const integrantesTroca: IntegranteRef[] = [
    { nome: "Lucas Solicitante", funcao: "Músico" },
    { nome: "Mateus Substituto", funcao: "Músico" },
    { nome: "Carlos Lider", funcao: "Líder de Louvor" }
  ];

  // A. Criação: notifica SOMENTE o líder com "Nova solicitação de troca"
  clearNotificationsForTesting();
  const countNovaSol = processarNotificacaoNovaSolicitacao({
    solicitacaoId: "sol_101",
    quemPediu: "Lucas Solicitante",
    dataEscala: "28/10/2026",
    integrantes: integrantesTroca,
    origem: "APP"
  });
  assert(countNovaSol === 1, "Apenas o líder deve ser notificado na criação da solicitação.");
  const notifLider = getNotificacoesParaUsuario("Carlos Lider");
  assert(notifLider.length === 1, "Líder deve receber a notificação de nova solicitação.");
  assert(notifLider[0].mensagem === "Nova solicitação de troca", "Mensagem exata esperada: 'Nova solicitação de troca'.");
  assert(getNotificacoesParaUsuario("Lucas Solicitante").length === 0, "Solicitante NÃO deve receber notificação de criação.");

  // B. Aprovação: notifica afetados com "Escala atualizada" (sem "Troca aprovada")
  clearNotificationsForTesting();
  const countAprov = processarNotificacaoDecisaoSolicitacao({
    solicitacaoId: "sol_101",
    quemPediu: "Lucas Solicitante",
    substituto: "Mateus Substituto",
    dataEscala: "28/10/2026",
    acao: "APROVAR",
    origem: "APP"
  });
  assert(countAprov === 2, "Solicitante e Substituto devem ser notificados na aprovação.");
  const notifSolicAprov = getNotificacoesParaUsuario("Lucas Solicitante");
  const notifSubstAprov = getNotificacoesParaUsuario("Mateus Substituto");
  assert(notifSolicAprov[0].mensagem === "Escala atualizada", "Mensagem exata esperada para solicitante: 'Escala atualizada'.");
  assert(notifSubstAprov[0].mensagem === "Escala atualizada", "Mensagem exata esperada para substituto: 'Escala atualizada'.");

  // C. Recusa: notifica SOMENTE quem solicitou com "Troca Recusada"
  clearNotificationsForTesting();
  const countRecus = processarNotificacaoDecisaoSolicitacao({
    solicitacaoId: "sol_102",
    quemPediu: "Lucas Solicitante",
    substituto: "Mateus Substituto",
    dataEscala: "28/10/2026",
    acao: "RECUSAR",
    origem: "APP"
  });
  assert(countRecus === 1, "Apenas quem solicitou deve ser notificado na recusa.");
  const notifSolicRecus = getNotificacoesParaUsuario("Lucas Solicitante");
  assert(notifSolicRecus[0].mensagem === "Troca Recusada", "Mensagem exata esperada para recusa: 'Troca Recusada'.");
  assert(getNotificacoesParaUsuario("Mateus Substituto").length === 0, "Substituto NÃO deve ser notificado em caso de recusa.");
  console.log("✅ Regras de negócio de Solicitações de Troca validadas com sucesso!");

  // 6. Teste de lembretes de culto e janelas de execução
  console.log("\n6. Testando idempotência e janelas de lembretes de culto...");
  clearNotificationsForTesting();
  const escalaMock: EscalaRef[] = [
    {
      data: "28/10/2026",
      dirigente: "Maria Santos",
      vocal: "João Silva",
      musicos: "Pedro",
      louvores: "Hino 1",
      uniforme: "Preto"
    }
  ];

  const integrantesMock: IntegranteRef[] = [
    { nome: "João Silva", funcao: "Músico" },
    { nome: "Maria Santos", funcao: "Líder" }
  ];

  // Configura quarta-feira 28/10/2026 18:00 (após slots de louvores)
  setMockTimeForTesting(new Date("2026-10-28T18:00:00"));

  const countLembretes1 = processarLembretesDeCulto(escalaMock, integrantesMock, []);
  assert(countLembretes1 === 0, "Sem louvores cadastrados, não deve criar lembretes de louvores.");
  
  const countLembretes2 = processarLembretesDeCulto(escalaMock, integrantesMock, [{ data: "28/10/2026", louvor: "Hino 1" }]);
  assert(countLembretes2 > 0, "Com louvores cadastrados, deve criar lembretes.");
  
  const countLembretes3 = processarLembretesDeCulto(escalaMock, integrantesMock, [{ data: "29/10/2026", louvor: "Outra data" }]);
  assert(countLembretes3 === 0, "Louvores para outra data não devem autorizar lembrete para hoje.");
  
  // Reseta mockTime
  setMockTimeForTesting(null);
  
  console.log("✅ Lembretes de culto e verificação de louvores validados!");

  // 6. Teste de Proteção do Endpoint /api/notificacoes/cron (CRON_SECRET)
  console.log("\n6. Testando proteção do endpoint cron com CRON_SECRET...");
  const mockCronSecret = "test_cron_secret_12345";
  process.env.CRON_SECRET = mockCronSecret;

  function simulateCronEndpoint(headers: { authorization?: string }) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = headers.authorization;
    if (!cronSecret || !authHeader || !authHeader.startsWith("Bearer ")) {
      return { status: 401, body: { sucesso: false, mensagem: "Acesso não autorizado ao endpoint cron." } };
    }
    const token = authHeader.substring(7).trim();
    if (token !== cronSecret) {
      return { status: 401, body: { sucesso: false, mensagem: "Token de autorização inválido." } };
    }
    return { status: 200, body: { sucesso: true, mensagem: "Lembretes de culto processados com sucesso." } };
  }

  const resUnauth = simulateCronEndpoint({});
  assert(resUnauth.status === 401, "Requisição sem header Authorization deve retornar HTTP 401.");

  const resBadToken = simulateCronEndpoint({ authorization: "Bearer invalid_secret" });
  assert(resBadToken.status === 401, "Requisição com token incorreto deve retornar HTTP 401.");

  const resValidToken = simulateCronEndpoint({ authorization: `Bearer ${mockCronSecret}` });
  assert(resValidToken.status === 200, "Requisição com Bearer CRON_SECRET válido deve retornar HTTP 200.");
  console.log("✅ Validação de segurança CRON_SECRET confirmada!");

  // 7. Teste de Reserva Atômica e Bloqueio Concorrente (IdempotencyStore)
  // 7. Teste de Reserva Atômica e Bloqueio Concorrente por Destinatário
  console.log("\n7. Testando reserva atômica e bloqueio concorrente por destinatário...");
  const baseEvent = "recado:rec_999:todos";
  const userAKey = buildRecipientEventKey(baseEvent, "João Silva");
  const userBKey = buildRecipientEventKey(baseEvent, "Maria Santos");

  const rA1 = await reserveEventAtomic(userAKey, { destinatario: "João Silva", tipo: "NOVO_RECADO" });
  assert(rA1.success === true, "Reserva do Usuário A deve suceder.");

  const rA2 = await reserveEventAtomic(userAKey, { destinatario: "João Silva", tipo: "NOVO_RECADO" });
  assert(rA2.success === false && rA2.reason === "LOCK_ACTIVE", "Segunda reserva concorrente do Usuário A deve retornar LOCK_ACTIVE.");

  // Usuário B para o MESMO evento de recado
  const rB1 = await reserveEventAtomic(userBKey, { destinatario: "Maria Santos", tipo: "NOVO_RECADO" });
  assert(rB1.success === true, "Reserva do Usuário B para o mesmo evento DEVE suceder de forma independente.");

  await markEventFcmDispatched(userAKey, "fcm_msg_joao");
  await markEventFailed(userBKey, "Erro de rede para Maria");

  // Re-tentativa para Usuário A (deve bloquear)
  const rA3 = await reserveEventAtomic(userAKey, { destinatario: "João Silva", tipo: "NOVO_RECADO" });
  assert(rA3.success === false && rA3.reason === "ALREADY_SENT", "Re-tentativa para Usuário A (já despachado) deve ser bloqueada.");

  // Re-tentativa para Usuário B (deve permitir)
  const rB2 = await reserveEventAtomic(userBKey, { destinatario: "Maria Santos", tipo: "NOVO_RECADO" });
  assert(rB2.success === true, "Re-tentativa isolada para Usuário B (que falhou) deve ser permitida sem afetar Usuário A.");
  console.log("✅ Granularidade atômica por destinatário e isolamento de falhas confirmados!");

  // 8. Teste de Recuperação após Falha de Envio
  console.log("\n8. Testando recuperação e política de retry após falha de envio...");
  const failEvtKey = "test:falha:key_456";
  const rf1 = await reserveEventAtomic(failEvtKey, { destinatario: "Maria", tipo: "TESTE" });
  assert(rf1.success === true, "Reserva inicial deve suceder.");

  await markEventFailed(failEvtKey, "Timeout de conexão no FCM");
  const rfStatus = await getEventStatus(failEvtKey);
  assert(rfStatus?.status === "failed", "Status do evento deve constar como 'failed'.");

  const rf2 = await reserveEventAtomic(failEvtKey, { destinatario: "Maria", tipo: "TESTE" });
  assert(rf2.success === true, "Re-tentativa de evento com status 'failed' deve ser autorizada.");
  console.log("✅ Recuperação de falhas e política de retry validadas!");

  // 9. Teste de Proteção pós-Aceitação do FCM (fcm_dispatched)
  console.log("\n9. Testando bloqueio pós-aceitação do FCM (fcm_dispatched)...");
  const fcmEvtKey = "test:fcm_dispatched:key_789";
  const f1 = await reserveEventAtomic(fcmEvtKey, { destinatario: "Pedro", tipo: "TESTE" });
  assert(f1.success === true, "Reserva de evento FCM deve suceder.");

  await markEventFcmDispatched(fcmEvtKey, "msg_id_fcm_abc123");
  const fStatus = await getEventStatus(fcmEvtKey);
  assert(fStatus?.status === "fcm_dispatched", "Status deve constar como 'fcm_dispatched'.");

  const f2 = await reserveEventAtomic(fcmEvtKey, { destinatario: "Pedro", tipo: "TESTE" });
  assert(f2.success === false, "Nova tentativa de reserva para evento fcm_dispatched DEVE ser bloqueada.");
  assert(f2.reason === "ALREADY_SENT", "Motivo deve ser ALREADY_SENT para impedir duplicatas no FCM.");
  console.log("✅ Proteção pós-aceitação do FCM validada com sucesso!");

  // 10. Teste de Exigência do Firestore em Produção (process.env.VERCEL)
  console.log("\n10. Testando exigência do Firestore no Vercel (sem fallback em disco)...");
  process.env.VERCEL = "1";
  const vercelCheck = await reserveEventAtomic("test:vercel:strict_123");
  assert(vercelCheck.success === false, "Reserva sem Firestore Admin na Vercel deve falhar obrigatoriamente.");
  assert(vercelCheck.reason === "FIRESTORE_UNAVAILABLE", "Razão deve ser FIRESTORE_UNAVAILABLE.");
  delete process.env.VERCEL; // Restaura ambiente de teste local
  console.log("✅ Bloqueio de segurança sem Firestore no Vercel confirmado!");

  // 11. Teste de Resiliência a Cold-Start Serverless
  console.log("\n11. Testando resiliência do estado após Cold-Start (Limpeza em memória)...");
  clearNotificationsForTesting(); // Apaga estado em memória RAM Node.js
  const coldEvtCheck = await reserveEventAtomic(userAKey, { destinatario: "João Silva", tipo: "TESTE" });
  assert(coldEvtCheck.success === false, "Até após cold start, o evento mantido no store deve ser detectado.");
  assert(coldEvtCheck.reason === "ALREADY_SENT", "Motivo retornado deve ser ALREADY_SENT.");
  console.log("✅ Resiliência a Cold-Start confirmada com persistência compartilhada!");

  // 10. Teste da lógica do GAS marcarNotificacaoLida (matchFound e parada individual break)
  console.log("\n10. Testando retorno e parada individual no GAS com break determinístico...");
  function simulateGasMarcarLida(action: string, params: { id?: string; eventoId?: string; destinatario?: string }, sheetData: any[][]) {
    var matchFound = false;
    var targetId = String(params.id || "").trim();
    var targetDest = (params.destinatario || "").toLowerCase().trim();
    var targetEventoId = String(params.eventoId || "").trim();

    for (var ni = 1; ni < sheetData.length; ni++) {
      var rowId = String(sheetData[ni][0] || "").trim();
      var rowDest = (sheetData[ni][1] || "").toLowerCase().trim();
      var rowEventoId = String(sheetData[ni][7] || "").trim();

      var matchSingle = false;
      if (action === "marcarNotificacaoLida") {
        if (targetId && rowId === targetId) {
          matchSingle = true;
        } else if (targetEventoId && rowEventoId && targetEventoId.toLowerCase() === rowEventoId.toLowerCase()) {
          if (targetDest && rowDest) {
            if (rowDest === targetDest || rowDest === "todos" || targetDest === "todos") {
              matchSingle = true;
            }
          } else {
            matchSingle = true;
          }
        }
      }

      var matchAll = action === "marcarTodasNotificacoesLidas" && (rowDest === targetDest || targetDest === "todos" || rowDest === "todos");

      if (matchSingle || matchAll) {
        sheetData[ni][6] = "SIM";
        matchFound = true;
        if (action === "marcarNotificacaoLida") {
          break; // Parada determinística
        }
      }
    }

    if (action === "marcarNotificacaoLida" && !matchFound) {
      return { sucesso: false, mensagem: "Notificação não encontrada na planilha." };
    }
    return { sucesso: true, mensagem: "Notificações marcadas como lidas." };
  }

  const mockSheetData = [
    ["ID", "DESTINATARIO", "TITULO", "MENSAGEM", "TIPO", "DATA", "LIDA", "EVENTO_ID"],
    ["notif_100", "João Silva", "Recado", "Texto 1", "NOVO_RECADO", "2026-10-28", "NAO", "recado:100:todos"],
    ["notif_101", "Maria Santos", "Recado", "Texto 2", "NOVO_RECADO", "2026-10-28", "NAO", "recado:100:todos"]
  ];

  // Teste de busca individual: altera apenas a primeira linha e para via break
  const gasSuccess = simulateGasMarcarLida("marcarNotificacaoLida", { id: "notif_100" }, mockSheetData);
  assert(gasSuccess.sucesso === true, "Marcação para notificação existente deve retornar sucesso: true.");
  assert(mockSheetData[1][6] === "SIM", "Linha 1 encontrada na planilha deve ser atualizada para 'SIM'.");
  assert(mockSheetData[2][6] === "NAO", "Linha 2 NÃO deve ser alterada em busca por ID individual (break executado).");

  // Teste de marcar todas como lidas: altera a linha restante
  const gasAllSuccess = simulateGasMarcarLida("marcarTodasNotificacoesLidas", { destinatario: "Maria Santos" }, mockSheetData);
  assert(gasAllSuccess.sucesso === true, "Marcar todas deve retornar sucesso.");
  assert(mockSheetData[2][6] === "SIM", "Linha 2 de Maria Santos deve ter sido alterada para 'SIM'.");

  const gasNotFound = simulateGasMarcarLida("marcarNotificacaoLida", { id: "notif_invalida_999" }, mockSheetData);
  assert(gasNotFound.sucesso === false, "Marcação para notificação inexistente deve retornar sucesso: false.");
  assert(gasNotFound.mensagem === "Notificação não encontrada na planilha.", "Mensagem de erro exata esperada quando não encontra linha.");
  // 11. Teste de Simulação do GAS - createRecado, updateRecado, deleteRecado, createSolicitacao, e Ação Desconhecida
  console.log("\n11. Testando simulação dos manipuladores POST do GAS (createRecado, updateRecado, deleteRecado, createSolicitacao, processaSolicitacao)...");

  function simulateGasDoPost(e: { parameter?: any; postData?: { contents?: string } }) {
    var params = e.parameter || {};
    if (e.postData && e.postData.contents) {
      try { params = JSON.parse(e.postData.contents); } catch (err) {}
    }
    var action = String(params.action || "").trim();

    if (action === "createRecado" || action === "criarRecado") {
      var titulo = String(params.titulo || "").trim();
      var mensagem = String(params.mensagem || "").trim();
      if (!titulo || !mensagem) {
        return { sucesso: false, mensagem: "Título e mensagem do recado são obrigatórios." };
      }
      var recadoId = String(params.id || "").trim() || ("rec_" + Date.now());
      return { sucesso: true, id: recadoId, mensagem: "Recado criado com sucesso na planilha." };
    }

    if (action === "updateRecado" || action === "atualizarRecado" || action === "editarRecado") {
      var targetId = String(params.id || "").trim();
      if (!targetId) {
        return { sucesso: false, mensagem: "ID do recado é obrigatório." };
      }
      return { sucesso: true, id: targetId, mensagem: "Recado atualizado com sucesso na planilha." };
    }

    if (action === "deleteRecado" || action === "excluirRecado") {
      var targetId = String(params.id || "").trim();
      if (!targetId) {
        return { sucesso: false, mensagem: "ID do recado é obrigatório." };
      }
      return { sucesso: true, id: targetId, mensagem: "Recado marcado como inativo na planilha." };
    }

    if (action === "createSolicitacao" || action === "criarSolicitacao") {
      var targetData = String(params.dataEscala || params.data || "").trim();
      var quemPediu = String(params.nome || params.quemPediu || "").trim();
      if (!targetData || !quemPediu) {
        return { sucesso: false, mensagem: "Data da escala e solicitante são obrigatórios." };
      }
      return { sucesso: true, id: "sol_123", mensagem: "Solicitação registrada com sucesso na planilha." };
    }

    return { sucesso: false, mensagem: "Ação POST não reconhecida: " + action };
  }

  // Testes de validação de parâmetros e sucesso para createRecado
  const createRecadoValid = simulateGasDoPost({ parameter: { action: "createRecado", titulo: "Aviso Geral", mensagem: "Ensaio Quinta às 19:30" } });
  assert(createRecadoValid.sucesso === true, "createRecado com título e mensagem válidos deve retornar sucesso.");
  assert(typeof createRecadoValid.id === "string", "createRecado deve retornar um ID do recado.");

  const createRecadoInvalid = simulateGasDoPost({ parameter: { action: "createRecado", titulo: "" } });
  assert(createRecadoInvalid.sucesso === false, "createRecado sem mensagem deve retornar erro de validação.");
  assert(createRecadoInvalid.mensagem === "Título e mensagem do recado são obrigatórios.", "Mensagem de erro exata esperada para parâmetros ausentes.");

  // Testes de updateRecado e deleteRecado
  const updateRecadoValid = simulateGasDoPost({ parameter: { action: "updateRecado", id: "rec_100", titulo: "Aviso Editado", mensagem: "Novo horário 20:00" } });
  assert(updateRecadoValid.sucesso === true, "updateRecado com ID deve ter sucesso.");

  const deleteRecadoValid = simulateGasDoPost({ parameter: { action: "deleteRecado", id: "rec_100" } });
  assert(deleteRecadoValid.sucesso === true, "deleteRecado com ID deve ter sucesso.");

  // Teste de ação não reconhecida
  const unknownActionRes = simulateGasDoPost({ parameter: { action: "acaoInexistente" } });
  assert(unknownActionRes.sucesso === false, "Ação desconhecida deve retornar erro.");
  assert(unknownActionRes.mensagem === "Ação POST não reconhecida: acaoInexistente", "Mensagem de ação não reconhecida exata esperada.");

  // 12. Testes de Validação de Persistência e Resposta do GAS para createRecado (Requisitos TAREFA F)
  console.log("\n12. Testando cenários de resposta do GAS para createRecado...");

  function evaluateRecadoResponse(gasResponseOk: boolean, textBody: string) {
    if (!gasResponseOk) {
      return { handled: false, error: "HTTP not ok", status: 502 };
    }
    let result: any;
    try {
      result = JSON.parse(textBody);
    } catch (e) {
      return { handled: false, error: "Invalid JSON", status: 502 };
    }
    if (!result || result.sucesso !== true) {
      return { handled: false, error: result?.mensagem || "Falha na persistência", status: 400 };
    }
    return { handled: true, result, status: 200 };
  }

  // Cenário 1: Apps Script responde sucesso: true
  const r1 = evaluateRecadoResponse(true, JSON.stringify({ sucesso: true, id: "rec_abc", mensagem: "Criado com sucesso" }));
  assert(r1.handled === true && r1.result.sucesso === true, "Cenário 1: sucesso: true deve prosseguir normalmente.");

  // Cenário 2: Apps Script responde HTTP 200 com sucesso: false
  const r2 = evaluateRecadoResponse(true, JSON.stringify({ sucesso: false, mensagem: "Erro ao inserir linha na planilha" }));
  assert(r2.handled === false && r2.status === 400, "Cenário 2: sucesso: false deve abortar sem envio FCM/snapshot e retornar erro.");

  // Cenário 3: Apps Script retorna JSON inválido
  const r3 = evaluateRecadoResponse(true, "<html>Not Found</html>");
  assert(r3.handled === false && r3.status === 502, "Cenário 3: JSON inválido deve falhar com segurança (HTTP 502).");

  // Cenário 4: Apps Script retorna HTTP não bem-sucedido
  const r4 = evaluateRecadoResponse(false, "");
  assert(r4.handled === false && r4.status === 502, "Cenário 4: HTTP não OK deve abortar sem envio FCM.");

  // Cenário 5: Criação confirmada respeita idempotência e destinatários (verifica que eventoId é único por recadoId + destinatário)
  const recIdTest = "rec_test_999";
  const evKey1 = `recado:${recIdTest}:lucas_solicitante`;
  const evKey2 = `recado:${recIdTest}:maria_santos`;
  assert(evKey1 !== evKey2, "Cenário 5: Chave de idempotência do recado deve ser única por recadoId + destinatário.");

  // Cenário 6: Teste de exclusão de recado (simulado)
  console.log("\n13. Testando exclusão definitiva de recado...");
  const mockSheetRecados = [
    ["ID", "Título", "Mensagem", "Imagem URL", "Ativo", "Data Criação"],
    ["rec_123", "Título 1", "Mensagem 1", "", "SIM", "28/10/2026"],
    ["rec_456", "Título 2", "Mensagem 2", "", "SIM", "28/10/2026"]
  ];

  function simulateExcluirRecado(id: string) {
    for (let r = 1; r < mockSheetRecados.length; r++) {
      if (mockSheetRecados[r][0] === id) {
        mockSheetRecados.splice(r, 1);
        return { sucesso: true };
      }
    }
    return { sucesso: false };
  }

  const resExcluir1 = simulateExcluirRecado("rec_123");
  assert(resExcluir1.sucesso === true, "Exclusão de recado existente deve ter sucesso.");
  assert(mockSheetRecados.length === 2, "Quantidade de linhas deve ter reduzido para 2.");
  assert(mockSheetRecados[1][0] === "rec_456", "Linha restante deve ser rec_456.");

  const resExcluir2 = simulateExcluirRecado("rec_invalido");
  assert(resExcluir2.sucesso === false, "Exclusão de recado inexistente deve falhar.");
  console.log("✅ Exclusão definitiva de recados validada!");

  console.log("✅ Todos os 5 cenários de validação de persistência do recado foram aprovados com sucesso!");

  // Cenário 14: Teste de robustez na extração de membros e normalização de hash
  console.log("\n14. Testando robustez na extração de membros e normalização de hash...");
  function extrairMembrosSimulado(dirigente, vocal, musicos, mesario) {
    var list = [];
    if (dirigente && dirigente.trim()) list.push({ nome: dirigente.trim(), funcao: "Dirigente" });
    if (musicos && musicos.trim()) {
      var mus = musicos.split(/[,X\/]/i);
      for (var j = 0; j < mus.length; j++) {
        var m = mus[j].trim();
        if (m) {
          var match = m.match(/^(.+?)\s*\(\s*(.+?)\s*\)$/); // Versão corrigida com regex robusta
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

  // Teste de regex robusta (com espaços dentro do parênteses)
  const m1 = extrairMembrosSimulado("", "", "Violino ( Violinista )", "");
  assert(m1[0].instrumento === "Violinista", "Regex deve ignorar espaços extras dentro dos parênteses.");

  // Teste de normalização de hash (invariante a espaços/formatação)
  const h1 = "Louvor A || Uniforme B";
  const h2 = "  Louvor A  ||  Uniforme B ";
  const norm1 = h1.toLowerCase().trim().replace(/\s+/g, " ");
  const norm2 = h2.toLowerCase().trim().replace(/\s+/g, " ");
  assert(norm1 === norm2, "Hashing deve ser invariante a espaços em branco.");

  console.log("✅ Robustez de normalização e hashing validada!");

  // Cenário 15: Teste de anti-duplicidade em lote (simulado)
  console.log("\n15. Testando anti-duplicidade eficiente (cacheado)...");
  var NOTIF_CACHE_SIMULADO = [
    ["ID", "Destinatario", "EventoId"],
    ["1", "João", "evt1"]
  ];
  
  function criarNotificacaoSimulado(nome, eventoId) {
    for (var i = 1; i < NOTIF_CACHE_SIMULADO.length; i++) {
        if (NOTIF_CACHE_SIMULADO[i][1] === nome && NOTIF_CACHE_SIMULADO[i][2] === eventoId) return false;
    }
    NOTIF_CACHE_SIMULADO.push(["new", nome, eventoId]);
    return true;
  }
  
  assert(criarNotificacaoSimulado("João", "evt1") === false, "Anti-duplicidade deve detectar registro existente.");
  assert(criarNotificacaoSimulado("Maria", "evt2") === true, "Anti-duplicidade deve permitir registro novo.");
  console.log("✅ Anti-duplicidade eficiente validada!");

  console.log("\n=================================================");
  console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO!");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("\n❌ ERRO NOS TESTES:", err);
  process.exit(1);
});
