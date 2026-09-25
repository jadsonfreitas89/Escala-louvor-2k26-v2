import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "./firebaseAdmin";

let firestoreInstance: Firestore | null = null;

export function getDb(): Firestore | null {
  if (firestoreInstance) {
    return firestoreInstance;
  }
  const adminApp = getFirebaseAdminApp();
  if (adminApp) {
    firestoreInstance = getFirestore(adminApp);
  }
  return firestoreInstance;
}

export const db = new Proxy({} as Firestore, {
  get(target, prop, receiver) {
    const inst = getDb();
    if (!inst) {
      throw new Error("Firestore Admin SDK não inicializado (credencial ausente ou inválida).");
    }
    const val = (inst as any)[prop];
    return typeof val === "function" ? val.bind(inst) : val;
  }
});

