// backend/routes/orders.js
// Full order CRUD — place, fetch, update status, history

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { getDb } = require("../firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const FieldValue = admin.firestore.FieldValue;

// ─── Order Status Flow ────────────────────────────────────────────────────────
// pending → confirmed → preparing → out_for_delivery → delivered
// Any state → cancelled

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// ─── POST /orders — Place new order ──────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  const db = getDb();
  const { cart, deliveryType, address, phone, name, note, paymentMethod } = req.body;

  if (!cart?.length) return res.status(400).json({ error: "Cart is empty" });
  if (!phone || !name) return res.status(400).json({ error: "Name and phone are required" });

  // Validate paymentMethod
  const validPaymentMethods = ["paystack", "whatsapp"];
  const method = validPaymentMethods.includes(paymentMethod) ? paymentMethod : "paystack";

  // Validate minimum order
  const subtotal = cart.reduce((s, i) => s + i.finalPrice * i.qty, 0);
  const minOrder = parseInt(process.env.MIN_ORDER_AMOUNT) || 2000;
  if (subtotal < minOrder) {
    return res.status(400).json({ error: `Minimum order is ₦${minOrder.toLocaleString()}` });
  }

  const deliveryFee = deliveryType === "delivery" ? (parseInt(process.env.DELIVERY_FEE) || 1500) : 0;
  const total = subtotal + deliveryFee;

  const orderId = `KTZ-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

  // WhatsApp orders await bank transfer; Paystack orders start with payment pending
  const isWhatsApp = method === "whatsapp";

  const order = {
    orderId,
    userId: req.user.uid,
    userEmail: req.user.email || null,
    customer: { name: name.slice(0, 120), phone: phone.slice(0, 20), email: req.user.email || null },
    cart: cart.map(i => ({
      id: i.id,
      name: String(i.name).slice(0, 100),
      qty: Math.min(Math.max(parseInt(i.qty) || 1, 1), 100),
      unitPrice: i.finalPrice,
      bowlSize: i.bowlSize?.label || "Single Portion",
      lineTotal: i.finalPrice * i.qty,
    })),
    deliveryType,       // "delivery" | "pickup"
    address: address ? String(address).slice(0, 500) : null,
    note: note ? String(note).slice(0, 500) : null,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: method,
    status: "pending",
    paymentStatus: isWhatsApp ? "awaiting_transfer" : "pending",
    paystackReference: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      { status: "pending", timestamp: new Date().toISOString(), note: isWhatsApp ? "Order placed via WhatsApp — awaiting bank transfer" : "Order placed" },
    ],
  };

  try {
    await db.collection("orders").doc(orderId).set(order);

    // Also store reference in user's subcollection for quick lookup
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("orders")
      .doc(orderId)
      .set({ orderId, total, status: order.status, createdAt: order.createdAt });

    res.status(201).json({ success: true, orderId, order });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ─── GET /orders/my — Customer order history ─────────────────────────────────
router.get("/my", requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const snap = await db
      .collection("orders")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const orders = snap.docs.map(d => d.data());
    res.json({ orders });
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── GET /orders/:id — Single order (must be owner or admin) ─────────────────
router.get("/:id", requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const doc = await db.collection("orders").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const order = doc.data();
    // Check ownership
    if (order.userId !== req.user.uid) {
      // Allow admin
      const adminDoc = await db.collection("admins").doc(req.user.uid).get();
      if (!adminDoc.exists) return res.status(403).json({ error: "Access denied" });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ─── PATCH /orders/:id/status — Admin updates order status ───────────────────
router.patch("/:id/status", requireAdmin, async (req, res) => {
  const db = getDb();
  const { status, note } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}` });
  }

  try {
    const ref = db.collection("orders").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const order = doc.data();
    const timelineEntry = {
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.uid,
    };

    await ref.update({
      status,
      updatedAt: new Date().toISOString(),
      timeline: [...(order.timeline || []), timelineEntry],
    });

    // Mirror in user subcollection
    await db
      .collection("users")
      .doc(order.userId)
      .collection("orders")
      .doc(req.params.id)
      .update({ status, updatedAt: new Date().toISOString() });

    res.json({ success: true, orderId: req.params.id, status });
  } catch (err) {
    console.error("Status update failed:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ─── PATCH /orders/:id/confirm-payment — Admin confirms bank transfer ────────
router.patch("/:id/confirm-payment", requireAdmin, async (req, res) => {
  const db = getDb();
  try {
    const ref = db.collection("orders").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const order = doc.data();
    if (order.paymentStatus === "paid") {
      return res.json({ success: true, alreadyPaid: true });
    }
    if (order.paymentMethod !== "whatsapp") {
      return res.status(400).json({ error: "Only WhatsApp orders can be confirmed manually" });
    }

    const timelineEntry = {
      status: "confirmed",
      timestamp: new Date().toISOString(),
      note: "Bank transfer confirmed by admin",
      updatedBy: req.user.uid,
    };

    await ref.update({
      paymentStatus: "paid",
      status: "confirmed",
      updatedAt: new Date().toISOString(),
      timeline: [...(order.timeline || []), timelineEntry],
    });

    await db
      .collection("users")
      .doc(order.userId)
      .collection("orders")
      .doc(req.params.id)
      .update({ status: "confirmed", updatedAt: new Date().toISOString() });

    res.json({ success: true, orderId: req.params.id });
  } catch (err) {
    console.error("Confirm payment failed:", err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// ─── GET /orders — Admin: all orders with filters ────────────────────────────
router.get("/", requireAdmin, async (req, res) => {
  const db = getDb();
  const { status, limit = 50, startAfter } = req.query;
  const cappedLimit = Math.min(parseInt(limit) || 50, 200);

  try {
    let query = db.collection("orders").orderBy("createdAt", "desc");

    if (status) query = query.where("status", "==", status);
    query = query.limit(cappedLimit);
    if (startAfter) {
      const cursor = await db.collection("orders").doc(startAfter).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }

    const snap = await query.get();
    const orders = snap.docs.map(d => d.data());

    // Use stats counter doc if available, otherwise lightweight select
    let stats;
    const statsDoc = await db.collection("counters").doc("order_stats").get();
    if (statsDoc.exists) {
      stats = statsDoc.data();
    } else {
      const allSnap = await db.collection("orders").select("status", "paymentStatus", "total").get();
      const allOrders = allSnap.docs.map(d => d.data());
      stats = {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === "pending").length,
        confirmed: allOrders.filter(o => o.status === "confirmed").length,
        preparing: allOrders.filter(o => o.status === "preparing").length,
        out_for_delivery: allOrders.filter(o => o.status === "out_for_delivery").length,
        delivered: allOrders.filter(o => o.status === "delivered").length,
        cancelled: allOrders.filter(o => o.status === "cancelled").length,
        totalRevenue: allOrders
          .filter(o => o.paymentStatus === "paid")
          .reduce((s, o) => s + (o.total || 0), 0),
      };
    }

    res.json({ orders, stats });
  } catch (err) {
    console.error("Admin fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── DELETE /orders/:id — Admin cancel/delete ────────────────────────────────
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const db = getDb();
  const { reason } = req.body;
  try {
    const ref = db.collection("orders").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const order = doc.data();
    // Customer can only cancel their own pending orders
    const isOwner = order.userId === req.user.uid;
    const isAdminUser = (await db.collection("admins").doc(req.user.uid).get()).exists;
    if (!isOwner && !isAdminUser) return res.status(403).json({ error: "Access denied" });
    if (isOwner && !isAdminUser && order.status !== "pending") {
      return res.status(400).json({ error: "Can only cancel pending orders" });
    }

    const updateData = {
      status: "cancelled",
      cancellationReason: reason ? String(reason).slice(0, 500) : "Cancelled by customer",
      updatedAt: new Date().toISOString(),
    };

    // If order was paid, mark for refund
    if (order.paymentStatus === "paid") {
      updateData.paymentStatus = "refund_pending";
    }

    // Use arrayUnion for timeline to prevent race conditions
    await ref.update({
      ...updateData,
      timeline: FieldValue.arrayUnion({
        status: "cancelled",
        timestamp: new Date().toISOString(),
        note: reason ? String(reason).slice(0, 500) : "Cancelled by customer",
      }),
    });

    res.json({ success: true, refundPending: order.paymentStatus === "paid" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// ─── POST /orders/cleanup — Admin: expire abandoned pending orders ───────────
// Orders that stay "pending" + payment "pending" for > 1 hour are expired
router.post("/cleanup", requireAdmin, async (req, res) => {
  const db = getDb();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

  try {
    const snap = await db.collection("orders")
      .where("status", "==", "pending")
      .where("paymentStatus", "==", "pending")
      .where("createdAt", "<", cutoff)
      .limit(100)
      .get();

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        paymentStatus: "expired",
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();

    res.json({ success: true, expired: snap.size });
  } catch (err) {
    console.error("Cleanup error:", err);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

module.exports = router;
