import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUHE7zbtcymdamxRnybzrB0pfxl6lv1rs",
  authDomain: "smpk-sa-app-v1.firebaseapp.com",
  projectId: "smpk-sa-app-v1",
  storageBucket: "smpk-sa-app-v1.firebasestorage.app",
  messagingSenderId: "51444461299",
  appId: "1:51444461299:web:e74ff2b4cc9055eb78d186"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
