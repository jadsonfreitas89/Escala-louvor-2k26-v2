import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface NotificacaoRecord {
  id: string;
  destinatario: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: string; // ISO 8601 string
  dataHora?: string;
  lida: "SIM" | "NAO";
  eventoId?: string;
  origem?: "APP" | "GOOGLE_SHEETS" | string;
}

export interface IntegranteRef {
  nome: string;
  funcao?: string;
}

export interface EscalaRef {
  data: string;
  dirigente?: string;
  vocal?: string;
  musicos?: string;
  mesario?: string;
  louvores?: string;
  uniforme?: string;
}

export interface EscalaMemberInfo {
  nome: string;
  funcao: string;
  instrumento?: string;
}

export interface EscalaSnapshotItem {
  data: string;
  dirigente: string;
  vocal: string;
  musicos: string;
  mesario: string;
  louvores: string;
  uniforme: string;
  membros: EscalaMemberInfo[];
  louvoresHash?: string;
}

export interface SheetsSnapshot {
  initialized: boolean;
  timestamp: string;
  escalas: Record<string, EscalaSnapshotItem>;
  solicitacoes: Record<string, { status: string; quemPediu: string; substituto: string; dataEscala: string }>;
  recados: Record<string, { id: string; titulo: string; ativo: string }>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "notificacoes_db.json");
const HASHES_FILE = path.join(DATA_DIR, "louvores_hashes.json");
const SNAPSHOT_FILE = path.join(DATA_DIR, "sheets_snapshot.json");
const READ_KEYS_FILE = path.join(DATA_DIR, "notificacoes_lidas.json");

// Memória local
let localNotificacoes: NotificacaoRecord[] = [];
let louvoresHashes: Record<string, string> = {};
let markedReadKeys: Set<string> = new Set();
let currentSnapshot: SheetsSnapshot = {
  initialized: false,
  timestamp: new Date().toISOString(),
  escalas: {},
  solicitacoes: {},
  recados: {}
};

/**
 * Garante que o diretório de dados exista
 */
function ensureDataDir() {
  if (process.env.VERCEL) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Erro ao criar diretório data:", err);
  }
}

/**
 * Carrega notificações do arquivo persistente
 */
export function loadNotifications(): NotificacaoRecord[] {
  if (!process.env.VERCEL) {
    ensureDataDir();
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      localNotificacoes = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Aviso ao ler notificacoes_db.json:", err);
    localNotificacoes = [];
  }

  try {
    if (fs.existsSync(READ_KEYS_FILE)) {
      const raw = fs.readFileSync(READ_KEYS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        markedReadKeys = new Set(list.map((k) => String(k).trim()).filter(Boolean));
      }
    }
  } catch (err) {
    markedReadKeys = new Set();
  }

  // Preenche markedReadKeys com as notificações que já estão salvas como SIM
  for (const n of localNotificacoes) {
    if (n.lida === "SIM") {
      if (n.id) markedReadKeys.add(n.id.trim());
      if (n.eventoId) markedReadKeys.add(`evt:${n.eventoId.trim()}`);
      const normDest = normalizarNome(n.destinatario);
      if (normDest && n.eventoId) markedReadKeys.add(`user_evt:${normDest}_${n.eventoId.trim()}`);
    }
  }

  try {
    if (fs.existsSync(HASHES_FILE)) {
      const raw = fs.readFileSync(HASHES_FILE, "utf-8");
      louvoresHashes = JSON.parse(raw);
    }
  } catch (err) {
    louvoresHashes = {};
  }

  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(SNAPSHOT_FILE, "utf-8");
      currentSnapshot = JSON.parse(raw);
    }
  } catch (err) {
    currentSnapshot = {
      initialized: false,
      timestamp: new Date().toISOString(),
      escalas: {},
      solicitacoes: {},
      recados: {}
    };
  }

  return localNotificacoes;
}

/**
 * Salva chaves de notificações lidas no disco
 */
export function saveMarkedReadKeys() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    const list = Array.from(markedReadKeys);
    fs.writeFileSync(READ_KEYS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar notificacoes_lidas.json:", err);
  }
}

/**
 * Salva notificações no disco
 */
export function saveNotifications() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localNotificacoes, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar notificacoes_db.json:", err);
  }
}

/**
 * Salva hashes de louvores no disco
 */
function saveLouvoresHashes() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    fs.writeFileSync(HASHES_FILE, JSON.stringify(louvoresHashes, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar louvores_hashes.json:", err);
  }
}

/**
 * Salva snapshot do Google Sheets no disco
 */
export function saveSheetsSnapshot() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(currentSnapshot, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar sheets_snapshot.json:", err);
  }
}

/**
 * Retorna o snapshot atual da planilha
 */
export function getSheetsSnapshot(): SheetsSnapshot {
  return currentSnapshot;
}

// Inicializa na importação
loadNotifications();

/**
 * Normaliza nomes para correspondência resiliente (sem acentos e minúsculo)
 */
export function normalizarNome(txt: string | null | undefined): string {
  if (!txt) return "";
  return txt
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Verifica se uma data em formato dd/MM/yyyy já passou em relação à data atual em São Paulo
 */
export function isDateInPast(dataCultoStr: string): boolean {
  if (!dataCultoStr) return false;
  const match = dataCultoStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return false;
  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const ano = parseInt(match[3], 10);

  const sp = getSaoPauloNow();
  const spMatch = sp.dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!spMatch) return false;
  const spDia = parseInt(spMatch[1], 10);
  const spMes = parseInt(spMatch[2], 10);
  const spAno = parseInt(spMatch[3], 10);

  if (ano < spAno) return true;
  if (ano > spAno) return false;
  if (mes < spMes) return true;
  if (mes > spMes) return false;
  return dia < spDia;
}

/**
 * Extrai todos os membros com suas funções e instrumentos de uma linha da escala
 */
