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
    location, guests, theme, budget, menuItems, notes
  } = req.body;

  // Validation
  if (!name || !email || !phone || !eventType || !date || !location || !guests) {
    return res.status(400).json({ error: "Missing required fields: name, email, phone, eventType, date, location, guests" });
  }

  // Sanitise & cap menuItems array
  let sanitisedMenu = [];
  if (Array.isArray(menuItems)) {
    sanitisedMenu = menuItems.slice(0, 50).map((it) => ({
      itemId:   String(it.itemId || "").slice(0, 20),
      name:     String(it.name || "").slice(0, 100),
      category: String(it.category || "").slice(0, 60),
      price:    Math.max(0, Number(it.price) || 0),
      qty:      Math.min(Math.max(1, parseInt(it.qty) || 1), 5000),
    }));
  }

  const menuTotal = sanitisedMenu.reduce((s, i) => s + i.price * i.qty, 0);

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
      budget: budget ? Number(budget) : 0,
      menuItems: sanitisedMenu,
      menuTotal,
      notes: String(notes || "").slice(0, 1000),
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

// ─── POST /api/events/suggest-menu — Suggest menu items based on budget ─────
router.post("/suggest-menu", requireAuth, async (req, res) => {
  const db = getDb();
  const { budget, guests } = req.body;
  const totalBudget = Number(budget) || 0;
  const guestCount  = Math.max(1, parseInt(guests) || 1);

  if (totalBudget < 1000) {
    return res.status(400).json({ error: "Please provide a valid budget amount (min ₦1,000)" });
  }

  try {
    // Fetch live menu from Firestore
    const snap = await db.collection("menu").orderBy("label").get();
    let categories = snap.docs.map((d) => d.data());

    // Flatten all active items with category info
    const allItems = [];
    for (const cat of categories) {
      for (const item of (cat.items || [])) {
        if (item.active !== false) {
          allItems.push({ ...item, category: cat.label, categoryId: cat.id });
        }
      }
    }

    if (!allItems.length) {
      return res.json({ menuItems: [], totalCost: 0, message: "No menu items available" });
    }

    // Strategy: build a balanced menu per guest, then scale to guest count.
    // Budget per guest
    const perGuest = totalBudget / guestCount;

    // Priority order: 1 rice/pasta, 1 protein, 1 soup (optional), 1 side, 1 swallow (optional)
    const buckets = {
      starch:  allItems.filter((i) => ["Rice", "Pasta", "General"].includes(i.category)),
      protein: allItems.filter((i) => i.category === "Protein"),
      soup:    allItems.filter((i) => i.category === "Soups"),
      swallow: allItems.filter((i) => i.category === "Swallow"),
      sides:   allItems.filter((i) => ["Sides", "Fries & Chips"].includes(i.category)),
    };

    // Sort each bucket by price ascending
    for (const key in buckets) buckets[key].sort((a, b) => a.price - b.price);

    const picked = [];
    let remaining = totalBudget;

    const pick = (bucket, maxQty) => {
      for (const item of bucket) {
        const qty = Math.min(maxQty, Math.floor(remaining / item.price));
        if (qty >= 1) {
          picked.push({ itemId: item.id, name: item.name, category: item.category, price: item.price, qty });
          remaining -= item.price * qty;
          return true;
        }
      }
      return false;
    };

    // Pick 1 starch × guests
    pick(buckets.starch, guestCount);
    // Pick 1 protein × guests
    pick(buckets.protein, guestCount);
    // If budget allows, add soup
    if (remaining > 0) pick(buckets.soup, guestCount);
    // Swallow if soup was picked
    if (picked.some((p) => p.category === "Soups") && remaining > 0) pick(buckets.swallow, guestCount);
    // Sides with leftover
    if (remaining > 0) pick(buckets.sides, guestCount);

    // Try to add more variety with remaining budget
    const pickedIds = new Set(picked.map((p) => p.itemId));
    const unpicked = allItems
      .filter((i) => !pickedIds.has(i.id))
      .sort((a, b) => a.price - b.price);

    for (const item of unpicked) {
      if (remaining < item.price) continue;
      const qty = Math.min(guestCount, Math.floor(remaining / item.price));
      if (qty >= 1) {
        picked.push({ itemId: item.id, name: item.name, category: item.category, price: item.price, qty });
        remaining -= item.price * qty;
      }
      if (remaining <= 0) break;
    }

    const totalCost = picked.reduce((s, i) => s + i.price * i.qty, 0);

    res.json({
      menuItems: picked,
      totalCost,
      budget: totalBudget,
      guests: guestCount,
      remaining: totalBudget - totalCost,
    });
  } catch (err) {
    console.error("Suggest menu error:", err);
    res.status(500).json({ error: "Failed to generate menu suggestion" });
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
