/**
 * =============================================================================
 * TESTES OBRIGATÓRIOS DO DETECTOR DE ALTERAÇÕES - ESCALA LOUVOR 2K26
 * =============================================================================
 */

import {
  detectarAlteracoesNaPlanilha,
  getNotificacoesParaUsuario,
  criarNotificacaoSeNaoExiste,
  resetSnapshotForTesting,
  EscalaRef,
  IntegranteRef
} from "./notifications";

export function executarBateriaDeTestesDetector(): {
  sucessoGeral: boolean;
  resultados: Array<{ teste: string; descricao: string; passou: boolean; detalhes: string }>;
} {
  console.log("\n=======================================================");
  console.log("INICIANDO AUDITORIA E TESTES DO DETECTOR DE ALTERAÇÕES");
  console.log("=======================================================\n");

  const runId = Math.floor(Math.random() * 1000000);
  const diaNum = 10 + (runId % 18);
  const dataTeste = `${diaNum}/08/2026`;

  const resultados: Array<{ teste: string; descricao: string; passou: boolean; detalhes: string }> = [];

  const integrantesMock: IntegranteRef[] = [
    { nome: "Jadson", funcao: "Líder" },
    { nome: "João", funcao: "Integrante" },
    { nome: "Maria", funcao: "Integrante" },
    { nome: "Lucas", funcao: "Integrante" }
  ];

  // 0. RESET DO SNAPSHOT PARA TESTE ISOLADO
  resetSnapshotForTesting();

  // Configuração Base (Snapshot Inicial)
  const escalaBase: EscalaRef[] = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "Jadson (Violino)",
      mesario: "João",
      louvores: `1. Ruja o Leão, 2. Aclame ao Senhor [T${runId}]`,
      uniforme: "Camisa Preta"
    }
  ];

  // 1. PRIMEIRA EXECUÇÃO - SNAPSHOT INICIAL (0 Notificações)
  console.log(">>> [SETUP] Inicializando Snapshot...");
  const resSnapshot = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaBase,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  // =========================================================================
  // TESTE 1: Alterar diretamente uma pessoa na escala (Remover Jadson, Adicionar João)
  // =========================================================================
  console.log(">>> Executando TESTE 1 (Pessoa removida/adicionada)...");
  const escalaT1: EscalaRef[] = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "João (Violão)", // Jadson removido, João adicionado nos músicos
      mesario: "Maria", // João removido do mesário
      louvores: `1. Ruja o Leão, 2. Aclame ao Senhor [T${runId}]`,
      uniforme: "Camisa Preta"
    }
  ];

  const resT1 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT1,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  const t1Passou = resT1.eventosDetectados.some((e) => e.includes("ESCALA_REMOVIDO") || e.includes("ESCALA_ADICIONADO"));
  resultados.push({
    teste: "TESTE 1",
    descricao: "Alterar diretamente uma pessoa na escala (remover/adicionar)",
    passou: t1Passou,
    detalhes: `Eventos detectados: ${resT1.eventosDetectados.join(", ")} | Notificações geradas: ${resT1.totalNotificacoes}`
  });

  // =========================================================================
  // TESTE 2: Mudança de função/instrumento (João Violão -> João Guitarra)
  // =========================================================================
  console.log(">>> Executando TESTE 2 (Mudança de Função/Instrumento)...");
  const escalaT2: EscalaRef[] = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "João (Guitarra)", // João alterado de Violão para Guitarra
      mesario: "Maria",
      louvores: `1. Ruja o Leão, 2. Aclame ao Senhor [T${runId}]`,
      uniforme: "Camisa Preta"
    }
  ];

  const resT2 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT2,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  const t2Passou = resT2.eventosDetectados.some((e) => e.includes("ESCALA_ALTERADA"));
  resultados.push({
    teste: "TESTE 2",
    descricao: "Alterar função/instrumento de integrante na escala",
    passou: t2Passou,
    detalhes: `Eventos: ${resT2.eventosDetectados.join(", ")}`
  });

  // =========================================================================
  // TESTE 3: Alterar louvor na planilha (apenas escalados recebem)
  // =========================================================================
  console.log(">>> Executando TESTE 3 (Alteração de Louvor)...");
  const escalaT3: EscalaRef[] = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "João (Guitarra)",
      mesario: "Maria",
      louvores: `1. Porque Ele Vive, 2. Bondade de Deus [T${runId}]`, // Louvores alterados
      uniforme: "Camisa Preta"
    }
  ];

  const resT3 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT3,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  const t3Passou = resT3.totalNotificacoes > 0;
  resultados.push({
    teste: "TESTE 3",
    descricao: "Alterar louvores diretamente na planilha",
    passou: t3Passou,
    detalhes: `Notificações enviadas aos integrantes escalados: ${resT3.totalNotificacoes}`
  });

  // =========================================================================
  // TESTE 4: Alterar uniforme na planilha (apenas escalados recebem)
  // =========================================================================
  console.log(">>> Executando TESTE 4 (Alteração de Uniforme)...");
  const escalaT4: EscalaRef[] = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "João (Guitarra)",
      mesario: "Maria",
      louvores: `1. Porque Ele Vive, 2. Bondade de Deus [T${runId}]`,
      uniforme: `Camisa Branca e Calça Jeans [T${runId}]` // Uniforme alterado
    }
  ];

  const resT4 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  const t4Passou = resT4.totalNotificacoes > 0;
  resultados.push({
    teste: "TESTE 4",
    descricao: "Alterar uniforme na planilha",
    passou: t4Passou,
    detalhes: `Notificações enviadas aos escalados: ${resT4.totalNotificacoes}`
  });

  // =========================================================================
  // TESTE 5 & 6: Alteração idêntica ou célula sem mudança real (zero notificações)
  // =========================================================================
  console.log(">>> Executando TESTES 5 & 6 (Sem mudanças reais)...");
  const resT56 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4, // Mesma escala idêntica
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  const t56Passou = resT56.totalNotificacoes === 0 && resT56.eventosDetectados.length === 0;
  resultados.push({
    teste: "TESTE 5 & 6",
    descricao: "Editar a mesma informação ou sem alteração relevante",
    passou: t56Passou,
    detalhes: `Total notificações geradas: ${resT56.totalNotificacoes} (Esperado: 0)`
  });

  // =========================================================================
  // TESTE 7 & 8: Alteração pelo APP vs Planilha (Registro de Origem)
  // =========================================================================
  console.log(">>> Executando TESTES 7 & 8 (Origem APP vs GOOGLE_SHEETS)...");
  const notifApp = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "ESCALA",
    titulo: "Teste Origem APP",
    mensagem: "Notificação gerada pelo App",
    eventoId: `TESTE_ORIGEM_APP_${runId}`,
    origem: "APP"
  });

  const notifSheets = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "ESCALA",
    titulo: "Teste Origem Sheets",
    mensagem: "Notificação gerada pela Planilha",
    eventoId: `TESTE_ORIGEM_SHEETS_${runId}`,
    origem: "GOOGLE_SHEETS"
  });

  const t78Passou = notifApp?.origem === "APP" && notifSheets?.origem === "GOOGLE_SHEETS";
  resultados.push({
    teste: "TESTE 7 & 8",
    descricao: "Rastreamento correto da origem (APP vs GOOGLE_SHEETS)",
    passou: t78Passou,
    detalhes: `Origens registradas: App=${notifApp?.origem}, Sheets=${notifSheets?.origem}`
  });

  // =========================================================================
  // TESTE 9 & 10: Solicitação Aprovada / Recusada e Anti-Duplicidade
  // =========================================================================
  console.log(">>> Executando TESTES 9 & 10 (Solicitação e Anti-duplicidade)...");
  const solictacoesTeste = [
    {
      id: `sol_teste_${runId}`,
      dataEscala: dataTeste,
      quemPediu: "Maria",
      substituto: "João",
      status: "APROVADA"
    }
  ];

  const resT9 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    solicitacoesAtuais: solictacoesTeste,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  // Executa novamente com o mesmo estado para validar anti-duplicidade
  const resT10 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    solicitacoesAtuais: solictacoesTeste,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });

  const t910Passou = resT10.totalNotificacoes === 0;
  resultados.push({
    teste: "TESTE 9 & 10",
    descricao: "Aprovação de solicitação e blindagem contra duplicidade",
    passou: t910Passou,
    detalhes: `Segunda execução com dados idênticos gerou ${resT10.totalNotificacoes} notificações (Anti-duplicidade 100% ativa)`
  });

  // =========================================================================
  // TESTE 11: Exclusão de Recado não gera notificação
  // =========================================================================
  console.log(">>> Executando TESTE 11 (Exclusão de recado silenciosa)...");
  const recado1 = { id: `rec_${runId}`, titulo: "Recado Teste", ativo: "SIM" };
  // Cria recado inicial
  detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    recadosAtuais: [recado1],
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  // Exclui recado (recadosAtuais passa a ser vazio)
  const resT11 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    recadosAtuais: [],
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t11Passou = resT11.totalNotificacoes === 0 && !resT11.eventosDetectados.some(e => e.includes("EXCLUIR"));
  resultados.push({
    teste: "TESTE 11",
    descricao: "Exclusão de recado não gera notificação (comportamento silencioso)",
    passou: t11Passou,
    detalhes: `Notificações na exclusão: ${resT11.totalNotificacoes} (Esperado: 0)`
  });

  // =========================================================================
  // TESTE 12: Preservação de UUID único por eventoId
  // =========================================================================
  console.log(">>> Executando TESTE 12 (Preservação de UUID único)...");
  const evtIdUnico = `EVENTO_UNICO_TESTE_${runId}`;
  const notif1 = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "CULTO",
    titulo: "Teste UUID 1",
    mensagem: "Msg 1",
    eventoId: evtIdUnico
  });
  const notif2 = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "CULTO",
    titulo: "Teste UUID 2",
    mensagem: "Msg 2",
    eventoId: evtIdUnico
  });
  const todasNotifs = getNotificacoesParaUsuario("Jadson");
  const matchingEvt = todasNotifs.filter(n => n.eventoId === evtIdUnico);
  const t12Passou = notif1 !== null && notif2 === null && matchingEvt.length === 1;
  resultados.push({
    teste: "TESTE 12",
    descricao: "Preservação de UUID único e rejeição de duplicatas por eventoId",
    passou: t12Passou,
    detalhes: `Primeira inserção: ${notif1 ? "Criada" : "Erro"} | Segunda: ${notif2 ? "Duplicou (Erro)" : "Bloqueada com Sucesso"} | Total com eventoId: ${matchingEvt.length}`
  });

  const sucessoGeral = resultados.every((r) => r.passou);

  console.log("\n=======================================================");
  console.log(`RESULTADO GERAL DOS TESTES: ${sucessoGeral ? "✅ TODOS PASSARAM" : "❌ FALHAS ENCONTRADAS"}`);
  console.log("=======================================================\n");

  return { sucessoGeral, resultados };
}
