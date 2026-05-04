// backend/routes/account.js
// Public endpoint for account deletion requests (no auth required —
// the user proves identity via the email confirmation flow).

const express = require("express");
const rateLimit = require("express-rate-limit");
const { getDb } = require("../firebase");

const router = express.Router();

const VALID_DATA_ITEMS = new Set([
  "phone", "address", "orderHistory", "eventBookings", "rewards", "name", "other",
]);

// Strict rate limit: max 3 requests per IP per hour to prevent abuse
const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many requests. Please email kutunzafoods@gmail.com instead." },
});

router.post("/delete-request", deleteLimiter, async (req, res) => {
  try {
    const { email, name, phone, reason, requestType, dataItems } = req.body || {};

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Full name is required." });
    }

    const type = requestType === "partial" ? "partial" : "full";
    let items = [];
    if (type === "partial") {
      if (!Array.isArray(dataItems) || dataItems.length === 0) {
        return res.status(400).json({ error: "Select at least one data item to delete." });
      }
      items = dataItems
        .filter((d) => typeof d === "string" && VALID_DATA_ITEMS.has(d))
        .slice(0, 10);
      if (items.length === 0) {
        return res.status(400).json({ error: "No valid data items selected." });
      }
    }

    const db = getDb();
    await db.collection("deletion_requests").add({
      requestType: type,
      dataItems: items,
      email: String(email).trim().toLowerCase().slice(0, 200),
      name: String(name).trim().slice(0, 200),
      phone: String(phone || "").trim().slice(0, 30),
      reason: String(reason || "").trim().slice(0, 1000),
      ipAddress: req.ip,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[account/delete-request] error:", err);
    res.status(500).json({ error: "Could not submit request. Please email kutunzafoods@gmail.com." });
  }
});

module.exports = router;
