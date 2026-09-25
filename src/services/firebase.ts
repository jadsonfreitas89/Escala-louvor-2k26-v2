import { initializeApp, getApps, getApp } from "firebase/app";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
  throw new Error("Variáveis de ambiente do Firebase ausentes. Verifique VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_MESSAGING_SENDER_ID e VITE_FIREBASE_APP_ID.");
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  messagingSenderId,
  appId
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);


