import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";

const messaging = getMessaging(app);

export const getVapidKey = (): string => {
  const envKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  throw new Error("VITE_FIREBASE_VAPID_KEY não está configurada nas variáveis de ambiente.");
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getFcmToken();
    }
  } catch (error) {
    console.error("Error requesting permission or getting token:", error);
  }
  return null;
};

export const getFcmToken = async (): Promise<string | null> => {
  try {
    const vapidKey = getVapidKey();
    const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

    if (!swSupported) {
      throw new Error('Service Worker não suportado pelo navegador.');
    }

    const registration = await navigator.serviceWorker.ready;
    console.log("FCM DEBUG - Service Worker pronto.");

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    console.log("FCM DIAGNOSTIC:", {
      swRegistered: true,
      swScope: registration.scope,
      tokenObtained: !!token,
    });

    return token;
  } catch (error: any) {
    console.error("FCM DIAGNOSTIC ERROR:", {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: error?.message,
    });

    if (error?.status === 400 || error?.code === 'messaging/invalid-argument') {
      console.error("FCM DIAGNOSTIC - Erro de configuração ou API (HTTP 400). Verifique VITE_FIREBASE_API_KEY, VITE_FIREBASE_VAPID_KEY e AppID.");
    }

    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });


