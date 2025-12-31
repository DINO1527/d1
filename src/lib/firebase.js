import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDtWnbNPPLKeLbJJFo8zGSH1XmN4mV3ak",
  authDomain: "grace-evangelical-church.firebaseapp.com",
  projectId: "grace-evangelical-church",
  storageBucket: "grace-evangelical-church.firebasestorage.app",
  messagingSenderId: "134365474544",
  appId: "1:134365474544:web:35fe937a9a95cd40879c35"
};

// 1. Singleton Pattern: Prevents "Firebase App already exists" error on reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Define Auth: This was missing in your previous code!
const auth = getAuth(app);

export { auth };