export function extrairMembrosDaEscala(escala: EscalaRef): EscalaMemberInfo[] {
  const result: EscalaMemberInfo[] = [];
  if (!escala) return result;

  // 1. Dirigente
  if (escala.dirigente && escala.dirigente.trim()) {
    const nomeDir = escala.dirigente.trim();
    result.push({
      nome: nomeDir,
      funcao: "Dirigente"
    });
  }

  // 2. Mesário
  if (escala.mesario && escala.mesario.trim()) {
    const nomeMes = escala.mesario.trim();
    result.push({
      nome: nomeMes,
      funcao: "Mesário de Som"
    });
  }

  // 3. Vocal
  if (escala.vocal && escala.vocal.trim()) {
    const vocals = escala.vocal
      .split(/[,X\/]/i)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    for (const v of vocals) {
      if (!result.some((m) => normalizarNome(m.nome) === normalizarNome(v))) {
        result.push({
          nome: v,
          funcao: "Vocal"
        });
      }
    }
  }

  // 4. Músicos (com possível instrumento entre parênteses ex: "Jadson (Violino)")
  if (escala.musicos && escala.musicos.trim()) {
    const rawMusicos = escala.musicos
      .split(/[,X\/]/i)
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    for (const item of rawMusicos) {
      const matchInst = item.match(/^(.+?)\s*\((.+?)\)$/);
      let nome = item;
      let instrumento: string | undefined = undefined;

      if (matchInst) {
        nome = matchInst[1].trim();
        instrumento = matchInst[2].trim();
      }

      if (nome) {
        const existingIdx = result.findIndex((m) => normalizarNome(m.nome) === normalizarNome(nome));
        if (existingIdx >= 0) {
          result[existingIdx].instrumento = instrumento;
        } else {
          result.push({
            nome,
            funcao: "Músico",
            instrumento
          });
        }
      }
    }
  }

  return result;
}

/**
 * Formata e exibe log estruturado no padrão [CHANGE-DETECTOR]
 */
export function logChangeDetector(params: {
  aba: string;
  linha?: string | number;
  data?: string;
  alteracaoDetectada: string;
  estadoAnterior: string;
  estadoAtual: string;
  eventoId: string;
  destinatarios: string;
  notificacaoCriada: string;
  origem: "APP" | "GOOGLE_SHEETS" | string;
}) {
  console.log(`\n[CHANGE-DETECTOR]`);
  console.log(`aba: ${params.aba}`);
  if (params.linha !== undefined) console.log(`linha: ${params.linha}`);
  if (params.data) console.log(`data: ${params.data}`);
  console.log(`alteração detectada: ${params.alteracaoDetectada}`);
  console.log(`estado anterior: ${params.estadoAnterior}`);
  console.log(`estado atual: ${params.estadoAtual}`);
  console.log(`eventoId: ${params.eventoId}`);
  console.log(`destinatários: ${params.destinatarios}`);
  console.log(`notificação criada: ${params.notificacaoCriada}`);
  console.log(`origem: ${params.origem}\n`);
}

/**
 * Verifica se um integrante está na escala
 */
export function isUserInEscala(escala: EscalaRef | null | undefined, nome: string): boolean {
  if (!escala || !nome) return false;
  const search = normalizarNome(nome);
  if (!search) return false;

  const campos = [
    escala.dirigente,
    escala.vocal,
    escala.musicos,
    escala.mesario
  ];

  for (const c of campos) {
    if (c && normalizarNome(c).includes(search)) {
      return true;
    }
  }
  return false;
}

/**
 * Retorna hora, minuto, dia da semana e data no fuso de São Paulo
 */
export function getSaoPauloNow(): {
  dateStr: string; // "dd/MM/yyyy"
  isoDate: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 5 = Sexta, 6 = Sábado
  timeStr: string; // "HH:mm"
  totalMinutes: number; // hours * 60 + minutes
} {
  const now = new Date();

  // Formata partes individuais no fuso America/Sao_Paulo
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  let year = "2026";
  let month = "01";
  let day = "01";
  let hour = "00";
  let minute = "00";

  for (const p of parts) {
    if (p.type === "year") year = p.value;
    if (p.type === "month") month = p.value;
    if (p.type === "day") day = p.value;
    if (p.type === "hour") hour = p.value;
    if (p.type === "minute") minute = p.value;
  }

  // Se hour for 24, normaliza para 00
  if (hour === "24") hour = "00";

  const dateStr = `${day}/${month}/${year}`;
  const isoDate = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;
  const totalMinutes = parseInt(hour, 10) * 60 + parseInt(minute, 10);

  // Calcula dia da semana no fuso de SP
  const spDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  const dayOfWeek = spDate.getDay();

  return {
    dateStr,
    isoDate,
    dayOfWeek,
    timeStr,
    totalMinutes
  };
}

/**
 * Helper para verificar se uma notificação já foi marcada como lida pelo ID ou pelo EventoId
 */
export function isKeyMarkedRead(id?: string, eventoId?: string, destinatario?: string): boolean {
  if (id && markedReadKeys.has(id.trim())) return true;
  if (eventoId) {
    const cleanEvt = eventoId.trim();
    if (markedReadKeys.has(`evt:${cleanEvt}`)) return true;
    if (destinatario) {
      const normDest = normalizarNome(destinatario);
      if (normDest && markedReadKeys.has(`user_evt:${normDest}_${cleanEvt}`)) return true;
    }
  }
  return false;
}

/**
 * Registra as chaves de uma notificação como lidas no set persistente
 */
export function registrarChavesComoLidas(params: { id?: string; eventoId?: string; destinatario?: string }) {
  const { id, eventoId, destinatario } = params;
  let changed = false;
  if (id && id.trim()) {
    const cleanId = id.trim();
    if (!markedReadKeys.has(cleanId)) {
      markedReadKeys.add(cleanId);
      changed = true;
    }
  }
  if (eventoId && eventoId.trim()) {
    const cleanEvt = eventoId.trim();
    if (!markedReadKeys.has(`evt:${cleanEvt}`)) {
      markedReadKeys.add(`evt:${cleanEvt}`);
      changed = true;
    }
    if (destinatario) {
      const normDest = normalizarNome(destinatario);
      if (normDest && !markedReadKeys.has(`user_evt:${normDest}_${cleanEvt}`)) {
        markedReadKeys.add(`user_evt:${normDest}_${cleanEvt}`);
        changed = true;
      }
    }
  }
  if (changed) {
    saveMarkedReadKeys();
  }
}

/**
 * Função central estrita contra duplicidade
 * Verifica se já existe uma notificação com o mesmo (destinatario + eventoId) ou mesmo ID.
 * Se já existir, NÃO recria, preserva os dados originais (data, lida, id, origem).
 */
import { sendFcmPushToUser } from "./fcmService";

// ...

