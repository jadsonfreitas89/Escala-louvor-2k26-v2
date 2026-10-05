import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";

const messaging = getMessaging(app);

export const DEFAULT_VAPID_KEY = "BL9MKXSK-5GX-aWJXo_AaYQINA63NpRYxdkEatU3xw22bbMEehCUzCuCa-IL-zlhSXHmG6RgwfTvH78w0utrK0A";

export const getVapidKey = (): string => {
  const envKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return DEFAULT_VAPID_KEY;
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getFcmToken();
    }
  } catch (error) {
    console.error("[FCM] Erro ao solicitar permissão ou obter token:", error);
  }
  return null;
};

export const getFcmToken = async (): Promise<string | null> => {
  try {
    const vapidKey = getVapidKey();
    const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

    if (!swSupported) {
      console.warn('[FCM] Service Worker não suportado pelo navegador.');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

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
          setTimeout(resolve, 800);
        }
      });
    }

    let token: string | null = null;
    try {
      token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });
    } catch (tokenErr: any) {
      console.warn('[FCM] Primeira tentativa de getToken falhou:', tokenErr?.message || tokenErr?.name);
      
      // Se houver uma assinatura órfã corrompida de testes anteriores, desinscreve e tenta novamente
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          console.log('[FCM] Removendo assinatura push anterior corrompida para auto-recuperação...');
          await existingSub.unsubscribe();
        }
        token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });
      } catch (retryErr: any) {
        console.error('[FCM] Tentativa de auto-recuperação do token também falhou:', retryErr?.message || retryErr?.name);
        throw retryErr;
      }
    }

    if (token) {
      const masked = `${token.substring(0, 6)}...${token.substring(token.length - 6)}`;
      console.log(`[FCM] Token gerado com sucesso: ${masked}`);
    } else {
      console.warn('[FCM] Nenhum token retornado pelo Firebase.');
    }

    return token;
  } catch (error: any) {
    console.error("[FCM] Falha ao obter token FCM:", {
      name: error?.name,
      code: error?.code,
      message: error?.message
    });
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });


