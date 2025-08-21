// Firebase configuration and initialization for React frontend
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBd9xD4zSD5TQCT50eREGmM-2UptWEeCSk",
  authDomain: "fit-together-b2be0.firebaseapp.com",
  projectId: "fit-together-b2be0",
  storageBucket: "fit-together-b2be0.firebasestorage.app",
  messagingSenderId: "650353285856",
  appId: "1:650353285856:web:7d6132fe38d41b833cce85",
  measurementId: "G-9JH15Q0YBK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
