// backend/routes/menu.js
// Menu CRUD — public read, admin write

const express = require("express");
const router = express.Router();
const { getDb } = require("../firebase");
const { requireAdmin } = require("../middleware/auth");

// ─── GET /menu — Public: fetch full menu ──────────────────────────────────────
router.get("/", async (req, res) => {
  const db = getDb();
  try {
    const snap = await db.collection("menu").orderBy("order").get();

    if (snap.empty) {
      // Return empty — frontend uses DEFAULT_MENU until seeded
      return res.json({ menu: [], seeded: false });
    }

    const menu = snap.docs.map(d => d.data());
    res.json({ menu, seeded: true });
  } catch (err) {
    console.error("Fetch menu error:", err);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// ─── POST /menu/seed — Admin: seed initial menu from frontend DEFAULT_MENU ───
router.post("/seed", requireAdmin, async (req, res) => {
  const db = getDb();
  const { categories } = req.body;

  if (!categories?.length) return res.status(400).json({ error: "No categories provided" });

  try {
    const batch = db.batch();
    categories.forEach((cat, idx) => {
      const ref = db.collection("menu").doc(cat.id);
      batch.set(ref, { ...cat, order: idx, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
    res.json({ success: true, count: categories.length });
  } catch (err) {
    res.status(500).json({ error: "Seed failed" });
  }
});

// ─── PUT /menu/:catId — Admin: update a full category ────────────────────────
router.put("/:catId", requireAdmin, async (req, res) => {
  const db = getDb();
  const { label, icon, items } = req.body;
  try {
    await db.collection("menu").doc(req.params.catId).update({
      label, icon, items, updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ─── PATCH /menu/:catId/item/:itemId — Admin: toggle item active/inactive ────
router.patch("/:catId/item/:itemId/toggle", requireAdmin, async (req, res) => {
  const db = getDb();
  try {
    const ref = db.collection("menu").doc(req.params.catId);
    // B18 — use transaction to prevent read-modify-write race
    await db.runTransaction(async (t) => {
      const doc = await t.get(ref);
      if (!doc.exists) throw Object.assign(new Error("Category not found"), { status: 404 });

      const cat = doc.data();
      const items = cat.items.map(i =>
        i.id === req.params.itemId ? { ...i, active: !i.active } : i
      );
      t.update(ref, { items, updatedAt: new Date().toISOString() });
    });
    res.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Toggle failed" });
  }
});

// ─── PATCH /menu/:catId/item/:itemId — Admin: edit item ──────────────────────
router.patch("/:catId/item/:itemId", requireAdmin, async (req, res) => {
  const db = getDb();
  const { name, price, desc } = req.body;
  try {
    const ref = db.collection("menu").doc(req.params.catId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Category not found" });

    const cat = doc.data();
    const items = cat.items.map(i =>
      i.id === req.params.itemId
        ? { ...i, name: name || i.name, price: price || i.price, desc: desc || i.desc }
        : i
    );
    await ref.update({ items, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Edit item failed" });
  }
});

// ─── POST /menu/:catId/item — Admin: add item to category ────────────────────
router.post("/:catId/item", requireAdmin, async (req, res) => {
  const db = getDb();
  const { id, name, price, desc } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price required" });

  try {
    const ref = db.collection("menu").doc(req.params.catId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Category not found" });

    const cat = doc.data();
    const newItem = { id: id || `item_${Date.now()}`, name, price: Number(price), desc: desc || "", active: true };
    await ref.update({
      items: [...cat.items, newItem],
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: "Add item failed" });
  }
});

// ─── DELETE /menu/:catId/item/:itemId — Admin: remove item ───────────────────
router.delete("/:catId/item/:itemId", requireAdmin, async (req, res) => {
  const db = getDb();
  try {
    const ref = db.collection("menu").doc(req.params.catId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Category not found" });

    const cat = doc.data();
    await ref.update({
      items: cat.items.filter(i => i.id !== req.params.itemId),
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete item failed" });
  }
});

// ─── POST /menu/category — Admin: add new category ───────────────────────────
router.post("/category", requireAdmin, async (req, res) => {
  const db = getDb();
  const { id, label, icon } = req.body;
  if (!label) return res.status(400).json({ error: "Category label required" });

  try {
    const catId = id || `cat_${Date.now()}`;
    await db.collection("menu").doc(catId).set({
      id: catId, label, icon: icon || "🍽️", items: [], order: 99, updatedAt: new Date().toISOString()
    });
    res.json({ success: true, catId });
  } catch (err) {
    res.status(500).json({ error: "Add category failed" });
  }
});

// ─── DELETE /menu/:catId — Admin: remove category ────────────────────────────
router.delete("/:catId", requireAdmin, async (req, res) => {
  const db = getDb();
  try {
    await db.collection("menu").doc(req.params.catId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete category failed" });
  }
});

module.exports = router;
