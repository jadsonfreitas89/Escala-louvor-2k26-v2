import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBy56kEmfcHWNQ7t15bF2RtLb5CkdHwLK4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "escala-louvor-2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "979295298532",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:979295298532:web:8093b4212b9fff6d0b9df1",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);


