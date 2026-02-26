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
      name: name || req.user.name || "",
      email: req.user.email || "",
      phone: phone || req.user.phone_number || "",
      address: address || "",
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
  try {
    const snap = await db.collection("users").orderBy("createdAt", "desc").limit(parseInt(limit)).get();
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

module.exports = router;
