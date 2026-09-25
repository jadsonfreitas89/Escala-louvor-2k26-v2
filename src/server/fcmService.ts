import { getDb } from "./db";
import { getFirebaseAdminApp } from "./firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";

export async function getFcmTokensForUser(userId: string): Promise<string[]> {
  const db = getDb();
  if (!db) {
    console.warn(`[FCM] DB não disponível para consultar tokens do usuário ${userId}.`);
    return [];
  }
  try {
    const snapshot = await db.collection("fcm_tokens")
      .where("userId", "==", userId)
      .where("active", "==", true)
      .get();
    return snapshot.docs.map(doc => doc.data().token).filter(Boolean);
  } catch (error) {
    console.warn(`[FCM] Erro ao recuperar tokens para usuário ${userId}:`, error);
    return [];
  }
}

export async function subscribeUserToFcm(userId: string, token: string) {
  const db = getDb();
  if (!db) {
    console.warn("[FCM] Firestore indisponível para registro de token.");
    return false;
  }
  try {
    // Upsert atômico indexado pelo próprio token
    await db.collection("fcm_tokens").doc(token).set({
      userId,
      token,
      updatedAt: new Date().toISOString(),
      active: true
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("[FCM] Erro ao persistir token no Firestore:", error);
    return false;
  }
}

export async function unsubscribeUserFromFcm(userId: string, token: string) {
  const db = getDb();
  if (!db) return false;
  try {
    const docRef = db.collection("fcm_tokens").doc(token);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update({ active: false, updatedAt: new Date().toISOString() });
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[FCM] Erro ao desativar token:", error);
    return false;
  }
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
  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    return { sent: 0, failed: 0 };
  }

  const tokens = await getFcmTokensForUser(userId);
  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const messaging = getMessaging(adminApp);
  const notificationId = options.id || options.eventoId || `notif_${Date.now()}`;
  const targetUrl = options.url || "/notificacoes";

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      await messaging.send({
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
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: notificationId,
            requireInteraction: false
          }
        }
      });
      sent++;
    } catch (error: any) {
      console.error(`[FCM] Erro ao enviar para token ${token.substring(0, 6)}...:`, error?.message);
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        await unsubscribeUserFromFcm(userId, token);
      }
      failed++;
    }
  }

  return { sent, failed };
}

