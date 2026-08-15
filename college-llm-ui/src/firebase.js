import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTkyrq567Qj0kB1uTZQGENS9HbNWSoNx8",
  authDomain: "arkengine-database.firebaseapp.com",
  projectId: "arkengine-database",
  storageBucket: "arkengine-database.firebasestorage.app",
  messagingSenderId: "502789045119",
  appId: "1:502789045119:web:93759046b753392706b84a",
  measurementId: "G-SNEF7108ZP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
