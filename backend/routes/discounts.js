// backend/routes/discounts.js
// Discount / promo code management — admin CRUD + customer validation

const express = require("express");
const router = express.Router();
const { getDb } = require("../firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// ─── POST /discounts/admin — Create a discount code ──────────────────────────
router.post("/admin", requireAdmin, async (req, res) => {
  const db = getDb();
  const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt, description } = req.body;

  if (!code || !type || !value) {
    return res.status(400).json({ error: "code, type, and value are required" });
  }

  const cleanCode = String(code).trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, "");
  if (cleanCode.length < 3 || cleanCode.length > 30) {
    return res.status(400).json({ error: "Code must be 3-30 alphanumeric characters" });
  }

  if (!["percentage", "fixed"].includes(type)) {
    return res.status(400).json({ error: "type must be 'percentage' or 'fixed'" });
  }

  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) {
    return res.status(400).json({ error: "value must be a positive number" });
  }
  if (type === "percentage" && numValue > 100) {
    return res.status(400).json({ error: "Percentage cannot exceed 100%" });
  }

  try {
    // Check duplicate
    const existing = await db.collection("discounts").doc(cleanCode).get();
    if (existing.exists) {
      return res.status(409).json({ error: "A discount with this code already exists" });
    }

    const discount = {
      code: cleanCode,
      type,
      value: numValue,
      minOrder: Math.max(0, parseInt(minOrder) || 0),
      maxDiscount: type === "percentage" ? Math.max(0, parseInt(maxDiscount) || 0) : 0,
      usageLimit: Math.max(0, parseInt(usageLimit) || 0), // 0 = unlimited
      usageCount: 0,
      expiresAt: expiresAt || null,
      description: String(description || "").slice(0, 200),
      active: true,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    await db.collection("discounts").doc(cleanCode).set(discount);
    res.status(201).json({ success: true, discount });
  } catch (err) {
    console.error("Create discount error:", err);
    res.status(500).json({ error: "Failed to create discount" });
  }
});

// ─── GET /discounts/admin — List all discounts ───────────────────────────────
router.get("/admin", requireAdmin, async (req, res) => {
  const db = getDb();
  try {
    const snap = await db.collection("discounts").orderBy("createdAt", "desc").get();
    const discounts = snap.docs.map(d => d.data());
    res.json({ discounts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch discounts" });
  }
});

// ─── PATCH /discounts/admin/:code — Toggle active status ─────────────────────
router.patch("/admin/:code", requireAdmin, async (req, res) => {
  const db = getDb();
  const code = req.params.code.toUpperCase();
  const { active } = req.body;

  try {
    const ref = db.collection("discounts").doc(code);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Discount not found" });

    await ref.update({ active: active !== false, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update discount" });
  }
});

// ─── DELETE /discounts/admin/:code — Delete a discount ───────────────────────
router.delete("/admin/:code", requireAdmin, async (req, res) => {
  const db = getDb();
  const code = req.params.code.toUpperCase();

  try {
    const ref = db.collection("discounts").doc(code);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Discount not found" });

    await ref.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete discount" });
  }
});

// ─── POST /discounts/validate — Customer validates a discount code ────────────
router.post("/validate", requireAuth, async (req, res) => {
  const db = getDb();
  const { code, subtotal } = req.body;

  if (!code) return res.status(400).json({ error: "Discount code required" });

  const cleanCode = String(code).trim().toUpperCase();

  try {
    const doc = await db.collection("discounts").doc(cleanCode).get();
    if (!doc.exists) return res.status(404).json({ error: "Invalid discount code" });

    const discount = doc.data();
    const error = validateDiscount(discount, subtotal || 0);
    if (error) return res.status(400).json({ error });

    const discountAmount = calcDiscount(discount, subtotal || 0);

    res.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
      description: discount.description,
    });
  } catch (err) {
    console.error("Validate discount error:", err);
    res.status(500).json({ error: "Failed to validate discount" });
  }
});

// ─── Shared validation logic (also used by orders route) ─────────────────────
function validateDiscount(discount, subtotal) {
  if (!discount.active) return "This discount code is no longer active";
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return "This discount code has expired";
  if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) return "This discount code has reached its usage limit";
  if (discount.minOrder > 0 && subtotal < discount.minOrder) return `Minimum order of ₦${discount.minOrder.toLocaleString()} required for this code`;
  return null;
}

function calcDiscount(discount, subtotal) {
  if (discount.type === "percentage") {
    let amount = Math.floor(subtotal * (discount.value / 100));
    if (discount.maxDiscount > 0) amount = Math.min(amount, discount.maxDiscount);
    return amount;
  }
  // fixed
  return Math.min(discount.value, subtotal);
}

// Exported for use by orders route
async function applyDiscountToOrder(db, code, subtotal) {
  if (!code) return { discountAmount: 0, discountCode: null, discountDetail: null };

  const cleanCode = String(code).trim().toUpperCase();
  const doc = await db.collection("discounts").doc(cleanCode).get();

  if (!doc.exists) throw new Error("Invalid discount code");

  const discount = doc.data();
  const error = validateDiscount(discount, subtotal);
  if (error) throw new Error(error);

  const discountAmount = calcDiscount(discount, subtotal);

  // Increment usage count
  await doc.ref.update({
    usageCount: (discount.usageCount || 0) + 1,
    updatedAt: new Date().toISOString(),
  });

  return {
    discountAmount,
    discountCode: cleanCode,
    discountDetail: {
      code: cleanCode,
      type: discount.type,
      value: discount.value,
      description: discount.description,
    },
  };
}

module.exports = router;
module.exports.applyDiscountToOrder = applyDiscountToOrder;