export function criarNotificacaoSeNaoExiste(params: {
  id?: string;
  destinatario: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  eventoId: string;
  origem?: "APP" | "GOOGLE_SHEETS" | string;
}): NotificacaoRecord | null {
  const { id: customId, destinatario, tipo, titulo, mensagem, eventoId, origem } = params;

  if (!destinatario || !eventoId) {
    return null;
  }

  const normDest = normalizarNome(destinatario);
  const normEvento = eventoId.trim();
  const cleanCustomId = customId ? customId.trim() : "";

  // Verifica se já existe notificação com este (destinatário + eventoId) ou com o mesmo ID
  const existing = localNotificacoes.find((n) => {
    if (cleanCustomId && n.id && n.id.trim() === cleanCustomId) {
      return true;
    }
    const nDest = normalizarNome(n.destinatario);
    const nEvento = (n.eventoId || "").trim();
    return (nDest === normDest || nDest === "todos") && nEvento === normEvento;
  });

  if (existing) {
    return null; // Preserva integralmente o registro existente sem recriar novo UUID
  }

  // Se o eventoId já foi marcado como lido anteriormente para este usuário, cria diretamente como LIDA
  const jaFoiLida = isKeyMarkedRead(cleanCustomId, normEvento, destinatario);

  const nowIso = new Date().toISOString();
  const novaNotif: NotificacaoRecord = {
    id: cleanCustomId || crypto.randomUUID(),
    destinatario: destinatario.trim(),
    titulo: titulo.trim(),
    mensagem: mensagem.trim(),
    tipo: tipo.trim().toUpperCase(),
    data: nowIso,
    dataHora: nowIso,
    lida: jaFoiLida ? "SIM" : "NAO",
    eventoId: normEvento,
    origem: origem || "APP"
  };

  localNotificacoes.unshift(novaNotif);
  saveNotifications();

  // Envia assincronamente para o FCM
  sendFcmPushToUser(destinatario, {
    title: titulo,
    body: mensagem,
    id: novaNotif.id,
    eventoId: novaNotif.eventoId,
    type: novaNotif.tipo
  }).catch(err => console.error("[FCM] Erro ao disparar push:", err));

  // Envia assincronamente para a planilha se configurado
  if (origem !== "GOOGLE_SHEETS") {
    pushNotificacaoParaGas(novaNotif);
  }

  return novaNotif;
}

let gasApiUrlConfigured = "";
export function setGasApiUrlForNotifications(url: string) {
  gasApiUrlConfigured = url;
}

/**
 * Envia notificação individual de forma não bloqueante para a aba NOTIFICAÇÕES do Google Sheets
 */
export async function pushNotificacaoParaGas(notif: NotificacaoRecord) {
  if (!gasApiUrlConfigured) return;
  try {
    const form = new URLSearchParams({
      action: "criarNotificacao",
      id: notif.id,
      destinatario: notif.destinatario,
      titulo: notif.titulo,
      mensagem: notif.mensagem,
      tipo: notif.tipo,
      data: notif.data,
      lida: notif.lida,
      eventoId: notif.eventoId || "",
      origem: notif.origem || "APP"
    });

    await fetch(gasApiUrlConfigured, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: form.toString()
    });
  } catch (err) {
    // Ignora erro em background
  }
}

/**
 * Envia lote de notificações para a aba NOTIFICAÇÕES do Google Sheets
 */
export async function pushNotificacoesLoteParaGas(notifs: NotificacaoRecord[]) {
  if (!gasApiUrlConfigured || !notifs || notifs.length === 0) return;
  try {
    const form = new URLSearchParams({
      action: "salvarNotificacoesEmLote",
      notificacoes: JSON.stringify(notifs)
    });

    await fetch(gasApiUrlConfigured, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: form.toString()
    });
  } catch (err) {
    // Ignora erro em background
  }
}

/**
 * Mescla notificações vindas do Google Apps Script com a base local
 */
export function mergeGasNotifications(gasList: any[]): NotificacaoRecord[] {
  if (!Array.isArray(gasList)) return localNotificacoes;

  let hasNew = false;
  for (const item of gasList) {
    if (!item || !item.id) continue;

    const normDest = normalizarNome(item.destinatario);
    const cleanId = String(item.id).trim();
    const cleanEvento = item.eventoId ? String(item.eventoId).trim() : "";
    const cleanTitulo = (item.titulo || "").trim().toLowerCase();
    const cleanMensagem = (item.mensagem || "").trim().toLowerCase();

    // Checa se esta notificação já foi marcada como lida pelo registro persistente
    const jaFoiMarcadaLida = isKeyMarkedRead(cleanId, cleanEvento, item.destinatario) ||
      String(item.lida || "").toUpperCase() === "SIM";

    const existing = localNotificacoes.find((n) => {
      if (cleanId && n.id === cleanId) return true;
      if (cleanEvento && n.eventoId && n.eventoId === cleanEvento && normalizarNome(n.destinatario) === normDest) {
        return true;
      }
      if (normDest && normalizarNome(n.destinatario) === normDest && (n.titulo || "").trim().toLowerCase() === cleanTitulo && (n.mensagem || "").trim().toLowerCase() === cleanMensagem) {
        return true;
      }
      return false;
    });

    if (existing) {
      // Se o item local já foi marcado como lido (SIM) ou está no registro de lidos, NUNCA retrocede para não lido
      if (existing.lida === "SIM" || jaFoiMarcadaLida) {
        if (existing.lida !== "SIM") {
          existing.lida = "SIM";
          hasNew = true;
        }
        registrarChavesComoLidas({ id: existing.id, eventoId: existing.eventoId, destinatario: existing.destinatario });
      } else if (item.lida && String(item.lida).toUpperCase() === "SIM") {
        existing.lida = "SIM";
        hasNew = true;
        registrarChavesComoLidas({ id: existing.id, eventoId: existing.eventoId, destinatario: existing.destinatario });
      }
    } else {
      // Adiciona item do GAS preservando status lido se já constava como lido
      const statusLida: "SIM" | "NAO" = jaFoiMarcadaLida ? "SIM" : "NAO";
      const novaNotif: NotificacaoRecord = {
        id: cleanId || crypto.randomUUID(),
        destinatario: item.destinatario || "TODOS",
        titulo: item.titulo || "Notificação",
        mensagem: item.mensagem || "",
        tipo: (item.tipo || "GERAL").toUpperCase(),
        data: item.data || item.dataHora || new Date().toISOString(),
        dataHora: item.dataHora || item.data || new Date().toISOString(),
        lida: statusLida,
        eventoId: cleanEvento || undefined,
        origem: item.origem || "GOOGLE_SHEETS"
      };
      localNotificacoes.push(novaNotif);
      if (statusLida === "SIM") {
        registrarChavesComoLidas({ id: novaNotif.id, eventoId: novaNotif.eventoId, destinatario: novaNotif.destinatario });
      }
      hasNew = true;
    }
  }

  if (hasNew) {
    saveNotifications();
  }

  return localNotificacoes;
}

