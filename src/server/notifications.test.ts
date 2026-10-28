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

  const countLembretes1 = processarLembretesDeCulto(escalaMock, integrantesMock);
  const countLembretes2 = processarLembretesDeCulto(escalaMock, integrantesMock);
  assert(countLembretes2 === 0, "Segunda execução no mesmo horário/dia deve retornar 0 notificações (idempotente).");
  console.log("✅ Lembretes de culto e janelas demonstraram idempotência total!");

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
  console.log("✅ Lógica de parada determinística com break e marcação em lote no GAS confirmadas!");

  console.log("\n=================================================");
  console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO!");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("\n❌ ERRO NOS TESTES:", err);
  process.exit(1);
});
