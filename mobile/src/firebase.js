// mobile/src/firebase.js
// Firebase JS SDK setup for React Native (Expo)

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─────────────────────────────────────────────────────────────────────────────
// SETUP: Replace with your Firebase project config.
// Firebase Console → Project Settings → Your Apps → Web
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abcdef1234567890",
};

const app = initializeApp(firebaseConfig);

// Use React-Native-aware auth persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred;
};

export const logout = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

/** Fresh ID token for API calls */
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export default app;
