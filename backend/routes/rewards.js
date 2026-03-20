// backend/routes/rewards.js
// Loyalty & Rewards system — monthly and annual tiers, point earning & redemption

const express = require("express");
const router = express.Router();
const { getDb } = require("../firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// ─── Tier Definitions ─────────────────────────────────────────────────────────
const TIERS = [
  { name: "Bronze",   minPoints: 0,     multiplier: 1,   color: "#CD7F32" },
  { name: "Silver",   minPoints: 5000,  multiplier: 1.5, color: "#C0C0C0" },
  { name: "Gold",     minPoints: 15000, multiplier: 2,   color: "#FFD700" },
  { name: "Platinum", minPoints: 50000, multiplier: 3,   color: "#E5E4E2" },
];

function getTier(annualPoints) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (annualPoints >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

function getCurrentPeriod() {
  const now = new Date();
  return {
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    year: String(now.getFullYear()),
  };
}

// ─── GET /rewards — Get current user's rewards summary ────────────────────────
router.get("/", requireAuth, async (req, res) => {
  const db = getDb();
  const uid = req.user.uid;
  const { month, year } = getCurrentPeriod();

  try {
    const rewardRef = db.collection("rewards").doc(uid);
    const doc = await rewardRef.get();

    if (!doc.exists) {
      // Return empty rewards for new users
      const empty = {
        uid,
        pointsBalance: 0,
        lifetimePoints: 0,
        lifetimeSpent: 0,
        annualPoints: 0,
        annualSpent: 0,
        annualYear: year,
        monthlyPoints: 0,
        monthlySpent: 0,
        currentMonth: month,
        tier: TIERS[0],
        tiers: TIERS,
        memberSince: null,
        recentTransactions: [],
      };
      return res.json({ rewards: empty });
    }

    const data = doc.data();

    // Reset annual if year changed
    if (data.annualYear !== year) {
      data.annualPoints = 0;
      data.annualSpent = 0;
      data.annualYear = year;
    }
    // Reset monthly if month changed
    if (data.currentMonth !== month) {
      data.monthlyPoints = 0;
      data.monthlySpent = 0;
      data.currentMonth = month;
    }

    const tier = getTier(data.annualPoints || 0);

    // Fetch recent transactions (last 20)
    const txSnap = await db.collection("rewards").doc(uid)
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const recentTransactions = txSnap.docs.map(d => d.data());

    res.json({
      rewards: {
        ...data,
        tier,
        tiers: TIERS,
        recentTransactions,
      },
    });
  } catch (err) {
    console.error("Rewards fetch error:", err);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

// ─── GET /rewards/config — Get rewards configuration ──────────────────────────
router.get("/config", async (req, res) => {
  const db = getDb();
  try {
    const doc = await db.collection("settings").doc("rewards_config").get();
    const defaults = {
      pointsPerHundredNaira: 1,
      redemptionRate: 1, // 1 point = ₦1
      minRedeemPoints: 100,
      monthlyBonusThreshold: 10000, // spend ₦10k/month → bonus
      monthlyBonusPoints: 50,
      enabled: true,
    };
    res.json({ config: doc.exists ? { ...defaults, ...doc.data() } : defaults });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rewards config" });
  }
});

// ─── POST /rewards/redeem — Redeem points for discount ────────────────────────
router.post("/redeem", requireAuth, async (req, res) => {
  const db = getDb();
  const uid = req.user.uid;
  const { points } = req.body;

  if (!points || points <= 0 || !Number.isInteger(points)) {
    return res.status(400).json({ error: "Invalid points amount" });
  }

  try {
    // Get config
    const configDoc = await db.collection("settings").doc("rewards_config").get();
    const config = configDoc.exists ? configDoc.data() : {};
    const minRedeem = config.minRedeemPoints || 100;
    const redemptionRate = config.redemptionRate || 1;
    const enabled = config.enabled !== false;

    if (!enabled) return res.status(400).json({ error: "Rewards system is currently disabled" });
    if (points < minRedeem) {
      return res.status(400).json({ error: `Minimum redemption is ${minRedeem} points` });
    }

    const rewardRef = db.collection("rewards").doc(uid);
    const doc = await rewardRef.get();

    if (!doc.exists || doc.data().pointsBalance < points) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    const discount = points * redemptionRate; // ₦ value

    // Generate a redemption code tied to this user
    const code = `RWD-${uid.slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`;

    // Deduct points
    await rewardRef.update({
      pointsBalance: doc.data().pointsBalance - points,
      updatedAt: new Date().toISOString(),
    });

    // Log transaction
    await rewardRef.collection("transactions").add({
      type: "redeem",
      points: -points,
      description: `Redeemed ${points} points for ₦${discount.toLocaleString()} discount`,
      code,
      discount,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, code, discount, pointsRemaining: doc.data().pointsBalance - points });
  } catch (err) {
    console.error("Redeem error:", err);
    res.status(500).json({ error: "Failed to redeem points" });
  }
});

// ─── POST /rewards/apply-code — Apply a redemption code to an order ───────────
router.post("/apply-code", requireAuth, async (req, res) => {
  const db = getDb();
  const uid = req.user.uid;
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: "Redemption code required" });

  try {
    // Find the transaction with this code
    const txSnap = await db.collection("rewards").doc(uid)
      .collection("transactions")
      .where("code", "==", code)
      .where("type", "==", "redeem")
      .limit(1)
      .get();

    if (txSnap.empty) {
      return res.status(404).json({ error: "Invalid redemption code" });
    }

    const tx = txSnap.docs[0].data();

    if (tx.used) {
      return res.status(400).json({ error: "This code has already been used" });
    }

    // Mark as used
    await txSnap.docs[0].ref.update({ used: true, usedAt: new Date().toISOString() });

    res.json({ success: true, discount: tx.discount });
  } catch (err) {
    console.error("Apply code error:", err);
    res.status(500).json({ error: "Failed to apply code" });
  }
});

// ─── Admin: GET /rewards/admin/overview — Rewards system stats ────────────────
router.get("/admin/overview", requireAdmin, async (req, res) => {
  const db = getDb();
  const { month, year } = getCurrentPeriod();

  try {
    const rewardsSnap = await db.collection("rewards").get();

    let totalMembers = 0;
    let totalPointsIssued = 0;
    let totalPointsBalance = 0;
    let totalRedeemed = 0;
    const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    const topMembers = [];

    rewardsSnap.docs.forEach(d => {
      const data = d.data();
      totalMembers++;
      totalPointsIssued += data.lifetimePoints || 0;
      totalPointsBalance += data.pointsBalance || 0;
      totalRedeemed += (data.lifetimePoints || 0) - (data.pointsBalance || 0);

      const annualPts = (data.annualYear === year) ? (data.annualPoints || 0) : 0;
      const tier = getTier(annualPts);
      tierCounts[tier.name]++;

      topMembers.push({
        uid: data.uid,
        name: data.name || "Unknown",
        lifetimePoints: data.lifetimePoints || 0,
        annualPoints: annualPts,
        pointsBalance: data.pointsBalance || 0,
        tier: tier.name,
      });
    });

    // Sort by lifetime points
    topMembers.sort((a, b) => b.lifetimePoints - a.lifetimePoints);

    res.json({
      overview: {
        totalMembers,
        totalPointsIssued,
        totalPointsBalance,
        totalRedeemed,
        tierCounts,
        topMembers: topMembers.slice(0, 20),
        currentMonth: month,
        currentYear: year,
      },
    });
  } catch (err) {
    console.error("Rewards overview error:", err);
    res.status(500).json({ error: "Failed to fetch rewards overview" });
  }
});

// ─── Admin: GET /rewards/admin/user/:uid — User reward details ────────────────
router.get("/admin/user/:uid", requireAdmin, async (req, res) => {
  const db = getDb();
  const { uid } = req.params;

  try {
    const rewardDoc = await db.collection("rewards").doc(uid).get();
    if (!rewardDoc.exists) {
      return res.json({ rewards: null, transactions: [] });
    }

    const data = rewardDoc.data();
    const tier = getTier(data.annualPoints || 0);

    const txSnap = await db.collection("rewards").doc(uid)
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    res.json({
      rewards: { ...data, tier },
      transactions: txSnap.docs.map(d => d.data()),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user rewards" });
  }
});

// ─── Admin: POST /rewards/admin/adjust — Manually adjust points ───────────────
router.post("/admin/adjust", requireAdmin, async (req, res) => {
  const db = getDb();
  const { uid, points, reason } = req.body;

  if (!uid) return res.status(400).json({ error: "User ID required" });
  if (!points || !Number.isInteger(points)) return res.status(400).json({ error: "Integer points required" });
  if (!reason) return res.status(400).json({ error: "Reason required" });

  try {
    const rewardRef = db.collection("rewards").doc(uid);
    const doc = await rewardRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User has no rewards account" });
    }

    const current = doc.data();
    const newBalance = Math.max(0, (current.pointsBalance || 0) + points);

    const update = {
      pointsBalance: newBalance,
      updatedAt: new Date().toISOString(),
    };
    // If adding points, also increase lifetime and annual
    if (points > 0) {
      update.lifetimePoints = (current.lifetimePoints || 0) + points;
      const { year } = getCurrentPeriod();
      if (current.annualYear === year) {
        update.annualPoints = (current.annualPoints || 0) + points;
      }
    }

    await rewardRef.update(update);

    // Log transaction
    await rewardRef.collection("transactions").add({
      type: points > 0 ? "admin_credit" : "admin_debit",
      points,
      description: `Admin adjustment: ${reason}`,
      adjustedBy: req.user.uid,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, newBalance });
  } catch (err) {
    console.error("Admin adjust error:", err);
    res.status(500).json({ error: "Failed to adjust points" });
  }
});

// ─── Admin: PUT /rewards/admin/config — Update rewards configuration ──────────
router.put("/admin/config", requireAdmin, async (req, res) => {
  const db = getDb();
  const { pointsPerHundredNaira, redemptionRate, minRedeemPoints, monthlyBonusThreshold, monthlyBonusPoints, enabled } = req.body;

  try {
    const config = {
      pointsPerHundredNaira: Math.max(1, parseInt(pointsPerHundredNaira) || 1),
      redemptionRate: Math.max(0.5, parseFloat(redemptionRate) || 1),
      minRedeemPoints: Math.max(10, parseInt(minRedeemPoints) || 100),
      monthlyBonusThreshold: Math.max(0, parseInt(monthlyBonusThreshold) || 10000),
      monthlyBonusPoints: Math.max(0, parseInt(monthlyBonusPoints) || 50),
      enabled: enabled !== false,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("settings").doc("rewards_config").set(config, { merge: true });
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: "Failed to update rewards config" });
  }
});

// ─── Utility: Award points when order is delivered (called from orders route) ─
// This is exported for use by the orders route
async function awardOrderPoints(db, userId, orderId, orderTotal, customerName) {
  const { month, year } = getCurrentPeriod();

  try {
    // Get config
    const configDoc = await db.collection("settings").doc("rewards_config").get();
    const config = configDoc.exists ? configDoc.data() : {};
    const pointsRate = config.pointsPerHundredNaira || 1;
    const monthlyBonusThreshold = config.monthlyBonusThreshold || 10000;
    const monthlyBonusPoints = config.monthlyBonusPoints || 50;
    const enabled = config.enabled !== false;

    if (!enabled) return;

    const rewardRef = db.collection("rewards").doc(userId);
    const doc = await rewardRef.get();

    // Calculate base points
    const basePoints = Math.floor((orderTotal / 100) * pointsRate);

    // Check annual tier for multiplier
    const existing = doc.exists ? doc.data() : null;
    const annualPts = (existing?.annualYear === year) ? (existing?.annualPoints || 0) : 0;
    const tier = getTier(annualPts);
    const earnedPoints = Math.floor(basePoints * tier.multiplier);

    if (earnedPoints <= 0) return;

    // Build the update
    const now = new Date().toISOString();

    if (!doc.exists) {
      // First-time rewards account
      await rewardRef.set({
        uid: userId,
        name: customerName || "",
        pointsBalance: earnedPoints,
        lifetimePoints: earnedPoints,
        lifetimeSpent: orderTotal,
        annualPoints: earnedPoints,
        annualSpent: orderTotal,
        annualYear: year,
        monthlyPoints: earnedPoints,
        monthlySpent: orderTotal,
        currentMonth: month,
        memberSince: now,
        updatedAt: now,
      });
    } else {
      // Reset periods if needed
      const resetMonthly = existing.currentMonth !== month;
      const resetAnnual = existing.annualYear !== year;

      const update = {
        name: customerName || existing.name || "",
        pointsBalance: (existing.pointsBalance || 0) + earnedPoints,
        lifetimePoints: (existing.lifetimePoints || 0) + earnedPoints,
        lifetimeSpent: (existing.lifetimeSpent || 0) + orderTotal,
        annualPoints: (resetAnnual ? 0 : (existing.annualPoints || 0)) + earnedPoints,
        annualSpent: (resetAnnual ? 0 : (existing.annualSpent || 0)) + orderTotal,
        annualYear: year,
        monthlyPoints: (resetMonthly ? 0 : (existing.monthlyPoints || 0)) + earnedPoints,
        monthlySpent: (resetMonthly ? 0 : (existing.monthlySpent || 0)) + orderTotal,
        currentMonth: month,
        updatedAt: now,
      };

      await rewardRef.update(update);

      // Check monthly bonus
      const newMonthlySpent = update.monthlySpent;
      const prevMonthlySpent = resetMonthly ? 0 : (existing.monthlySpent || 0);

      if (prevMonthlySpent < monthlyBonusThreshold && newMonthlySpent >= monthlyBonusThreshold) {
        // Award monthly bonus
        await rewardRef.update({
          pointsBalance: update.pointsBalance + monthlyBonusPoints,
          lifetimePoints: update.lifetimePoints + monthlyBonusPoints,
          annualPoints: update.annualPoints + monthlyBonusPoints,
          monthlyPoints: update.monthlyPoints + monthlyBonusPoints,
        });

        await rewardRef.collection("transactions").add({
          type: "monthly_bonus",
          points: monthlyBonusPoints,
          description: `Monthly spending bonus — spent ₦${Math.round(newMonthlySpent).toLocaleString()} this month`,
          month,
          createdAt: now,
        });
      }
    }

    // Log the earn transaction
    await rewardRef.collection("transactions").add({
      type: "earn",
      points: earnedPoints,
      description: `Earned from order ${orderId} (₦${Math.round(orderTotal).toLocaleString()})${tier.multiplier > 1 ? ` — ${tier.name} ${tier.multiplier}x bonus` : ""}`,
      orderId,
      orderTotal,
      basePoints,
      multiplier: tier.multiplier,
      tier: tier.name,
      createdAt: now,
    });
  } catch (err) {
    // Don't fail the order for rewards errors
    console.error("Award points error:", err);
  }
}

module.exports = router;
module.exports.awardOrderPoints = awardOrderPoints;
