// backend/routes/events.js
// Event booking management — submit, list, update event requests

const express = require("express");
const router = express.Router();
const { getDb } = require("../firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { v4: uuid } = require("uuid");

// ─── POST /api/events — Submit an event booking request ─────────────────────
router.post("/", requireAuth, async (req, res) => {
  const db = getDb();
  const {
    name, email, phone, eventType, date, time,
    location, guests, theme, budget, menu, notes, suggestMenu
  } = req.body;

  // Validation
  if (!name || !email || !phone || !eventType || !date || !location || !guests) {
    return res.status(400).json({ error: "Missing required fields: name, email, phone, eventType, date, location, guests" });
  }

  try {
    const eventId = `EVT-${uuid().slice(0, 8).toUpperCase()}`;
    const eventData = {
      eventId,
      userId: req.user.uid,
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 120),
      phone: String(phone).slice(0, 20),
      eventType: String(eventType).slice(0, 60),
      date,
      time: time || "",
      location: String(location).slice(0, 300),
      guests: Math.min(parseInt(guests) || 0, 10000),
      theme: String(theme || "").slice(0, 200),
      budget: String(budget || "").slice(0, 100),
      menu: String(menu || "").slice(0, 1000),
      notes: String(notes || "").slice(0, 1000),
      suggestMenu: suggestMenu || false,
      status: "pending", // pending | reviewed | confirmed | completed | cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("events").doc(eventId).set(eventData);

    res.status(201).json({
      success: true,
      event: eventData,
      message: "Event booking request submitted successfully",
    });
  } catch (err) {
    console.error("Event booking error:", err);
    res.status(500).json({ error: "Failed to submit event booking" });
  }
});

// ─── GET /api/events/my — Get user's event bookings ─────────────────────────
router.get("/my", requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const snap = await db.collection("events")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const events = snap.docs.map(d => d.data());
    res.json({ events });
  } catch (err) {
    console.error("Fetch user events error:", err);
    res.status(500).json({ error: "Failed to fetch event bookings" });
  }
});

// ─── GET /api/events — Admin: list all event bookings ───────────────────────
router.get("/", requireAdmin, async (req, res) => {
  const db = getDb();
  const { status, limit = 50 } = req.query;
  const cappedLimit = Math.min(parseInt(limit) || 50, 200);

  try {
    let query = db.collection("events").orderBy("createdAt", "desc").limit(cappedLimit);
    if (status) query = query.where("status", "==", status);

    const snap = await query.get();
    const events = snap.docs.map(d => d.data());

    // Stats from lightweight select query
    const allSnap = await db.collection("events").select("status").get();
    const allStatuses = allSnap.docs.map(d => d.data().status);
    const stats = {
      total: allStatuses.length,
      pending: allStatuses.filter(s => s === "pending").length,
      reviewed: allStatuses.filter(s => s === "reviewed").length,
      confirmed: allStatuses.filter(s => s === "confirmed").length,
      completed: allStatuses.filter(s => s === "completed").length,
      cancelled: allStatuses.filter(s => s === "cancelled").length,
    };

    res.json({ events, stats, count: events.length });
  } catch (err) {
    console.error("Admin fetch events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ─── PATCH /api/events/:eventId/status — Admin: update event status ─────────
router.patch("/:eventId/status", requireAdmin, async (req, res) => {
  const db = getDb();
  const { eventId } = req.params;
  const { status, note } = req.body;

  const validStatuses = ["pending", "reviewed", "confirmed", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const ref = db.collection("events").doc(eventId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const update = {
      status,
      updatedAt: new Date().toISOString(),
      ...(note ? { adminNote: note } : {}),
    };

    await ref.update(update);
    res.json({ success: true, eventId, status });
  } catch (err) {
    console.error("Update event status error:", err);
    res.status(500).json({ error: "Failed to update event status" });
  }
});

module.exports = router;
