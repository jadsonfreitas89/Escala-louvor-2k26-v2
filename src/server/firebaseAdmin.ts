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

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.warn('[Firebase Admin] Variável FIREBASE_SERVICE_ACCOUNT_JSON não configurada.');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

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

