import fs from "fs";
import path from "path";
import { getFirebaseAdminApp } from "./firebaseAdmin";
import { normalizarNome } from "./notifications";

export interface IdempotencyRecord {
  eventKey: string;
  status: "pending" | "fcm_dispatched" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
  notificationId?: string;
  fcmMessageId?: string;
  destinatario?: string;
  tipo?: string;
  error?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_STORE_FILE = path.join(DATA_DIR, "idempotencia_store.json");
const PENDING_TTL_MS = 5 * 60 * 1000; // 5 minutos de timeout para lock pendente

// Cache local em memória apenas para ambiente de desenvolvimento local
let localStore: Record<string, IdempotencyRecord> = {};

function ensureDataDir() {
  if (process.env.VERCEL) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Erro ao criar diretório data para idempotencia:", err);
  }
}

function loadLocalStore() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      localStore = JSON.parse(raw);
    }
  } catch (err) {
    localStore = {};
  }
}

function saveLocalStore() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(localStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar idempotencia_store.json:", err);
  }
}

// Carrega na inicialização do módulo em ambiente local
loadLocalStore();

function sanitizeDocId(eventKey: string): string {
  return String(eventKey || "")
    .trim()
    .replace(/\//g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 150);
}

/**
 * Constrói uma chave canônica determinística com granularidade por destinatário.
 * Evita que o sucesso de um usuário bloqueie o envio de outro usuário sob o mesmo evento.
 */
export function buildRecipientEventKey(eventoId: string, destinatario: string): string {
  const cleanEvt = String(eventoId || "").trim();
  const normDest = normalizarNome(destinatario);
  if (!normDest || cleanEvt.toLowerCase().endsWith(`:${normDest}`)) {
    return cleanEvt;
  }
  return `${cleanEvt}:${normDest}`;
}

/**
 * Reserva atômica e persistente de um evento por destinatário antes do envio de notificação.
 * Em produção (Vercel), exige obrigatoriamente Firestore Admin funcional.
 */
export async function reserveEventAtomic(
  eventKey: string,
  metadata?: { destinatario?: string; tipo?: string }
): Promise<{
  success: boolean;
  reason?: "ALREADY_SENT" | "LOCK_ACTIVE" | "FIRESTORE_UNAVAILABLE";
  error?: string;
  record?: IdempotencyRecord;
}> {
  if (!eventKey || !eventKey.trim()) {
    return { success: false, reason: "ALREADY_SENT" };
  }

  const cleanKey = eventKey.trim();
  const docId = sanitizeDocId(cleanKey);
  const now = new Date();
  const nowIso = now.toISOString();
  const isVercel = Boolean(process.env.VERCEL);

  // 1. TENTA VIA FIRESTORE (Obrigatório em Produção na Vercel)
  const adminApp = getFirebaseAdminApp();
  if (isVercel && !adminApp) {
    console.error("[IdempotencyStore] ERRO CRÍTICO: Firestore Admin não inicializado na Vercel. Bloqueando envio por segurança.");
    return {
      success: false,
      reason: "FIRESTORE_UNAVAILABLE",
      error: "O serviço de idempotência Firestore é OBRIGATÓRIO em produção na Vercel para impedir duplicações."
    };
  }

  if (adminApp) {
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore(adminApp);
      const docRef = db.collection("idempotencia_notificacoes").doc(docId);

      const result = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(docRef);

        if (snapshot.exists) {
          const data = snapshot.data() as IdempotencyRecord;
          if (data.status === "sent" || data.status === "fcm_dispatched") {
            return { success: false, reason: "ALREADY_SENT" as const, record: data };
          }

          if (data.status === "pending") {
            const createdAtTime = new Date(data.createdAt).getTime();
            const ageMs = now.getTime() - createdAtTime;
            if (ageMs < PENDING_TTL_MS) {
              return { success: false, reason: "LOCK_ACTIVE" as const, record: data };
            }
            console.log(`[IdempotencyStore] Lock pendente expirado (${Math.round(ageMs / 1000)}s) recuperado para evento: ${cleanKey}`);
          }
        }

        const newRecord: IdempotencyRecord = {
          eventKey: cleanKey,
          status: "pending",
          createdAt: nowIso,
          updatedAt: nowIso,
          destinatario: metadata?.destinatario,
          tipo: metadata?.tipo
        };

        transaction.set(docRef, newRecord);
        return { success: true, record: newRecord };
      });

      return result;
    } catch (err: any) {
      console.error("[IdempotencyStore] Erro ao acessar Firestore para idempotência:", err?.message || err);
      if (isVercel) {
        // Na Vercel, falha de leitura no Firestore NUNCA é tratada como "sem registro", e sim bloqueada!
        return {
          success: false,
          reason: "FIRESTORE_UNAVAILABLE",
          error: `Falha de acesso ao Firestore: ${err?.message || "Erro de conexão"}`
        };
      }
    }
  }

  // 2. FALLBACK SOMENTE EM DESENVOLVIMENTO LOCAL
  if (isVercel) {
    return {
      success: false,
      reason: "FIRESTORE_UNAVAILABLE",
      error: "Firestore indisponível em ambiente Vercel."
    };
  }

  const existing = localStore[cleanKey];
  if (existing) {
    if (existing.status === "sent" || existing.status === "fcm_dispatched") {
      return { success: false, reason: "ALREADY_SENT", record: existing };
    }
    if (existing.status === "pending") {
      const createdAtTime = new Date(existing.createdAt).getTime();
      const ageMs = now.getTime() - createdAtTime;
      if (ageMs < PENDING_TTL_MS) {
        return { success: false, reason: "LOCK_ACTIVE", record: existing };
      }
    }
  }

  const newRecord: IdempotencyRecord = {
    eventKey: cleanKey,
    status: "pending",
    createdAt: nowIso,
    updatedAt: nowIso,
    destinatario: metadata?.destinatario,
    tipo: metadata?.tipo
  };

  localStore[cleanKey] = newRecord;
  saveLocalStore();

  return { success: true, record: newRecord };
}

