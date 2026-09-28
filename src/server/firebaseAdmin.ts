import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';

let adminApp: App | null = null;

/**
 * Inicializa o Firebase Admin SDK de forma segura e idempotente.
 */
export function getFirebaseAdminApp(): App | null {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const serviceAccountString = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();

  if (!serviceAccountString || serviceAccountString === '{}' || serviceAccountString.toLowerCase().includes('your_service_account') || serviceAccountString.toLowerCase().includes('cole_aqui')) {
    return null;
  }

  try {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (jsonErr) {
      const firstBrace = serviceAccountString.indexOf('{');
      const lastBrace = serviceAccountString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonPart = serviceAccountString.substring(firstBrace, lastBrace + 1);
        serviceAccount = JSON.parse(jsonPart);
      } else {
        return null;
      }
    }

    if (!serviceAccount || typeof serviceAccount !== 'object' || !serviceAccount.private_key) {
      return null;
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2"
    });

    console.log('[Firebase Admin] Inicializado com sucesso para o projeto', process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2");
    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] Falha ao processar credenciais:', error);
    return null;
  }
}

