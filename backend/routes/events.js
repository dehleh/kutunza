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
      name,
      email,
      phone,
      eventType,
      date,
      time: time || "",
      location,
      guests: parseInt(guests) || 0,
      theme: theme || "",
      budget: budget || "",
      menu: menu || "",
      notes: notes || "",
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

  try {
    let query = db.collection("events").orderBy("createdAt", "desc").limit(parseInt(limit));
    if (status) query = query.where("status", "==", status);

    const snap = await query.get();
    const events = snap.docs.map(d => d.data());

    // Stats
    const allSnap = await db.collection("events").get();
    const allEvents = allSnap.docs.map(d => d.data());
    const stats = {
      total: allEvents.length,
      pending: allEvents.filter(e => e.status === "pending").length,
      reviewed: allEvents.filter(e => e.status === "reviewed").length,
      confirmed: allEvents.filter(e => e.status === "confirmed").length,
      completed: allEvents.filter(e => e.status === "completed").length,
      cancelled: allEvents.filter(e => e.status === "cancelled").length,
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
