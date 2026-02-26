// frontend/src/firebase.js
// Firebase client SDK setup for Authentication

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 SETUP INSTRUCTIONS:
//
// 1. Go to https://console.firebase.google.com
// 2. Create project "kutunza-gourmet" (or open existing)
// 3. Click ⚙️ → Project Settings → Your Apps → Add Web App
// 4. Copy the firebaseConfig below and replace these placeholder values
// 5. In Firebase Console → Authentication → Sign-in methods:
//    Enable: Email/Password + Google + Phone
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred;
};

export const loginWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider());

export const logout = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

/**
 * Get fresh ID token for API calls
 * Call this before every authenticated API request
 */
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider };
export default app;
