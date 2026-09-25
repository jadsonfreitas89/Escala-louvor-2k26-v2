import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import { getInstallations, deleteInstallations } from "firebase/installations";
import { app } from "./firebase";

const messaging = getMessaging(app);

/**
 * Chave pública oficial VAPID para Web Push do projeto escala-louvor-2
 */
export const DEFAULT_VAPID_KEY = "BL9MKXSK-5GX-aWJXo_AaYQINA63NpRYxdkEatU3xw22bbMEehCUzCuCa-IL-zlhSXHmG6RgwfTvH78w0utrK0A";

export const getVapidKey = (): string => {
  const envKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return DEFAULT_VAPID_KEY;
};

/**
 * Realiza uma limpeza profunda do estado local do Firebase Messaging
 * para resolver erros de corrupção de instalação/token (AbortError/400).
 */
export const resetPushNotifications = async () => {
  try {
    console.log("FCM DEBUG - Iniciando reset limpo de notificações...");
    
    // 1. Deleta o token de messaging localmente
    await deleteToken(messaging);
    
    // 2. Deleta a instalação do Firebase (forçando o próximo getToken a recriar)
    const installations = getInstallations(app);
    await deleteInstallations(installations);
    
    console.log("FCM DEBUG - Reset limpo concluído com sucesso.");
    return true;
  } catch (error) {
    console.error("FCM DEBUG - Erro ao realizar reset limpo:", error);
    return false;
  }
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

export const getFcmToken = async (isRetry: boolean = false): Promise<string | null> => {
  const vapidKey = getVapidKey();
  const hasVapid = Boolean(vapidKey);
  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  try {
    if (!swSupported) {
      throw new Error('Service Worker não suportado pelo navegador.');
    }

    // Aguarda o Service Worker já registrado pelo PWA em main.tsx
    const registration = await navigator.serviceWorker.ready;
    console.log("FCM DEBUG - Service Worker pronto.");

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    console.log("FCM DIAGNOSTIC:", {
      permission,
      swRegistered: true,
      swScope: registration.scope,
      vapidConfigured: hasVapid,
      tokenObtained: !!token,
    });

    return token;
  } catch (error: any) {
    console.error("FCM DIAGNOSTIC ERROR:", {
      isRetry,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: error?.message,
    });

    // Se falhar e ainda não for um retry, tenta o reset limpo apenas para erros locais de estado (não de configuração/API)
    if (!isRetry && (error?.code === 'messaging/token-unsubscribe-failed' || error?.code === 'messaging/failed-precondition' || error?.name === 'AbortError')) {
      console.log("FCM DEBUG - Tentando recuperação automática via reset de estado local...");
      const resetSuccess = await resetPushNotifications();
      if (resetSuccess) {
        return await getFcmToken(true); // Retry
      }
    }

    // Se for erro 400 (configuração/API), não fazemos reset, apenas logamos e retornamos null
    if (error?.status === 400 || error?.code === 'messaging/invalid-argument') {
      console.error("FCM DIAGNOSTIC - Erro de configuração ou API (HTTP 400). Verifique API Key, habilitacão de APIs no console e AppID.");
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

