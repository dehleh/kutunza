// backend/middleware/auth.js
// Verifies Firebase ID tokens on protected routes

const { getAuth } = require("../firebase");

/**
 * Require valid Firebase auth token
 * Attaches decoded token to req.user
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.split("Bearer ")[1];
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded; // { uid, email, phone_number, name, ... }
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Require admin role
 * Admin UIDs are stored in Firestore: admins/{uid}
 */
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    const { getDb } = require("../firebase");
    const db = getDb();
    try {
      const adminDoc = await db.collection("admins").doc(req.user.uid).get();
      if (!adminDoc.exists) {
        return res.status(403).json({ error: "Admin access required" });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: "Could not verify admin status" });
    }
  });
}

/**
 * Optional auth — attaches user if token present but doesn't block
 */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const token = header.split("Bearer ")[1];
    req.user = await getAuth().verifyIdToken(token);
  } catch (_) {}
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
