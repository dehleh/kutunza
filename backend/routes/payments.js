// backend/routes/payments.js
// Paystack payment initialization and webhook verification

const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { getDb } = require("../firebase");
const { requireAuth } = require("../middleware/auth");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

// ─── POST /payments/initialize ───────────────────────────────────────────────
// Creates a Paystack payment session and returns the payment URL
router.post("/initialize", requireAuth, async (req, res) => {
  const { amount, email, orderId, metadata } = req.body;

  if (!amount || !email) {
    return res.status(400).json({ error: "Amount and email are required" });
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        amount: amount * 100, // Paystack expects kobo (multiply naira × 100)
        email,
        reference: orderId || `KTZ-${Date.now()}`,
        currency: "NGN",
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          orderId,
          userId: req.user.uid,
          custom_fields: [
            { display_name: "Order ID", variable_name: "order_id", value: orderId },
            { display_name: "Customer", variable_name: "customer", value: metadata?.customerName || "" },
          ],
          ...metadata,
        },
        channels: ["card", "bank", "ussd", "mobile_money", "bank_transfer"],
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, access_code, reference } = response.data.data;
    res.json({ success: true, authorizationUrl: authorization_url, accessCode: access_code, reference });
  } catch (err) {
    console.error("Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ─── GET /payments/verify/:reference ─────────────────────────────────────────
// Verify a payment after redirect callback
router.get("/verify/:reference", requireAuth, async (req, res) => {
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

    const orderId = metadata?.orderId;
    const amountPaid = amount / 100; // Convert back to naira

    // Update order in Firestore
    if (orderId) {
      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const order = orderDoc.data();
        await orderRef.update({
          paymentStatus: "paid",
          status: "confirmed",
          paystackReference: reference,
          amountPaid,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [...(order.timeline || []), {
            status: "confirmed",
            timestamp: new Date().toISOString(),
            note: `Payment confirmed via Paystack. Ref: ${reference}`,
          }],
        });

        // Mirror in user subcollection
        await db
          .collection("users")
          .doc(order.userId)
          .collection("orders")
          .doc(orderId)
          .update({ status: "confirmed", paymentStatus: "paid", updatedAt: new Date().toISOString() });
      }
    }

    res.json({
      success: true,
      paid: true,
      amountPaid,
      reference,
      orderId,
      customerEmail: customer?.email,
    });
  } catch (err) {
    console.error("Verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ─── POST /payments/webhook ───────────────────────────────────────────────────
// Paystack sends events here — MUST be publicly accessible
// Add this URL in: Paystack Dashboard → Settings → API Keys & Webhooks
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const db = getDb();

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(req.body)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.warn("⚠️  Invalid Paystack webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body);
  console.log("📨 Paystack webhook:", event.event);

  try {
    switch (event.event) {
      case "charge.success": {
        const { reference, amount, metadata, customer } = event.data;
        const orderId = metadata?.orderId;

        if (orderId) {
          const orderRef = db.collection("orders").doc(orderId);
          const orderDoc = await orderRef.get();
          if (orderDoc.exists) {
            const order = orderDoc.data();
            await orderRef.update({
              paymentStatus: "paid",
              status: "confirmed",
              paystackReference: reference,
              amountPaid: amount / 100,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              timeline: [...(order.timeline || []), {
                status: "confirmed",
                timestamp: new Date().toISOString(),
                note: `Webhook: Payment confirmed. Ref: ${reference}`,
              }],
            });
          }
        }

        // Log payment record
        await db.collection("payments").add({
          reference,
          orderId,
          amount: amount / 100,
          customerEmail: customer?.email,
          event: "charge.success",
          createdAt: new Date().toISOString(),
        });
        break;
      }

      case "charge.failed": {
        const { reference, metadata } = event.data;
        const orderId = metadata?.orderId;
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
        await db.collection("payments").where("reference", "==", transaction_reference).get().then(snap => {
          snap.forEach(doc => doc.ref.update({ refunded: true, refundAmount: amount / 100, refundedAt: new Date().toISOString() }));
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  res.sendStatus(200); // Always 200 to Paystack
});

module.exports = router;
