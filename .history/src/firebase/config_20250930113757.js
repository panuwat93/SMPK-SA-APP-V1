import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBUHE7zbtcymdamxRnybzrB0pfxl6lv1rs",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "smpk-sa-app-v1.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "smpk-sa-app-v1",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "smpk-sa-app-v1.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "51444461299",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:51444461299:web:e74ff2b4cc9055eb78d186"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
