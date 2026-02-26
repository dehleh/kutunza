// backend/routes/auth.js
// User profile management — Firebase handles actual auth on the frontend

const express = require("express");
const router = express.Router();
const { getDb, getAuth } = require("../firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// ─── POST /auth/profile — Create or update user profile after sign-up ────────
router.post("/profile", requireAuth, async (req, res) => {
  const db = getDb();
  const { name, phone, address } = req.body;
  const uid = req.user.uid;

  try {
    const userRef = db.collection("users").doc(uid);
    const existing = await userRef.get();

    const profile = {
      uid,
      name: String(name || req.user.name || "").slice(0, 120),
      email: req.user.email || "",
      phone: String(phone || req.user.phone_number || "").slice(0, 20),
      address: String(address || "").slice(0, 500),
      updatedAt: new Date().toISOString(),
      ...(existing.exists ? {} : {
        createdAt: new Date().toISOString(),
        orderCount: 0,
        totalSpent: 0,
      }),
    };

    await userRef.set(profile, { merge: true });
    res.json({ success: true, profile });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── GET /auth/profile — Get current user's profile ──────────────────────────
router.get("/profile", requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const doc = await db.collection("users").doc(req.user.uid).get();
    if (!doc.exists) return res.json({ profile: null, isAdmin: false });

    // Check admin status
    const adminDoc = await db.collection("admins").doc(req.user.uid).get();
    res.json({ profile: doc.data(), isAdmin: adminDoc.exists });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ─── GET /auth/admin/users — Admin: list all users ───────────────────────────
router.get("/admin/users", requireAdmin, async (req, res) => {
  const db = getDb();
  const { limit = 50 } = req.query;
  const cappedLimit = Math.min(parseInt(limit) || 50, 200);
  try {
    const snap = await db.collection("users").orderBy("createdAt", "desc").limit(cappedLimit).get();
    const users = snap.docs.map(d => d.data());
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ─── POST /auth/admin/grant — Grant admin role to a user ────────────────────
router.post("/admin/grant", requireAdmin, async (req, res) => {
  const db = getDb();
  const { targetUid } = req.body;
  if (!targetUid) return res.status(400).json({ error: "targetUid required" });

  try {
    await db.collection("admins").doc(targetUid).set({
      grantedBy: req.user.uid,
      grantedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to grant admin" });
  }
});
// ─── POST /auth/admin/revoke — Remove admin role from a user ─────────────
router.post("/admin/revoke", requireAdmin, async (req, res) => {
  const db = getDb();
  const { targetUid } = req.body;
  if (!targetUid) return res.status(400).json({ error: "targetUid required" });

  // Prevent self-revocation
  if (targetUid === req.user.uid) {
    return res.status(400).json({ error: "Cannot revoke your own admin access" });
  }

  try {
    await db.collection("admins").doc(targetUid).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke admin" });
  }
});

// ─── POST /auth/admin/bootstrap — First-time admin setup ────────────────
// Only works when NO admins exist yet (chicken-and-egg solver)
router.post("/admin/bootstrap", requireAuth, async (req, res) => {
  const db = getDb();

  // Check the bootstrap secret (must be set in env)
  const { secret } = req.body;
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) return res.status(503).json({ error: "Bootstrap not configured" });
  if (secret !== expected) return res.status(403).json({ error: "Invalid bootstrap secret" });

  try {
    // Only allow if no admins exist
    const adminsSnap = await db.collection("admins").limit(1).get();
    if (!adminsSnap.empty) {
      return res.status(400).json({ error: "Admin already exists. Use /admin/grant instead." });
    }

    await db.collection("admins").doc(req.user.uid).set({
      grantedBy: "bootstrap",
      grantedAt: new Date().toISOString(),
    });
    res.json({ success: true, message: "You are now the first admin" });
  } catch (err) {
    res.status(500).json({ error: "Bootstrap failed" });
  }
});
module.exports = router;