/**
 * Obtém as notificações visíveis para um usuário autenticado com garantia de não retrocesso
 */
export function getNotificacoesParaUsuario(nomeUsuario: string): NotificacaoRecord[] {
  const normUser = normalizarNome(nomeUsuario);
  return localNotificacoes
    .filter((n) => {
      const normDest = normalizarNome(n.destinatario);
      return normDest === normUser || normDest === "todos" || normDest === "todos os membros" || normDest === "geral";
    })
    .map((n) => {
      // Garante que se constar em markedReadKeys, retorna estritamente como SIM
      if (n.lida !== "SIM" && isKeyMarkedRead(n.id, n.eventoId, n.destinatario)) {
        n.lida = "SIM";
      }
      return n;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/**
 * Marca notificação como lida por ID ou EventoId
 */
export function marcarComoLidaLocal(idOrEventoId: string): boolean {
  const clean = String(idOrEventoId || "").trim();
  if (!clean) return false;
  let found = false;
  for (const n of localNotificacoes) {
    if (n.id === clean || (n.eventoId && n.eventoId === clean)) {
      n.lida = "SIM";
      registrarChavesComoLidas({ id: n.id, eventoId: n.eventoId, destinatario: n.destinatario });
      found = true;
    }
  }
  // Registra a chave genérica também
  registrarChavesComoLidas({ id: clean, eventoId: clean });

  if (found) {
    saveNotifications();
    return true;
  }
  return true;
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export function marcarTodasComoLidasLocal(nomeUsuario: string): number {
  const normUser = normalizarNome(nomeUsuario);
  let count = 0;
  for (const n of localNotificacoes) {
    const normDest = normalizarNome(n.destinatario);
    if (normDest === normUser || normDest === "todos" || normDest === "todos os membros" || normDest === "geral") {
      n.lida = "SIM";
      registrarChavesComoLidas({ id: n.id, eventoId: n.eventoId, destinatario: n.destinatario });
      count++;
    }
  }
  if (count > 0) {
    saveNotifications();
  }
  return count;
}

// =============================================================================
// REGRAS DE DISPARO DE EVENTOS OFICIAIS
// =============================================================================

/**
 * 1. Agendamento dos Cultos (Terça, Sexta e Domingo nos horários oficiais)
 * - Terça: 09:00, 12:00, 15:00, 18:00, 19:00
 * - Sexta: 09:00, 12:00, 15:00, 18:00, 19:00
 * - Domingo: 10:00, 13:00, 15:30, 17:00
 */
export function processarLembretesDeCulto(
  escalas: EscalaRef[],
  integrantes: IntegranteRef[]
): number {
  if (!escalas || escalas.length === 0 || !integrantes || integrantes.length === 0) {
    return 0;
  }

  const sp = getSaoPauloNow();
  const { dateStr, isoDate, dayOfWeek, totalMinutes } = sp;

  let slots: { slot: string; slotMinutes: number }[] = [];

  if (dayOfWeek === 2 || dayOfWeek === 5) {
    slots = [
      { slot: "09:00", slotMinutes: 9 * 60 },
      { slot: "12:00", slotMinutes: 12 * 60 },
      { slot: "15:00", slotMinutes: 15 * 60 },
      { slot: "18:00", slotMinutes: 18 * 60 },
      { slot: "19:00", slotMinutes: 19 * 60 }
    ];
  } else if (dayOfWeek === 0) {
    slots = [
      { slot: "10:00", slotMinutes: 10 * 60 },
      { slot: "13:00", slotMinutes: 13 * 60 },
      { slot: "15:30", slotMinutes: 15 * 60 + 30 },
      { slot: "17:00", slotMinutes: 17 * 60 }
    ];
  } else {
    return 0;
  }

  const escalaHoje = escalas.find((e) => {
    if (!e || !e.data) return false;
    const cleanE = e.data.trim().replace(/[^0-9/]/g, "");
    const cleanHoje = dateStr.replace(/[^0-9/]/g, "");
    return cleanE === cleanHoje;
  });

  if (!escalaHoje) {
    return 0;
  }

  // Identifica os slots do dia que já chegaram
  const validSlots = slots.filter((s) => totalMinutes >= s.slotMinutes);
  if (validSlots.length === 0) return 0;

  // Usa o slot mais recente ativo no momento
  const currentSlot = validSlots[validSlots.length - 1];
  const slotCode = currentSlot.slot.replace(":", "-");

  const membrosEscalados = extrairMembrosDaEscala(escalaHoje);
  let totalCriadas = 0;

  for (const integrante of integrantes) {
    if (!integrante || !integrante.nome) continue;
    const normUser = normalizarNome(integrante.nome).replace(/\s+/g, "_");

    // Deduplicação estrita por chave lógica: TIPO + DATA + HORA + USUARIO
    const eventoId = `CULTO_${isoDate}_${slotCode}_${normUser}`;

    const membroInfo = membrosEscalados.find(
      (m) => normalizarNome(m.nome) === normalizarNome(integrante.nome)
    );
    const estaEscalado = Boolean(membroInfo) || isUserInEscala(escalaHoje, integrante.nome);

    let titulo: string;
    let mensagem: string;
    let tipo: string;

    if (estaEscalado) {
      titulo = "Culto Hoje";
      const detalheFuncao = membroInfo
        ? (membroInfo.instrumento ? `${membroInfo.funcao} (${membroInfo.instrumento})` : membroInfo.funcao)
        : "a equipe";
      mensagem = `${integrante.nome}, a Paz! Hoje tem culto e você está escalado(a) como ${detalheFuncao}!`;
      tipo = "CULTO";
    } else {
      titulo = "Lembrete de Culto";
      mensagem = "Olha que benção! Passando pra lembrar que hoje tem culto!";
      tipo = "LEMBRETE";
    }

    const notif = criarNotificacaoSeNaoExiste({
      destinatario: integrante.nome,
      tipo,
      titulo,
      mensagem,
      eventoId,
      origem: "APP"
    });

    if (notif) {
      totalCriadas++;
    }
  }

  return totalCriadas;
}

/**
 * 2. Novo Recado Publicado
 * Mensagem: "ATENÇÃO! Tem um novo recado!"
 */
export function processarNotificacaoNovoRecado(
  recadoId: string,
  integrantes: IntegranteRef[],
  origem: "APP" | "GOOGLE_SHEETS" = "APP"
): number {
  if (!recadoId) return 0;
  const eventoId = `NOVO_RECADO_${recadoId}`;
  let count = 0;

  for (const integrante of integrantes) {
    if (!integrante || !integrante.nome) continue;
    const n = criarNotificacaoSeNaoExiste({
      destinatario: integrante.nome,
      tipo: "NOVO_RECADO",
      titulo: "Novo Recado",
      mensagem: "ATENÇÃO! Tem um novo recado!",
      eventoId,
      origem
    });
    if (n) count++;
  }

  if (count > 0) {
    logChangeDetector({
      aba: "RECADOS",
      linha: recadoId,
      alteracaoDetectada: "Novo recado inserido",
      estadoAnterior: "(vazio)",
      estadoAtual: `ID: ${recadoId}`,
      eventoId,
      destinatarios: "Todos os integrantes",
      notificacaoCriada: "ATENÇÃO! Tem um novo recado!",
      origem
    });
  }

  return count;
}

/**
 * 3. Nova Escala Publicada (Líder aciona botão oficial)
 * Mensagem EXATA: "ATENÇÃO!! NOVA ESCALA DISPONIVEL"
 * eventoId: NOVA_ESCALA_YYYY_MM
 */
export function processarNotificacaoNovaEscala(
  mesParam: string | undefined,
  integrantes: IntegranteRef[],
  origem: "APP" | "GOOGLE_SHEETS" = "APP"
): { sucesso: boolean; jaEnviada?: boolean; mensagem: string; totalEnviadas?: number } {
  const sp = getSaoPauloNow();
  let mesKey = sp.isoDate.substring(0, 7).replace("-", "_");

  if (mesParam && typeof mesParam === "string" && mesParam.trim()) {
    const clean = mesParam.trim().replace(/[^0-9]/g, "_");
    if (clean.length >= 6) {
      mesKey = clean;
    }
  }

  const eventoId = `NOVA_ESCALA_${mesKey}`;

  const jaExiste = localNotificacoes.some((n) => (n.eventoId || "").trim() === eventoId);
  if (jaExiste) {
    return {
      sucesso: false,
      jaEnviada: true,
      mensagem: "A notificação da nova escala deste mês já foi enviada."
    };
  }

  let count = 0;
  for (const integrante of integrantes) {
    if (!integrante || !integrante.nome) continue;
    const n = criarNotificacaoSeNaoExiste({
      destinatario: integrante.nome,
      tipo: "NOVA_ESCALA",
      titulo: "Nova Escala",
      mensagem: "ATENÇÃO!! NOVA ESCALA DISPONIVEL",
      eventoId,
      origem
    });
    if (n) count++;
  }

  if (count > 0) {
    logChangeDetector({
      aba: "ESCALA",
      alteracaoDetectada: "Divulgação de nova escala mensal",
      estadoAnterior: "(não divulgada)",
      estadoAtual: `Mês: ${mesKey}`,
      eventoId,
      destinatarios: "Todos os integrantes",
      notificacaoCriada: "ATENÇÃO!! NOVA ESCALA DISPONIVEL",
      origem
    });
  }

  return {
    sucesso: true,
    mensagem: "Notificação da nova escala enviada a todos com sucesso!",
    totalEnviadas: count
  };
}

/**
 * 4. Nova Solicitação de Troca Criada
 * Somente Líderes recebem: "Olá Lider, (nome) fez um solicitação de troca!"
 */
export function processarNotificacaoNovaSolicitacao(params: {
  solicitacaoId: string;
  quemPediu: string;
  dataEscala: string;
  integrantes: IntegranteRef[];
  origem?: "APP" | "GOOGLE_SHEETS";
}): number {
  const { solicitacaoId, quemPediu, dataEscala, integrantes, origem = "APP" } = params;
  const safeId = (solicitacaoId || `${dataEscala}_${quemPediu}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  const eventoId = `SOLICITACAO_${safeId}_NOVA`;

  const lideres = integrantes.filter((i) => {
    const f = (i.funcao || "").toLowerCase();
    return f.includes("lider");
  });

  let count = 0;
  for (const lider of lideres) {
    const n = criarNotificacaoSeNaoExiste({
      destinatario: lider.nome,
      tipo: "SOLICITACAO_NOVA",
      titulo: "Solicitação de Troca",
      mensagem: `Olá Lider, ${quemPediu} fez um solicitação de troca!`,
      eventoId,
      origem
    });
    if (n) count++;
  }

  return count;
}

/**
 * 5 & 6. Decisão de Solicitação de Troca (Aprovada ou Recusada)
 * - APROVADA:
 *   Solicitante: "A Paz (nome)! Sua solicitação foi aprovada!"
 *   Substituto: "A Paz (nome)! Nova escala pra você!"
 * - RECUSADA:
 *   Solicitante: "A Paz (nome)! Solicitação NÃO aprovada!"
 *   Substituto: "A Paz (nome)! Sem alteração na escala!"
 */
export function processarNotificacaoDecisaoSolicitacao(params: {
  solicitacaoId: string;
  quemPediu: string;
  substituto: string;
  dataEscala: string;
  acao: "APROVAR" | "RECUSAR";
  origem?: "APP" | "GOOGLE_SHEETS";
}): number {
  const { solicitacaoId, quemPediu, substituto, dataEscala, acao, origem = "APP" } = params;
  const safeId = (solicitacaoId || `${dataEscala}_${quemPediu}`).replace(/[^a-zA-Z0-9_-]/g, "_");

  let count = 0;

  if (acao === "APROVAR") {
    // Solicitante
    const n1 = criarNotificacaoSeNaoExiste({
      destinatario: quemPediu,
      tipo: "SOLICITACAO_APROVADA",
      titulo: "Solicitação Aprovada",
      mensagem: `A Paz ${quemPediu}! Sua solicitação foi aprovada!`,
      eventoId: `SOLICITACAO_${safeId}_APROVADA_SOLICITANTE`,
      origem
    });
    if (n1) count++;

    // Substituto
    if (substituto) {
      const n2 = criarNotificacaoSeNaoExiste({
        destinatario: substituto,
        tipo: "SOLICITACAO_APROVADA",
        titulo: "Nova Escala Atribuída",
        mensagem: `A Paz ${substituto}! Nova escala pra você!`,
        eventoId: `SOLICITACAO_${safeId}_APROVADA_SUBSTITUTO`,
        origem
      });
      if (n2) count++;
    }

    logChangeDetector({
      aba: "SOLICITAÇÕES",
      data: dataEscala,
      alteracaoDetectada: `Solicitação Aprovada (Solicitante: ${quemPediu}, Substituto: ${substituto})`,
      estadoAnterior: "PENDENTE",
      estadoAtual: "APROVADA",
      eventoId: `SOLICITACAO_${safeId}_APROVADA`,
      destinatarios: `${quemPediu}, ${substituto}`,
      notificacaoCriada: `Solicitante: Aprovada / Substituto: Nova Escala`,
      origem
    });
  } else if (acao === "RECUSAR") {
    // Solicitante
    const n1 = criarNotificacaoSeNaoExiste({
      destinatario: quemPediu,
      tipo: "SOLICITACAO_RECUSADA",
      titulo: "Solicitação Recusada",
      mensagem: `A Paz ${quemPediu}! Solicitação NÃO aprovada!`,
      eventoId: `SOLICITACAO_${safeId}_RECUSADA_SOLICITANTE`,
      origem
    });
    if (n1) count++;

    // Substituto
    if (substituto) {
      const n2 = criarNotificacaoSeNaoExiste({
        destinatario: substituto,
        tipo: "SOLICITACAO_RECUSADA",
        titulo: "Solicitação Não Aprovada",
        mensagem: `A Paz ${substituto}! Sem alteração na escala!`,
        eventoId: `SOLICITACAO_${safeId}_RECUSADA_SUBSTITUTO`,
        origem
      });
      if (n2) count++;
    }

    logChangeDetector({
      aba: "SOLICITAÇÕES",
      data: dataEscala,
      alteracaoDetectada: `Solicitação Recusada (Solicitante: ${quemPediu}, Substituto: ${substituto})`,
      estadoAnterior: "PENDENTE",
      estadoAtual: "RECUSADA",
      eventoId: `SOLICITACAO_${safeId}_RECUSADA`,
      destinatarios: `${quemPediu}, ${substituto}`,
      notificacaoCriada: `Solicitante: NÃO aprovada / Substituto: Sem alteração`,
      origem
    });
  }

  return count;
}

/**
 * 7 & 8. Louvores e Uniformes Disponibilizados / Alterados
 * - Apenas quem está escalado recebe: "A Paz (nome)! Os louvores e uniformes já estão disponíveis!"
 * - Dispara apenas se houver alteração REAL ou disponibilização inicial.
 */
export function processarNotificacaoLouvoresUniformes(params: {
  dataEscala: string;
  louvores?: string;
  uniforme?: string;
  escala: EscalaRef;
  integrantes: IntegranteRef[];
  origem?: "APP" | "GOOGLE_SHEETS";
}): number {
  const { dataEscala, louvores, uniforme, escala, integrantes, origem = "APP" } = params;
  if (!dataEscala || (!louvores && !uniforme)) {
    return 0;
  }

  const cleanData = dataEscala.trim().replace(/[^0-9/]/g, "").replace(/\//g, "_");
  const content = `${(louvores || "").trim()}||${(uniforme || "").trim()}`;
  if (!content.replace(/\|/g, "").trim()) {
    return 0; // Conteúdo vazio
  }

  const hash = crypto.createHash("md5").update(content).digest("hex").substring(0, 8);
  const previousHash = louvoresHashes[dataEscala];

  if (previousHash === hash) {
    return 0;
  }

  louvoresHashes[dataEscala] = hash;
  saveLouvoresHashes();

  const eventoId = `LOUVORES_UNIFORMES_${cleanData}_V${hash}`;
  let count = 0;
  const destinatariosNotificados: string[] = [];

  const membrosEscala = extrairMembrosDaEscala(escala);
  const nomesAlvo = new Set<string>();

  // 1. Membros diretamente extraídos dos campos da escala (Dirigente, Mesário, Vocais, Músicos)
  for (const m of membrosEscala) {
    if (m && m.nome && m.nome.trim()) {
      nomesAlvo.add(m.nome.trim());
    }
  }

  // 2. Integrantes cadastrados que estejam na escala
  for (const integrante of (integrantes || [])) {
    if (!integrante || !integrante.nome) continue;
    if (isUserInEscala(escala, integrante.nome)) {
      nomesAlvo.add(integrante.nome.trim());
    }
  }

  for (const nomeDest of nomesAlvo) {
    const n = criarNotificacaoSeNaoExiste({
      destinatario: nomeDest,
      tipo: "LOUVORES_UNIFORMES",
      titulo: "Louvores e Uniformes",
      mensagem: `A Paz ${nomeDest}! Os louvores e uniformes já estão disponíveis!`,
      eventoId,
      origem
    });
    if (n) {
      count++;
      destinatariosNotificados.push(nomeDest);
    }
  }

  if (count > 0) {
    logChangeDetector({
      aba: "ESCALA",
      data: dataEscala,
      alteracaoDetectada: `Louvores/Uniformes Atualizados`,
      estadoAnterior: previousHash ? `Hash anterior: ${previousHash}` : "(vazio)",
      estadoAtual: `Hash novo: ${hash}`,
      eventoId,
      destinatarios: destinatariosNotificados.join(", "),
      notificacaoCriada: "A Paz (nome)! Os louvores e uniformes já estão disponíveis!",
      origem
    });
  }

  return count;
}

/**
 * =============================================================================
 * DETECTOR CENTRAL DE ALTERAÇÕES NA PLANILHA GOOGLE SHEETS
 * =============================================================================
 * Compara o estado atual das abas (ESCALA, SOLICITAÇÕES, RECADOS) com o snapshot
 * anterior persistente. Identifica mudanças reais e dispara o mesmo motor de
 * notificações com proteção estrita contra duplicidade.
 */
export function detectarAlteracoesNaPlanilha(params: {
  escalaAtual: EscalaRef[];
  solicitacoesAtuais?: any[];
  recadosAtuais?: any[];
  integrantes: IntegranteRef[];
  origem?: "APP" | "GOOGLE_SHEETS";
}): {
  totalNotificacoes: number;
  eventosDetectados: string[];
} {
  const {
    escalaAtual = [],
    solicitacoesAtuais = [],
    recadosAtuais = [],
    integrantes = [],
    origem = "GOOGLE_SHEETS"
  } = params;

  let totalNotificacoes = 0;
  const eventosDetectados: string[] = [];

  // 1. PRIMEIRA EXECUÇÃO: apenas cria o snapshot inicial sem disparar alertas em massa
  if (!currentSnapshot.initialized) {
    console.log(`[CHANGE-DETECTOR] Inicializando primeiro snapshot de referência (${escalaAtual.length} escalas). Nenhuma notificação será disparada.`);
    
    currentSnapshot.initialized = true;
    currentSnapshot.timestamp = new Date().toISOString();
    currentSnapshot.escalas = {};
    currentSnapshot.solicitacoes = {};
    currentSnapshot.recados = {};

    for (const e of escalaAtual) {
      if (!e || !e.data) continue;
      const cleanData = e.data.trim();
      const content = `${(e.louvores || "").trim()}||${(e.uniforme || "").trim()}`;
      const hash = content.replace(/\|/g, "").trim()
        ? crypto.createHash("md5").update(content).digest("hex").substring(0, 8)
        : "";

      currentSnapshot.escalas[cleanData] = {
        data: cleanData,
        dirigente: e.dirigente || "",
        vocal: e.vocal || "",
        musicos: e.musicos || "",
        mesario: e.mesario || "",
        louvores: e.louvores || "",
        uniforme: e.uniforme || "",
        membros: extrairMembrosDaEscala(e),
        louvoresHash: hash
      };
      if (hash) {
        louvoresHashes[cleanData] = hash;
      }
    }

    for (const s of solicitacoesAtuais) {
      if (!s) continue;
      const sId = s.id || `${s.dataEscala}_${s.quemPediu}`;
      currentSnapshot.solicitacoes[sId] = {
        status: (s.status || "PENDENTE").toUpperCase(),
        quemPediu: s.quemPediu || "",
        substituto: s.substituto || "",
        dataEscala: s.dataEscala || ""
      };
    }

    for (const r of recadosAtuais) {
      if (!r || !r.id) continue;
      currentSnapshot.recados[r.id] = {
        id: r.id,
        titulo: r.titulo || "",
        ativo: (r.ativo || "SIM").toUpperCase()
      };
    }

    saveSheetsSnapshot();
    saveLouvoresHashes();
    return { totalNotificacoes: 0, eventosDetectados: ["PRIMEIRA_EXECUCAO_SNAPSHOT_CRIADO"] };
  }

  // 2. DETECÇÃO DE ALTERAÇÕES NA ABA ESCALA
  for (const escalaNova of escalaAtual) {
    if (!escalaNova || !escalaNova.data) continue;
    const dataCulto = escalaNova.data.trim();
    const cleanDataKey = dataCulto.replace(/[^0-9/]/g, "").replace(/\//g, "_");
    const escalaAntiga = currentSnapshot.escalas[dataCulto];
    const dataPassada = isDateInPast(dataCulto);

    const membrosNovos = extrairMembrosDaEscala(escalaNova);

    if (escalaAntiga) {
      const membrosAntigos = escalaAntiga.membros || [];

      // A. Integrantes Removidos da Escala (apenas para cultos de hoje ou futuros)
      if (!dataPassada) {
        for (const mAntigo of membrosAntigos) {
          const continuaNaEscala = membrosNovos.some(
            (mNovo) => normalizarNome(mNovo.nome) === normalizarNome(mAntigo.nome)
          );

          if (!continuaNaEscala) {
            const normNome = normalizarNome(mAntigo.nome).replace(/\s+/g, "_");
            const eventoId = `ESCALA_REMOVIDO_${cleanDataKey}_${normNome}`;
            eventosDetectados.push(eventoId);

            const n = criarNotificacaoSeNaoExiste({
              destinatario: mAntigo.nome,
              tipo: "ESCALA",
              titulo: "Alteração na Escala",
              mensagem: `A Paz ${mAntigo.nome}! Você foi removido(a) da escala do dia ${dataCulto}.`,
              eventoId,
              origem
            });

            if (n) {
              totalNotificacoes++;
              logChangeDetector({
                aba: "ESCALA",
                data: dataCulto,
                alteracaoDetectada: `Integrante Removido: ${mAntigo.nome}`,
                estadoAnterior: `Escalado como ${mAntigo.funcao}${mAntigo.instrumento ? ` (${mAntigo.instrumento})` : ''}`,
                estadoAtual: `(Removido da escala)`,
                eventoId,
                destinatarios: mAntigo.nome,
                notificacaoCriada: `A Paz ${mAntigo.nome}! Você foi removido(a) da escala do dia ${dataCulto}.`,
                origem
              });
            }
          }
        }

        // B. Integrantes Adicionados na Escala (apenas para cultos de hoje ou futuros)
        for (const mNovo of membrosNovos) {
          const estavaNaEscala = membrosAntigos.some(
            (mAntigo) => normalizarNome(mAntigo.nome) === normalizarNome(mNovo.nome)
          );

          if (!estavaNaEscala) {
            const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
            const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
            const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
            eventosDetectados.push(eventoId);

            const n = criarNotificacaoSeNaoExiste({
              destinatario: mNovo.nome,
              tipo: "ESCALA",
              titulo: "Nova Escala para Você",
              mensagem: `A Paz ${mNovo.nome}! Você foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
              eventoId,
              origem
            });

            if (n) {
              totalNotificacoes++;
              logChangeDetector({
                aba: "ESCALA",
                data: dataCulto,
                alteracaoDetectada: `Integrante Adicionado: ${mNovo.nome}`,
                estadoAnterior: `(Não estava escalado)`,
                estadoAtual: `Escalado como ${detalheFuncao}`,
                eventoId,
                destinatarios: mNovo.nome,
                notificacaoCriada: `A Paz ${mNovo.nome}! Você foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
                origem
              });
            }
          }
        }

        // C. Mudança de Função / Instrumento (Mesma pessoa, mesma data, função ou instrumento diferente)
        for (const mNovo of membrosNovos) {
          const exatoAntigo = membrosAntigos.find(
            (mA) =>
              normalizarNome(mA.nome) === normalizarNome(mNovo.nome) &&
              mA.funcao === mNovo.funcao &&
              (mA.instrumento || "") === (mNovo.instrumento || "")
          );

          if (exatoAntigo) {
            continue;
          }

          const correspondenteAntigo = membrosAntigos.find(
            (mA) => normalizarNome(mA.nome) === normalizarNome(mNovo.nome)
          );

          if (correspondenteAntigo) {
            const funcaoMudou = correspondenteAntigo.funcao !== mNovo.funcao;
            const instAntigo = correspondenteAntigo.instrumento || "";
            const instNovo = mNovo.instrumento || "";
            const instrumentoMudou = instAntigo !== instNovo;

            if (funcaoMudou || instrumentoMudou) {
              const detalheNovo = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
              const detalheAntigo = correspondenteAntigo.instrumento
                ? `${correspondenteAntigo.funcao} (${correspondenteAntigo.instrumento})`
                : correspondenteAntigo.funcao;

              const roleHash = crypto
                .createHash("md5")
                .update(detalheNovo)
                .digest("hex")
                .substring(0, 6);

              const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
              const eventoId = `ESCALA_ALTERADA_${cleanDataKey}_${normNome}_${roleHash}`;
              eventosDetectados.push(eventoId);

              const n = criarNotificacaoSeNaoExiste({
                destinatario: mNovo.nome,
                tipo: "ESCALA",
                titulo: "Função Alterada na Escala",
                mensagem: `A Paz ${mNovo.nome}! Sua função na escala do dia ${dataCulto} foi alterada para ${detalheNovo}.`,
                eventoId,
                origem
              });

              if (n) {
                totalNotificacoes++;
                logChangeDetector({
                  aba: "ESCALA",
                  data: dataCulto,
                  alteracaoDetectada: `Mudança de Função/Instrumento: ${mNovo.nome}`,
                  estadoAnterior: detalheAntigo,
                  estadoAtual: detalheNovo,
                  eventoId,
                  destinatarios: mNovo.nome,
                  notificacaoCriada: `A Paz ${mNovo.nome}! Sua função na escala do dia ${dataCulto} foi alterada para ${detalheNovo}.`,
                  origem
                });
              }
            }
          }
        }

        // D. Louvores e Uniformes
        const louvoresAntigo = (escalaAntiga.louvores || "").trim();
        const louvoresNovo = (escalaNova.louvores || "").trim();
        const uniformeAntigo = (escalaAntiga.uniforme || "").trim();
        const uniformeNovo = (escalaNova.uniforme || "").trim();

        if (louvoresAntigo !== louvoresNovo || uniformeAntigo !== uniformeNovo) {
          const countLouv = processarNotificacaoLouvoresUniformes({
            dataEscala: dataCulto,
            louvores: louvoresNovo,
            uniforme: uniformeNovo,
            escala: escalaNova,
            integrantes,
            origem
          });
          totalNotificacoes += countLouv;
        }
      }
    } else {
      // Nova data incluída na escala após a inicialização (apenas para hoje ou futuro)
      if (!dataPassada) {
        for (const mNovo of membrosNovos) {
          const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
          const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
          const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;

          const n = criarNotificacaoSeNaoExiste({
            destinatario: mNovo.nome,
            tipo: "ESCALA",
            titulo: "Nova Escala para Você",
            mensagem: `A Paz ${mNovo.nome}! Você foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
            eventoId,
            origem
          });
          if (n) {
            totalNotificacoes++;
            eventosDetectados.push(eventoId);
          }
        }
      }
    }

    // Atualiza registro no snapshot
    const content = `${(escalaNova.louvores || "").trim()}||${(escalaNova.uniforme || "").trim()}`;
    const hash = content.replace(/\|/g, "").trim()
      ? crypto.createHash("md5").update(content).digest("hex").substring(0, 8)
      : "";

    currentSnapshot.escalas[dataCulto] = {
      data: dataCulto,
      dirigente: escalaNova.dirigente || "",
      vocal: escalaNova.vocal || "",
      musicos: escalaNova.musicos || "",
      mesario: escalaNova.mesario || "",
      louvores: escalaNova.louvores || "",
      uniforme: escalaNova.uniforme || "",
      membros: membrosNovos,
      louvoresHash: hash
    };
  }

  // 3. DETECÇÃO DE ALTERAÇÕES NA ABA SOLICITAÇÕES
  for (const sol of solicitacoesAtuais) {
    if (!sol) continue;
    const solId = sol.id || `${sol.dataEscala}_${sol.quemPediu}`;
    const statusAtual = (sol.status || "PENDENTE").toUpperCase();
    const solAntiga = currentSnapshot.solicitacoes[solId];

    if (solAntiga) {
      const statusAntigo = solAntiga.status;

      if (statusAntigo === "PENDENTE" && statusAtual === "APROVADA") {
        const count = processarNotificacaoDecisaoSolicitacao({
          solicitacaoId: solId,
          quemPediu: sol.quemPediu || solAntiga.quemPediu,
          substituto: sol.substituto || solAntiga.substituto,
          dataEscala: sol.dataEscala || solAntiga.dataEscala,
          acao: "APROVAR",
          origem
        });
        totalNotificacoes += count;
        eventosDetectados.push(`SOLICITACAO_${solId}_APROVADA`);
      } else if (statusAntigo === "PENDENTE" && statusAtual === "RECUSADA") {
        const count = processarNotificacaoDecisaoSolicitacao({
          solicitacaoId: solId,
          quemPediu: sol.quemPediu || solAntiga.quemPediu,
          substituto: sol.substituto || solAntiga.substituto,
          dataEscala: sol.dataEscala || solAntiga.dataEscala,
          acao: "RECUSAR",
          origem
        });
        totalNotificacoes += count;
        eventosDetectados.push(`SOLICITACAO_${solId}_RECUSADA`);
      }
    }

    currentSnapshot.solicitacoes[solId] = {
      status: statusAtual,
      quemPediu: sol.quemPediu || (solAntiga ? solAntiga.quemPediu : ""),
      substituto: sol.substituto || (solAntiga ? solAntiga.substituto : ""),
      dataEscala: sol.dataEscala || (solAntiga ? solAntiga.dataEscala : "")
    };
  }

  // 4. DETECÇÃO DE ALTERAÇÕES NA ABA RECADOS
  // REGRA: Apenas novos recados ("CRIAR") disparam notificações. Exclusões ("EXCLUIR") JAMAIS disparam notificações.
  const novosRecadosSnapshot: Record<string, { id: string; titulo: string; ativo: string }> = {};
  for (const rec of recadosAtuais) {
    if (!rec || !rec.id) continue;
    const recId = rec.id;
    const ativoAtual = (rec.ativo || "SIM").toUpperCase();
    const recAntigo = currentSnapshot.recados[recId];

    if (!recAntigo && ativoAtual === "SIM") {
      const count = processarNotificacaoNovoRecado(recId, integrantes, origem);
      totalNotificacoes += count;
      eventosDetectados.push(`NOVO_RECADO_${recId}`);
    }

    novosRecadosSnapshot[recId] = {
      id: recId,
      titulo: rec.titulo || "",
      ativo: ativoAtual
    };
  }
  currentSnapshot.recados = novosRecadosSnapshot;

  currentSnapshot.timestamp = new Date().toISOString();
  saveSheetsSnapshot();

  return { totalNotificacoes, eventosDetectados };
}

/**
 * Reseta o snapshot em memória para testes controlados
 */
export function resetSnapshotForTesting() {
  currentSnapshot = {
    initialized: false,
    timestamp: new Date().toISOString(),
    escalas: {},
    solicitacoes: {},
    recados: {}
  };
}

