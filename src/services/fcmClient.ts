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
    const existingSubscription = await registration.pushManager.getSubscription();

    const maskedEndpoint = existingSubscription 
      ? existingSubscription.endpoint.replace(/https:\/\/([^/]+)\/.*/, 'https://$1/... [masked]') 
      : null;

    console.log("PUSH ENV DIAGNOSTIC:", {
      hasSubscription: !!existingSubscription,
      endpointMasked: maskedEndpoint,
      hasActiveWorker: !!registration.active,
      swScope: registration.scope,
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unknown',
      swSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      pushManagerSupported: typeof window !== 'undefined' && 'PushManager' in window,
      notificationSupported: typeof window !== 'undefined' && 'Notification' in window,
      hasController: typeof navigator !== 'undefined' && !!navigator.serviceWorker.controller
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

    // Isolated independent test for pushManager.subscribe without Firebase
    try {
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const convertedKey = urlBase64ToUint8Array(vapidKey);
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      console.log("PUSH SUBSCRIBE TEST: SUCCESS");
    } catch (subErr: any) {
      console.error("PUSH SUBSCRIBE TEST ERROR:", {
        name: subErr?.name,
        code: subErr?.code,
        message: subErr?.message
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


