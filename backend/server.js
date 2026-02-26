// backend/server.js
// Kutunza Gourmet — Main API Server

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { initFirebase } = require("./firebase");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const menuRoutes = require("./routes/menu");
const eventRoutes = require("./routes/events");
const settingsRoutes = require("./routes/settings");

// ─── Startup Validation ───────────────────────────────────────────────────────
const REQUIRED_ENV = ["PAYSTACK_SECRET_KEY"];
const RECOMMENDED_ENV = ["FIREBASE_PROJECT_ID", "FRONTEND_URL"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});
RECOMMENDED_ENV.forEach((key) => {
  if (!process.env[key]) console.warn(`⚠️  Missing recommended env var: ${key}`);
});

// ─── Init Firebase ────────────────────────────────────────────────────────────
initFirebase();

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === "production";

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(IS_PROD ? "combined" : "dev"));

// CORS — allow frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "https://kutunzafoods.com",
    "https://www.kutunzafoods.com",
  ],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", limiter);

// Stricter limit for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many payment requests" },
});
app.use("/api/payments/initialize", paymentLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Note: webhook route needs raw body — must come before express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "Kutunza Gourmet API",
    status: "running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (req, res) => {
  try {
    const db = require("./firebase").getDb();
    await db.collection("settings").doc("app_config").get();
    res.json({ status: "ok", firebase: "connected" });
  } catch (err) {
    res.status(503).json({ status: "degraded", firebase: "unreachable", error: err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/settings", settingsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: IS_PROD ? "Internal server error" : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🍛  Kutunza Gourmet API             ║
  ║   Running on http://localhost:${PORT}   ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
