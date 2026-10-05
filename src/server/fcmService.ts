import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { getFirebaseAdminApp } from "./firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";
import { normalizarNome, destinatarioPertenceAoUsuario } from "./notifications";

const DATA_DIR = path.join(process.cwd(), "data");
const FCM_TOKENS_FILE = path.join(DATA_DIR, "fcm_tokens.json");

interface LocalFcmToken {
  token: string;
  userId: string;
  updatedAt: string;
  active: boolean;
}

let localTokens: LocalFcmToken[] = [];

function loadLocalTokens(): LocalFcmToken[] {
  try {
    if (fs.existsSync(FCM_TOKENS_FILE)) {
      const raw = fs.readFileSync(FCM_TOKENS_FILE, "utf-8");
      localTokens = JSON.parse(raw);
    }
  } catch {
    localTokens = [];
  }
  return localTokens;
}

function saveLocalTokens(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FCM_TOKENS_FILE, JSON.stringify(localTokens, null, 2), "utf-8");
  } catch (err) {
    console.error("[FCM] Erro ao salvar fcm_tokens.json:", err);
  }
}

// Inicializa tokens locais
loadLocalTokens();

export async function getFcmTokensForUser(userId: string): Promise<string[]> {
  const normSearch = normalizarNome(userId);
  const isBroadcast =
    !normSearch ||
    normSearch === "todos" ||
    normSearch === "todos os membros" ||
    normSearch === "geral" ||
    normSearch === "all";

  const tokens: string[] = [];
  const seenTokens = new Set<string>();

  // 1. Consulta armazenamento local resiliente
  for (const item of localTokens) {
    if (!item.active || !item.token) continue;
    const t = item.token.trim();
    if (seenTokens.has(t)) continue;

    if (
      isBroadcast ||
      destinatarioPertenceAoUsuario(item.userId, userId) ||
      destinatarioPertenceAoUsuario(userId, item.userId)
    ) {
      tokens.push(t);
      seenTokens.add(t);
    }
  }

  // 2. Consulta Firestore se disponível
  const db = getDb();
  if (db) {
    try {
      const snapshot = await db
        .collection("fcm_tokens")
        .where("active", "==", true)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data || !data.token) continue;
        const t = String(data.token).trim();
        if (!t || seenTokens.has(t)) continue;

        if (
          isBroadcast ||
          destinatarioPertenceAoUsuario(data.userId, userId) ||
          destinatarioPertenceAoUsuario(userId, data.userId)
        ) {
          tokens.push(t);
          seenTokens.add(t);
        }
      }
    } catch (error) {
      console.warn(`[FCM] Erro ao consultar Firestore para usuário ${userId}:`, error);
    }
  }

  return tokens;
}

export async function subscribeUserToFcm(userId: string, token: string) {
  if (!token || !userId) return false;

  // 1. Persistência local atômica
  const now = new Date().toISOString();
  const existingIdx = localTokens.findIndex((t) => t.token === token);
  if (existingIdx >= 0) {
    localTokens[existingIdx] = { token, userId, updatedAt: now, active: true };
  } else {
    localTokens.push({ token, userId, updatedAt: now, active: true });
  }
  saveLocalTokens();
  console.log(`[FCM] Token persistido localmente para o usuário ${userId} (${token.substring(0, 6)}...)`);

  // 2. Persistência no Firestore se disponível
  const db = getDb();
  if (db) {
    try {
      await db.collection("fcm_tokens").doc(token).set({
        userId,
        token,
        updatedAt: now,
        active: true
      }, { merge: true });
    } catch (error) {
      console.warn("[FCM] Aviso ao sincronizar token com Firestore:", error);
    }
  }

  return true;
}

export async function unsubscribeUserFromFcm(userId: string, token: string) {
  if (!token) return false;

  // 1. Desativa localmente
  for (const item of localTokens) {
    if (item.token === token) {
      item.active = false;
      item.updatedAt = new Date().toISOString();
    }
  }
  saveLocalTokens();

  // 2. Desativa no Firestore se disponível
  const db = getDb();
  if (db) {
    try {
      const docRef = db.collection("fcm_tokens").doc(token);
      const doc = await docRef.get();
      if (doc.exists) {
        await docRef.update({ active: false, updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.warn("[FCM] Erro ao desativar token no Firestore:", error);
    }
  }

  return true;
}

export interface FcmPayloadOptions {
  title: string;
  body: string;
  id?: string;
  url?: string;
  eventoId?: string;
  type?: string;
}

export async function sendFcmPushToUser(userId: string, options: FcmPayloadOptions): Promise<{ sent: number; failed: number }> {
  console.log(`[FCM] Preparing notification for user: ${userId}, title: "${options.title}"`);

  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    console.warn("[FCM] Firebase Admin SDK não disponível. Notificação push ignorada.");
    return { sent: 0, failed: 0 };
  }

  const tokens = await getFcmTokensForUser(userId);
  console.log(`[FCM] User ${userId} - Tokens found: ${tokens.length}`);

  if (!tokens || tokens.length === 0) {
    console.log(`[FCM] Nenhum token FCM ativo para o usuário ${userId}.`);
    return { sent: 0, failed: 0 };
  }

  const messaging = getMessaging(adminApp);
  const notificationId = options.id || options.eventoId || `notif_${Date.now()}`;
  const targetUrl = options.url || "/notificacoes";

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      console.log(`[FCM] Sending message to token ${token.substring(0, 6)}...`);
      const response = await messaging.send({
        token,
        notification: {
          title: options.title,
          body: options.body
        },
        data: {
          id: notificationId,
          eventoId: options.eventoId || "",
          type: options.type || "NOTIFICATION",
          url: targetUrl
        },
        webpush: {
          fcmOptions: {
            link: targetUrl
          },
          notification: {
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: notificationId,
            requireInteraction: false
          }
        }
      });
      console.log(`[FCM] Firebase response: message sent successfully (${response})`);
      sent++;
    } catch (error: any) {
      console.error(`[FCM] Send failed for token ${token.substring(0, 6)}...:`, error?.message);
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        console.log(`[FCM] Desativando token inválido/expirado ${token.substring(0, 6)}...`);
        await unsubscribeUserFromFcm(userId, token);
      }
      failed++;
    }
  }

  return { sent, failed };
}

