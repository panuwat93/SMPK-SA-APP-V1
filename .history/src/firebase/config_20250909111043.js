import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGYHpcvnK-gm5VeJhx0LDFzMTg25gbpQc",
  authDomain: "smpk-sa-app.firebaseapp.com",
  projectId: "smpk-sa-app",
  storageBucket: "smpk-sa-app.firebasestorage.app",
  messagingSenderId: "468984772362",
  appId: "1:468984772362:web:c38fe3f246a4d9593f2cf3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
