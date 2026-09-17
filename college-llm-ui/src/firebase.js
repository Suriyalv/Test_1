import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { isSupported, getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB9W6I8ciHAt_m3jk6-OEnZM59zarKFzTw",
  authDomain: "gov-school-v1.firebaseapp.com",
  projectId: "gov-school-v1",
  storageBucket: "gov-school-v1.firebasestorage.app",
  messagingSenderId: "563430441626",
  appId: "1:563430441626:web:d57badbeb7071d8c5ad523",
  measurementId: "G-TLST79QJJF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics needs real browser APIs (cookies, indexedDB) that aren't present
// during the CRA build or in some private-browsing modes, so it's guarded
// and simply skipped rather than crashing the app on init.
isSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});

// Firebase Auth needs an email, not a bare username, so student logins are
// stored as "<username>@<STUDENT_EMAIL_DOMAIN>" behind the scenes. The seed
// script (scripts/seed-users.js) uses this exact same constant to create the
// matching accounts — keep the two in sync if this ever changes.
export const STUDENT_EMAIL_DOMAIN = "kalvi-students.app";
export const usernameToEmail = (username) =>
  `${username.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;

export { db, auth };
