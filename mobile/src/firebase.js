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
import Constants from "expo-constants";

// ─────────────────────────────────────────────────────────────────────────────
// Firebase config from app.config.js extra / env vars
// ─────────────────────────────────────────────────────────────────────────────
const extra = Constants.expoConfig?.extra ?? {};
const firebaseConfig = {
  apiKey: extra.fbApiKey,
  authDomain: extra.fbAuthDomain,
  projectId: extra.fbProjectId,
  storageBucket: extra.fbStorageBucket,
  messagingSenderId: extra.fbMessagingSenderId,
  appId: extra.fbAppId,
};

// Validate at startup
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "❌ Firebase config missing. Set EXPO_PUBLIC_FB_* env vars in .env. See .env.example."
  );
}

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
