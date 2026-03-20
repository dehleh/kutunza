// backend/firebase.js
// Firebase Admin SDK initialization

const admin = require("firebase-admin");
require("dotenv").config();

let db, auth;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
    return { db, auth };
  }

  let credential;

  // Option 1: Service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      credential = admin.credential.cert(serviceAccount);
    } catch (e) {
      console.warn("⚠️  Could not load service account file:", e.message);
    }
  }

  // Option 2: Individual environment variables (for cloud hosting)
  if (!credential && process.env.FIREBASE_PROJECT_ID) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    });
  }

  if (!credential) {
    console.error("❌ Firebase credentials not found. Check your .env file.");
    process.exit(1);
  }

  admin.initializeApp({
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });

  db = admin.firestore();
  auth = admin.auth();

  // Firestore settings
  db.settings({ ignoreUndefinedProperties: true });

  console.log("✅ Firebase Admin initialized");
  return { db, auth };
}

module.exports = { initFirebase, getDb: () => db, getAuth: () => auth, admin };
