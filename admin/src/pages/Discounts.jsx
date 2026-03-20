// admin/src/pages/Discounts.jsx
// Admin discount / promo code management

import React, { useState, useEffect, useCallback } from "react";
import { discountAPI } from "../api";
import { useToast } from "../App";

export default function Discounts() {
  const toast = useToast();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  // Create form
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    description: "",
  });

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discountAPI.getAll();
      setDiscounts(res.discounts || []);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      toast("Code and value are required", "error");
      return;
    }
    setBusy(true);
    try {
      await discountAPI.create({
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        minOrder: parseInt(form.minOrder) || 0,
        maxDiscount: parseInt(form.maxDiscount) || 0,
        usageLimit: parseInt(form.usageLimit) || 0,
        expiresAt: form.expiresAt || null,
        description: form.description,
      });
      toast("Discount created");
      setShowCreate(false);
      setForm({ code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", usageLimit: "", expiresAt: "", description: "" });
      fetchDiscounts();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (code, current) => {
    try {
      await discountAPI.toggle(code, !current);
      toast(current ? "Discount deactivated" : "Discount activated");
      setDiscounts(ds => ds.map(d => d.code === code ? { ...d, active: !current } : d));
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Delete discount code "${code}"? This cannot be undone.`)) return;
    try {
      await discountAPI.remove(code);
      toast("Discount deleted");
      setDiscounts(ds => ds.filter(d => d.code !== code));
    } catch (err) {
      toast(err.message, "error");
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>🏷️ Discounts & Promo Codes</h1>
        <p>Create and manage discount codes for customers</p>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Codes</div>
          <div className="stat-value">{discounts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: "var(--green-light, #28a745)" }}>
            {discounts.filter(d => d.active).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Uses</div>
          <div className="stat-value">{discounts.reduce((s, d) => s + (d.usageCount || 0), 0)}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ margin: "20px 0", display: "flex", gap: 12 }}>
        <button className="btn btn-burg" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Discount"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={fetchDiscounts}>↻ Refresh</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Create Discount Code</h3></div>
          <form onSubmit={handleCreate} style={{ padding: 20, maxWidth: 600 }}>
            <div className="form-row">
              <label>Code</label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                maxLength={30}
                required
                style={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}
              />
              <small>3-30 characters, letters, numbers, - and _ only</small>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div className="form-row" style={{ flex: "1 1 200px" }}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>
              <div className="form-row" style={{ flex: "1 1 200px" }}>
                <label>Value {form.type === "percentage" ? "(%)" : "(₦)"}</label>
                <input
                  type="number"
                  min="1"
                  max={form.type === "percentage" ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div className="form-row" style={{ flex: "1 1 200px" }}>
                <label>Min Order (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={form.minOrder}
                  onChange={(e) => set("minOrder", e.target.value)}
                  placeholder="0 = no minimum"
                />
              </div>
              {form.type === "percentage" && (
                <div className="form-row" style={{ flex: "1 1 200px" }}>
                  <label>Max Discount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) => set("maxDiscount", e.target.value)}
                    placeholder="0 = no cap"
                  />
                  <small>Cap the discount amount for percentage codes</small>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div className="form-row" style={{ flex: "1 1 200px" }}>
                <label>Usage Limit</label>
                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => set("usageLimit", e.target.value)}
                  placeholder="0 = unlimited"
                />
              </div>
              <div className="form-row" style={{ flex: "1 1 200px" }}>
                <label>Expires At</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
                />
                <small>Leave empty for no expiration</small>
              </div>
            </div>

            <div className="form-row">
              <label>Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="e.g. Welcome discount for new customers"
                maxLength={200}
              />
            </div>

            <button type="submit" className="btn btn-burg" disabled={busy} style={{ marginTop: 8 }}>
              {busy ? "Creating..." : "Create Discount"}
            </button>
          </form>
        </div>
      )}

      {/* Discounts table */}
      <div className="card">
        <div className="card-header">
          <h3>{discounts.length} discount code{discounts.length !== 1 ? "s" : ""}</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: "center", padding: 20 }}>No discounts yet. Create one above.</td></tr>
              )}
              {discounts.map((d) => {
                const isExpired = d.expiresAt && new Date(d.expiresAt) < new Date();
                const isLimitReached = d.usageLimit > 0 && d.usageCount >= d.usageLimit;
                return (
                  <tr key={d.code} style={{ opacity: (!d.active || isExpired || isLimitReached) ? 0.6 : 1 }}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{d.code}</span>
                      {d.description && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{d.description}</div>}
                    </td>
                    <td>{d.type === "percentage" ? "Percentage" : "Fixed"}</td>
                    <td style={{ fontWeight: 600 }}>
                      {d.type === "percentage" ? `${d.value}%` : `₦${d.value.toLocaleString()}`}
                      {d.type === "percentage" && d.maxDiscount > 0 && (
                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>max ₦{d.maxDiscount.toLocaleString()}</div>
                      )}
                    </td>
                    <td>{d.minOrder > 0 ? `₦${d.minOrder.toLocaleString()}` : "—"}</td>
                    <td>
                      {d.usageCount || 0}{d.usageLimit > 0 ? ` / ${d.usageLimit}` : ""}
                      {isLimitReached && <div style={{ fontSize: 11, color: "#e04848" }}>Exhausted</div>}
                    </td>
                    <td>
                      {d.expiresAt ? (
                        <span style={{ color: isExpired ? "#e04848" : "inherit" }}>
                          {d.expiresAt.slice(0, 10)}
                          {isExpired && <div style={{ fontSize: 11, color: "#e04848" }}>Expired</div>}
                        </span>
                      ) : "Never"}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: d.active ? "#d5f5e320" : "#fde8e820",
                        color: d.active ? "#28a745" : "#e04848",
                        border: `1px solid ${d.active ? "#28a745" : "#e04848"}`,
                      }}>
                        {d.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className={`btn btn-sm ${d.active ? "btn-ghost" : "btn-burg"}`}
                          onClick={() => handleToggle(d.code, d.active)}
                        >
                          {d.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: "#e04848" }}
                          onClick={() => handleDelete(d.code)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
