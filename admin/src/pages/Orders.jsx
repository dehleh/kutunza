// admin/src/pages/Orders.jsx
import React, { useState, useEffect, useCallback } from "react";
import { orderAPI } from "../api";
import { useToast } from "../App";

const STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
const fmt = (n) => "₦" + Number(n || 0).toLocaleString();

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAll(filter || undefined);
      setOrders(res.orders || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast(`Order updated to ${newStatus}`);
      fetchOrders();
      setDetail(null);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleCleanup = async () => {
    try {
      const res = await orderAPI.cleanup();
      toast(`Expired ${res.expired || 0} abandoned orders`);
      fetchOrders();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <p>Manage customer orders and track fulfillment</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value cream">{stats.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Preparing</div>
          <div className="stat-value">{stats.preparing || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value green">{stats.delivered || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value green">{fmt(stats.totalRevenue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button className={`filter-pill${!filter ? " active" : ""}`} onClick={() => setFilter("")}>All</button>
        {STATUSES.map((s) => (
          <button key={s} className={`filter-pill${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={handleCleanup} style={{ marginLeft: "auto" }}>
          🧹 Clean Expired
        </button>
        <button className="btn btn-ghost btn-sm" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : !orders.length ? (
        <div className="empty-state"><div className="icon">📦</div><p>No orders found</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{o.orderId?.slice(-8)}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{o.customer?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{o.customer?.phone}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{(o.cart || []).length} items</td>
                    <td style={{ fontWeight: 600, color: "var(--gold)" }}>{fmt(o.total)}</td>
                    <td><span className={`badge ${o.status}`}>{o.status?.replace(/_/g, " ")}</span></td>
                    <td><span className={`badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                    <td style={{ fontSize: 11, color: "var(--text-dim)" }}>{o.createdAt?.slice(0, 10)}</td>
                    <td>
                      <button className="btn btn-burg btn-sm" onClick={() => setDetail(o)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>Order {detail.orderId}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: "var(--text-dim)" }}>Customer:</span> {detail.customer?.name}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Phone:</span> {detail.customer?.phone}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Type:</span> {detail.deliveryType}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Payment:</span> <span className={`badge ${detail.paymentStatus}`}>{detail.paymentStatus}</span></div>
              {detail.address && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Address:</span> {detail.address}</div>}
              {detail.note && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Note:</span> {detail.note}</div>}
            </div>

            {/* Items table */}
            <table style={{ marginBottom: 12 }}>
              <thead><tr><th>Item</th><th>Bowl</th><th>Qty</th><th>Line Total</th></tr></thead>
              <tbody>
                {(detail.cart || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td style={{ fontSize: 11 }}>{item.bowlSize || "—"}</td>
                    <td>{item.qty}</td>
                    <td style={{ color: "var(--gold)" }}>{fmt(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: "right", fontSize: 13, marginBottom: 4 }}>
              Subtotal: {fmt(detail.subtotal)} &nbsp;|&nbsp; Delivery: {fmt(detail.deliveryFee)}
            </div>
            <div style={{ textAlign: "right", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>
              Total: {fmt(detail.total)}
            </div>

            {/* Status update */}
            <div style={{ marginTop: 16, borderTop: "1px solid rgba(114,47,55,.3)", paddingTop: 16 }}>
              <div className="form-label">Update Status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.filter((s) => s !== detail.status).map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${s === "cancelled" ? "btn-red" : s === "delivered" ? "btn-green" : "btn-burg"}`}
                    onClick={() => handleStatus(detail.orderId, s)}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {detail.timeline?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label">Timeline</div>
                {detail.timeline.map((t, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--text)", marginBottom: 4 }}>
                    <span className={`badge ${t.status}`}>{t.status}</span>
                    <span style={{ marginLeft: 8, color: "var(--text-dim)" }}>{t.timestamp?.slice(0, 16).replace("T", " ")}</span>
                    {t.note && <span style={{ marginLeft: 8 }}>{t.note}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
