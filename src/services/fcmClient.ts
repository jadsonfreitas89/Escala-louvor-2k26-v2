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
    console.log("FCM DEBUG - Service Worker pronto.", {
      scope: registration.scope,
      active: !!registration.active,
      installing: !!registration.installing,
      waiting: !!registration.waiting
    });

    if (!registration.active) {
      await new Promise<void>((resolve) => {
        if (registration.active) {
          resolve();
        } else if (registration.installing) {
          registration.installing.addEventListener('statechange', (e: any) => {
            if (e.target.state === 'activated') resolve();
          });
        } else if (registration.waiting) {
          registration.waiting.addEventListener('statechange', (e: any) => {
            if (e.target.state === 'activated') resolve();
          });
        } else {
          setTimeout(resolve, 1000);
        }
      });
    }

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
      stack: error?.stack
    });

    if (error?.status === 400 || error?.code === 'messaging/invalid-argument' || error?.name === 'AbortError') {
      console.error("FCM DIAGNOSTIC - Falha no Push Service ou VAPID Key inválida. Certifique-se de que VITE_FIREBASE_VAPID_KEY está configurada corretamente no painel da Vercel correspondendo ao certificado Web Push do Firebase Console.");
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


