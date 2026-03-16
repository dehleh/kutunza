// backend/routes/settings.js
// App settings management — admin-only CRUD for app configuration

const express = require("express");
const router = express.Router();
const { getDb } = require("../firebase");
const { requireAdmin } = require("../middleware/auth");

const SETTINGS_DOC = "app_config";

// ─── GET /api/settings — Get app settings (public) ──────────────────────────
router.get("/", async (req, res) => {
  const db = getDb();
  try {
    const doc = await db.collection("settings").doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      // Return defaults
      return res.json({
        settings: {
          businessName: "Kutunza Gourmet",
          phone1: "",
          phone2: "",
          website: "kutunzafoods.com",
          address: "Lagos, Nigeria",
          deliveryAreas: "",
          deliveryFee: 1500,
          minOrderAmount: 0,
          operatingHours: "",
          socialLinks: { instagram: "", twitter: "", facebook: "" },
          whatsappNumber: "",
          whatsappEnabled: false,
          bankAccountDetails: "",
        },
      });
    }
    res.json({ settings: doc.data() });
  } catch (err) {
    console.error("Fetch settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// ─── PUT /api/settings — Admin: update all settings ─────────────────────────
router.put("/", requireAdmin, async (req, res) => {
  const db = getDb();
  const {
    businessName, phone1, phone2, website, address,
    deliveryAreas, deliveryFee, minOrderAmount,
    operatingHours, socialLinks,
    whatsappNumber, whatsappEnabled,
  } = req.body;

  try {
    const settings = {
      businessName: businessName || "Kutunza Gourmet",
      phone1: phone1 || "",
      phone2: phone2 || "",
      website: website || "",
      address: address || "",
      deliveryAreas: deliveryAreas || "",
      deliveryFee: parseInt(deliveryFee) || 1500,
      minOrderAmount: parseInt(minOrderAmount) || 0,
      operatingHours: operatingHours || "",
      socialLinks: socialLinks || {},
      whatsappNumber: String(whatsappNumber || "").slice(0, 20),
      whatsappEnabled: Boolean(whatsappEnabled),
      bankAccountDetails: String(req.body.bankAccountDetails || "").slice(0, 500),
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid,
    };

    await db.collection("settings").doc(SETTINGS_DOC).set(settings, { merge: true });
    res.json({ success: true, settings });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;
