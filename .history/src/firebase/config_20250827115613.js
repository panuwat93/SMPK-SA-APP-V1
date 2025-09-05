import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpANSPBKtBWs0JvvYdDNecR9CLBetawuU",
  authDomain: "smpk-sa-site.firebaseapp.com",
  projectId: "smpk-sa-site",
  storageBucket: "smpk-sa-site.firebasestorage.app",
  messagingSenderId: "1082587231455",
  appId: "1:1082587231455:web:a94007690e1091af68656a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