/**
 * Marca que o FCM aceitou e confirmou a entrega do push para a chave do destinatário
 */
export async function markEventFcmDispatched(eventKey: string, fcmMessageId?: string): Promise<void> {
  if (!eventKey) return;
  const cleanKey = eventKey.trim();
  const docId = sanitizeDocId(cleanKey);
  const nowIso = new Date().toISOString();

  const adminApp = getFirebaseAdminApp();
  if (adminApp) {
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore(adminApp);
      await db.collection("idempotencia_notificacoes").doc(docId).set(
        {
          status: "fcm_dispatched",
          updatedAt: nowIso,
          fcmMessageId: fcmMessageId || undefined
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[IdempotencyStore] Aviso ao registrar status FCM no Firestore:", err);
    }
  }

  if (localStore[cleanKey]) {
    localStore[cleanKey].status = "fcm_dispatched";
    localStore[cleanKey].updatedAt = nowIso;
    if (fcmMessageId) localStore[cleanKey].fcmMessageId = fcmMessageId;
  } else {
    localStore[cleanKey] = {
      eventKey: cleanKey,
      status: "fcm_dispatched",
      createdAt: nowIso,
      updatedAt: nowIso,
      fcmMessageId
    };
  }
  saveLocalStore();
}

/**
 * Marca um evento como enviado e totalmente concluído ('sent')
 */
export async function markEventSent(eventKey: string, notificationId?: string): Promise<void> {
  if (!eventKey) return;
  const cleanKey = eventKey.trim();
  const docId = sanitizeDocId(cleanKey);
  const nowIso = new Date().toISOString();

  const adminApp = getFirebaseAdminApp();
  if (adminApp) {
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore(adminApp);
      await db.collection("idempotencia_notificacoes").doc(docId).set(
        {
          status: "sent",
          updatedAt: nowIso,
          notificationId: notificationId || undefined
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[IdempotencyStore] Erro ao marcar enviado no Firestore:", err);
    }
  }

  if (localStore[cleanKey]) {
    localStore[cleanKey].status = "sent";
    localStore[cleanKey].updatedAt = nowIso;
    if (notificationId) localStore[cleanKey].notificationId = notificationId;
  } else {
    localStore[cleanKey] = {
      eventKey: cleanKey,
      status: "sent",
      createdAt: nowIso,
      updatedAt: nowIso,
      notificationId
    };
  }
  saveLocalStore();
}

/**
 * Marca um evento como falho ('failed'), permitindo nova tentativa isolada para este destinatário
 */
export async function markEventFailed(eventKey: string, errorMsg?: string): Promise<void> {
  if (!eventKey) return;
  const cleanKey = eventKey.trim();
  const docId = sanitizeDocId(cleanKey);
  const nowIso = new Date().toISOString();

  const adminApp = getFirebaseAdminApp();
  if (adminApp) {
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore(adminApp);
      await db.collection("idempotencia_notificacoes").doc(docId).set(
        {
          status: "failed",
          updatedAt: nowIso,
          error: errorMsg || "Erro no envio"
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[IdempotencyStore] Erro ao marcar falha no Firestore:", err);
    }
  }

  if (localStore[cleanKey]) {
    localStore[cleanKey].status = "failed";
    localStore[cleanKey].updatedAt = nowIso;
    localStore[cleanKey].error = errorMsg;
  } else {
    localStore[cleanKey] = {
      eventKey: cleanKey,
      status: "failed",
      createdAt: nowIso,
      updatedAt: nowIso,
      error: errorMsg
    };
  }
  saveLocalStore();
}

/**
 * Obtém o registro atual do evento
 */
export async function getEventStatus(eventKey: string): Promise<IdempotencyRecord | null> {
  if (!eventKey) return null;
  const cleanKey = eventKey.trim();
  const docId = sanitizeDocId(cleanKey);
  const isVercel = Boolean(process.env.VERCEL);

  const adminApp = getFirebaseAdminApp();
  if (adminApp) {
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore(adminApp);
      const snapshot = await db.collection("idempotencia_notificacoes").doc(docId).get();
      if (snapshot.exists) {
        return snapshot.data() as IdempotencyRecord;
      }
    } catch (err) {
      if (isVercel) {
        throw new Error(`Erro de leitura do Firestore na Vercel: ${err}`);
      }
    }
  }

  if (isVercel) {
    return null;
  }

  return localStore[cleanKey] || null;
}

/**
 * Limpa o estado de idempotência local (para testes unitários)
 */
export function clearIdempotencyStoreForTesting() {
  localStore = {};
  if (!process.env.VERCEL && fs.existsSync(LOCAL_STORE_FILE)) {
    try {
      fs.unlinkSync(LOCAL_STORE_FILE);
    } catch (e) {}
  }
}
