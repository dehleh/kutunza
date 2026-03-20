// admin/src/pages/Rewards.jsx
// Admin rewards management — overview, member list, config, point adjustments

import React, { useState, useEffect, useCallback } from "react";
import { rewardsAPI } from "../api";
import { useToast } from "../App";

const TIER_COLORS = { Bronze: "#CD7F32", Silver: "#C0C0C0", Gold: "#FFD700", Platinum: "#E5E4E2" };

export default function Rewards() {
  const toast = useToast();
  const [tab, setTab] = useState("overview"); // overview | config
  const [overview, setOverview] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Adjust modal
  const [adjustModal, setAdjustModal] = useState(null); // { uid, name }
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, cfgRes] = await Promise.all([
        rewardsAPI.getOverview(),
        rewardsAPI.getConfig(),
      ]);
      setOverview(ovRes.overview);
      setConfig(cfgRes.config);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    try {
      await rewardsAPI.updateConfig(config);
      toast("Rewards config saved");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleAdjust = async () => {
    const pts = parseInt(adjustPoints);
    if (!pts || !adjustReason.trim()) {
      toast("Enter valid points and reason", "error");
      return;
    }
    setAdjusting(true);
    try {
      await rewardsAPI.adjustPoints(adjustModal.uid, pts, adjustReason.trim());
      toast(`Adjusted ${pts > 0 ? "+" : ""}${pts} points for ${adjustModal.name}`);
      setAdjustModal(null);
      setAdjustPoints("");
      setAdjustReason("");
      fetchData();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>🎁 Rewards & Loyalty</h1>
        <p>Manage the customer loyalty program — monthly & annual tiers</p>
      </div>

      {/* Tab switcher */}
      <div className="filter-row" style={{ marginBottom: 20 }}>
        <button className={`pill${tab === "overview" ? " active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`pill${tab === "config" ? " active" : ""}`} onClick={() => setTab("config")}>Configuration</button>
      </div>

      {tab === "overview" && overview && (
        <>
          {/* Stats cards */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Members</div>
              <div className="stat-value">{overview.totalMembers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Points Issued</div>
              <div className="stat-value">{overview.totalPointsIssued.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Points In Circulation</div>
              <div className="stat-value">{overview.totalPointsBalance.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Points Redeemed</div>
              <div className="stat-value">{overview.totalRedeemed.toLocaleString()}</div>
            </div>
          </div>

          {/* Tier distribution */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><h3>Tier Distribution</h3></div>
            <div style={{ display: "flex", gap: 16, padding: 16, flexWrap: "wrap" }}>
              {Object.entries(overview.tierCounts).map(([tier, count]) => (
                <div key={tier} style={{
                  flex: "1 1 120px",
                  textAlign: "center",
                  padding: 16,
                  borderRadius: 12,
                  border: `2px solid ${TIER_COLORS[tier]}`,
                  background: `${TIER_COLORS[tier]}10`,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: TIER_COLORS[tier] }}>{count}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{tier}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top members */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h3>Top Members ({overview.currentYear})</h3>
              <button className="btn btn-ghost btn-sm" onClick={fetchData}>↻ Refresh</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Tier</th>
                    <th>Balance</th>
                    <th>Annual Pts</th>
                    <th>Lifetime Pts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.topMembers.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: "center", padding: 20 }}>No members yet</td></tr>
                  )}
                  {overview.topMembers.map((m) => (
                    <tr key={m.uid}>
                      <td>{m.name || "—"}</td>
                      <td>
                        <span className="badge" style={{ background: `${TIER_COLORS[m.tier]}20`, color: TIER_COLORS[m.tier], border: `1px solid ${TIER_COLORS[m.tier]}` }}>
                          {m.tier}
                        </span>
                      </td>
                      <td>{m.pointsBalance.toLocaleString()}</td>
                      <td>{m.annualPoints.toLocaleString()}</td>
                      <td>{m.lifetimePoints.toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAdjustModal({ uid: m.uid, name: m.name })}
                        >
                          Adjust Points
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "config" && config && (
        <div className="card">
          <div className="card-header"><h3>Rewards Configuration</h3></div>
          <div style={{ padding: 20, maxWidth: 600 }}>
            {/* Enable/disable */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={config.enabled !== false}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                />
                <span style={{ fontWeight: 600 }}>Rewards system enabled</span>
              </label>
            </div>

            <h4 style={{ marginBottom: 12, color: "var(--cream)" }}>Points Earning</h4>
            <div className="form-row">
              <label>Points per ₦100 spent</label>
              <input
                type="number"
                min="1"
                value={config.pointsPerHundredNaira || 1}
                onChange={(e) => setConfig({ ...config, pointsPerHundredNaira: parseInt(e.target.value) || 1 })}
              />
              <small>How many points customers earn per ₦100 on delivered orders</small>
            </div>

            <h4 style={{ margin: "24px 0 12px", color: "var(--cream)" }}>Points Redemption</h4>
            <div className="form-row">
              <label>Redemption rate (₦ per point)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={config.redemptionRate || 1}
                onChange={(e) => setConfig({ ...config, redemptionRate: parseFloat(e.target.value) || 1 })}
              />
              <small>How much each point is worth in Naira when redeemed</small>
            </div>
            <div className="form-row">
              <label>Minimum points to redeem</label>
              <input
                type="number"
                min="10"
                value={config.minRedeemPoints || 100}
                onChange={(e) => setConfig({ ...config, minRedeemPoints: parseInt(e.target.value) || 100 })}
              />
            </div>

            <h4 style={{ margin: "24px 0 12px", color: "var(--cream)" }}>Monthly Bonus</h4>
            <div className="form-row">
              <label>Monthly spending threshold (₦)</label>
              <input
                type="number"
                min="0"
                value={config.monthlyBonusThreshold || 10000}
                onChange={(e) => setConfig({ ...config, monthlyBonusThreshold: parseInt(e.target.value) || 10000 })}
              />
              <small>Customers who spend this much in a month get bonus points</small>
            </div>
            <div className="form-row">
              <label>Monthly bonus points</label>
              <input
                type="number"
                min="0"
                value={config.monthlyBonusPoints || 50}
                onChange={(e) => setConfig({ ...config, monthlyBonusPoints: parseInt(e.target.value) || 50 })}
              />
              <small>Bonus points awarded when monthly threshold is reached</small>
            </div>

            <h4 style={{ margin: "24px 0 12px", color: "var(--cream)" }}>Annual Tiers</h4>
            <div style={{
              background: "var(--bg2)",
              borderRadius: 10,
              padding: 16,
              border: "1px solid var(--border)",
              marginBottom: 20,
            }}>
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Tier</th>
                    <th style={{ textAlign: "right" }}>Min Annual Points</th>
                    <th style={{ textAlign: "right" }}>Points Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Bronze", min: 0, mult: "1x" },
                    { name: "Silver", min: "5,000", mult: "1.5x" },
                    { name: "Gold", min: "15,000", mult: "2x" },
                    { name: "Platinum", min: "50,000", mult: "3x" },
                  ].map(t => (
                    <tr key={t.name}>
                      <td><span style={{ color: TIER_COLORS[t.name], fontWeight: 600 }}>{t.name}</span></td>
                      <td style={{ textAlign: "right" }}>{t.min}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{t.mult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <small style={{ color: "var(--text-dim)", display: "block", marginTop: 8 }}>
                Tiers reset annually. Higher tiers earn points faster via the multiplier.
              </small>
            </div>

            <button className="btn btn-burg" onClick={handleSaveConfig} style={{ marginTop: 8 }}>
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Adjust points modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Adjust Points — {adjustModal.name}</h3>
              <button className="close-btn" onClick={() => setAdjustModal(null)}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="form-row">
                <label>Points (positive to add, negative to deduct)</label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  placeholder="e.g. 100 or -50"
                />
              </div>
              <div className="form-row">
                <label>Reason (required)</label>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation for delayed order"
                />
              </div>
              <button
                className="btn btn-burg"
                onClick={handleAdjust}
                disabled={adjusting}
                style={{ width: "100%", marginTop: 12 }}
              >
                {adjusting ? "Processing..." : "Adjust Points"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
