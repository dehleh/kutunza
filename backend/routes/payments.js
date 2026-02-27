// backend/routes/payments.js
// Paystack payment initialization, verification, webhook, and refund

const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { getDb } = require("../firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const FieldValue = admin.firestore.FieldValue;

// Read at request-time so key rotation doesn't require restart
const getPaystackSecret = () => process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

// Startup validation
if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is not set. Payment routes will fail.");
}

// ─── POST /payments/initialize ───────────────────────────────────────────────
// Amount is read from the stored order — never trusted from the client
router.post("/initialize", requireAuth, async (req, res) => {
  const PAYSTACK_SECRET = getPaystackSecret();
  if (!PAYSTACK_SECRET) return res.status(503).json({ error: "Payment service unavailable" });

  const { orderId, email, metadata } = req.body;
  if (!orderId || !email) {
    return res.status(400).json({ error: "orderId and email are required" });
  }

  const db = getDb();

  try {
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderDoc.data();
    if (order.userId !== req.user.uid) return res.status(403).json({ error: "Not your order" });
    if (order.paymentStatus === "paid") return res.status(400).json({ error: "Order is already paid" });

    const amount = order.total; // Server-side authoritative total

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        amount: amount * 100, // Paystack expects kobo
        email,
        reference: orderId,
        currency: "NGN",
        callback_url: `${process.env.ADMIN_URL || process.env.FRONTEND_URL || "http://localhost:5174"}/payment/callback`,
        metadata: {
          orderId,
          userId: req.user.uid,
          expectedAmount: amount,
          custom_fields: [
            { display_name: "Order ID", variable_name: "order_id", value: orderId },
            { display_name: "Customer", variable_name: "customer", value: metadata?.customerName || "" },
          ],
        },
        channels: ["card", "bank", "ussd", "mobile_money", "bank_transfer"],
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" } }
    );

    const { authorization_url, access_code, reference } = response.data.data;

    await db.collection("orders").doc(orderId).update({
      paystackReference: reference,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, authorizationUrl: authorization_url, accessCode: access_code, reference });
  } catch (err) {
    console.error("Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ─── GET /payments/verify/:reference ─────────────────────────────────────────
// Validates that the paid amount matches the order total
router.get("/verify/:reference", requireAuth, async (req, res) => {
  const PAYSTACK_SECRET = getPaystackSecret();
  if (!PAYSTACK_SECRET) return res.status(503).json({ error: "Payment service unavailable" });

  const { reference } = req.params;
  const db = getDb();

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const { status, amount, metadata, customer } = response.data.data;
    if (status !== "success") {
      return res.status(400).json({ error: "Payment not successful", status });
    }

    const orderId = metadata?.orderId || reference;
    const amountPaidNaira = amount / 100;

    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderDoc.data();

    // Idempotency: skip if already paid
    if (order.paymentStatus === "paid") {
      return res.json({ success: true, paid: true, amountPaid: order.amountPaid, reference, orderId, alreadyPaid: true });
    }

    // Amount mismatch check (₦1 tolerance for rounding)
    if (Math.abs(amountPaidNaira - order.total) > 1) {
      console.error(`⚠️ Amount mismatch! Order ${orderId}: expected ₦${order.total}, paid ₦${amountPaidNaira}`);
      await orderRef.update({
        paymentStatus: "amount_mismatch",
        amountPaid: amountPaidNaira,
        updatedAt: new Date().toISOString(),
        timeline: FieldValue.arrayUnion({
          status: "amount_mismatch",
          timestamp: new Date().toISOString(),
          note: `Amount mismatch: expected ₦${order.total}, got ₦${amountPaidNaira}`,
        }),
      });
      return res.status(400).json({ error: "Payment amount does not match order total", paid: false });
    }

    // Confirm the order — use FieldValue.arrayUnion to prevent race condition
    await orderRef.update({
      paymentStatus: "paid",
      status: "confirmed",
      paystackReference: reference,
      amountPaid: amountPaidNaira,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: FieldValue.arrayUnion({
        status: "confirmed",
        timestamp: new Date().toISOString(),
        note: `Payment confirmed via Paystack. Ref: ${reference}`,
      }),
    });

    try {
      await db.collection("users").doc(order.userId).collection("orders").doc(orderId)
        .update({ status: "confirmed", paymentStatus: "paid", updatedAt: new Date().toISOString() });
    } catch (_) {}

    res.json({ success: true, paid: true, amountPaid: amountPaidNaira, reference, orderId, customerEmail: customer?.email });
  } catch (err) {
    console.error("Verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ─── POST /payments/webhook ───────────────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const PAYSTACK_SECRET = getPaystackSecret();
  if (!PAYSTACK_SECRET) return res.sendStatus(503);
  const db = getDb();

  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET).update(req.body).digest("hex");
  if (hash !== req.headers["x-paystack-signature"]) {
    console.warn("⚠️  Invalid Paystack webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body);

  try {
    switch (event.event) {
      case "charge.success": {
        const { reference, amount, metadata, customer } = event.data;
        const orderId = metadata?.orderId || reference;
        const amountPaidNaira = amount / 100;

        if (orderId) {
          const orderRef = db.collection("orders").doc(orderId);
          const orderDoc = await orderRef.get();
          if (orderDoc.exists) {
            const order = orderDoc.data();

            // Amount mismatch
            if (Math.abs(amountPaidNaira - order.total) > 1) {
              console.error(`⚠️ Webhook mismatch: Order ${orderId}: expected ₦${order.total}, paid ₦${amountPaidNaira}`);
              await orderRef.update({ paymentStatus: "amount_mismatch", amountPaid: amountPaidNaira, updatedAt: new Date().toISOString() });
              break;
            }

            // Idempotent — skip if already paid
            if (order.paymentStatus === "paid") break;

            await orderRef.update({
              paymentStatus: "paid",
              status: "confirmed",
              paystackReference: reference,
              amountPaid: amountPaidNaira,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              timeline: FieldValue.arrayUnion({
                status: "confirmed",
                timestamp: new Date().toISOString(),
                note: `Webhook: Payment confirmed. Ref: ${reference}`,
              }),
            });

            try {
              await db.collection("users").doc(order.userId).collection("orders").doc(orderId)
                .update({ status: "confirmed", paymentStatus: "paid", updatedAt: new Date().toISOString() });
            } catch (_) {}
          }
        }

        await db.collection("payments").add({
          reference, orderId, amount: amountPaidNaira,
          customerEmail: customer?.email, event: "charge.success",
          createdAt: new Date().toISOString(),
        });
        break;
      }

      case "charge.failed": {
        const { reference, metadata } = event.data;
        const orderId = metadata?.orderId || reference;
        if (orderId) {
          await db.collection("orders").doc(orderId).update({
            paymentStatus: "failed",
            updatedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case "refund.processed": {
        const { transaction_reference, amount } = event.data;
        const snap = await db.collection("payments").where("reference", "==", transaction_reference).get();
        snap.forEach(doc => doc.ref.update({ refunded: true, refundAmount: amount / 100, refundedAt: new Date().toISOString() }));
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  res.sendStatus(200);
});

// ─── POST /payments/refund — Admin: Paystack refund ──────────────────────────
router.post("/refund", requireAdmin, async (req, res) => {
  const PAYSTACK_SECRET = getPaystackSecret();
  if (!PAYSTACK_SECRET) return res.status(503).json({ error: "Payment service unavailable" });

  const { orderId, reason } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId is required" });

  const db = getDb();
  try {
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderDoc.data();
    if (order.paymentStatus !== "paid" || !order.paystackReference) {
      return res.status(400).json({ error: "Order is not eligible for refund" });
    }

    const response = await axios.post(
      `${PAYSTACK_BASE}/refund`,
      { transaction: order.paystackReference, merchant_note: reason || "Customer refund" },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" } }
    );

    await db.collection("orders").doc(orderId).update({
      paymentStatus: "refund_pending",
      refundReason: reason || "Admin-initiated refund",
      updatedAt: new Date().toISOString(),
      timeline: FieldValue.arrayUnion({
        status: "refund_pending",
        timestamp: new Date().toISOString(),
        note: `Refund initiated: ${reason || "Admin request"}`,
      }),
    });

    res.json({ success: true, refund: response.data.data });
  } catch (err) {
    console.error("Refund error:", err.response?.data || err.message);
    res.status(500).json({ error: "Refund failed" });
  }
});

module.exports = router;
