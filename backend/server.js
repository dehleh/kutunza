// backend/server.js
// Kutunza Gourmet — Main API Server

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const { initFirebase } = require("./firebase");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const menuRoutes = require("./routes/menu");
const eventRoutes = require("./routes/events");
const settingsRoutes = require("./routes/settings");
const rewardsRoutes = require("./routes/rewards");

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

// ─── Trust proxy (B21) — required behind reverse proxies (Railway, Render) ──
if (IS_PROD) app.set("trust proxy", 1);

// ─── Request ID middleware (B16) ─────────────────────────────────────────────
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
});

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: IS_PROD ? undefined : false, // A4 — helmet defaults CSP in prod
}));
app.use(morgan(IS_PROD ? "combined" : "dev"));

// CORS — allow admin webapp + mobile app
app.use(cors({
  origin: [
    process.env.ADMIN_URL || "http://localhost:5174",
    process.env.FRONTEND_URL || "http://localhost:5173",
    "https://admin.kutunzafoods.com",
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
app.use("/api/rewards", rewardsRoutes);

// ─── 404 Handler (B20 — no path leak) ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[${req.id || "?"}] Unhandled error:`, err);
  res.status(err.status || 500).json({
    error: IS_PROD ? "Internal server error" : err.message,
  });
});

// ─── Graceful Shutdown (B1) ──────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🍛  Kutunza Gourmet API             ║
  ║   Running on http://localhost:${PORT}   ║
  ╚═══════════════════════════════════════╝
  `);
});

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  // Force kill after 10s
  setTimeout(() => {
    console.error("Could not close connections in time, forcing shutdown.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;
