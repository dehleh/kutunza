// admin/src/pages/Events.jsx
import React, { useState, useEffect, useCallback } from "react";
import { eventAPI } from "../api";
import { useToast } from "../App";

const EVENT_STATUSES = ["pending", "reviewed", "confirmed", "completed", "cancelled"];

export default function Events() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventAPI.getAll(filter || undefined);
      setEvents(res.events || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleStatus = async (eventId, status) => {
    try {
      await eventAPI.updateStatus(eventId, status);
      toast(`Event updated to ${status}`);
      fetchEvents();
      setDetail(null);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Event Bookings</h1>
        <p>Review and manage catering event requests</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value cream">{stats.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value green">{stats.confirmed || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value green">{stats.completed || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button className={`filter-pill${!filter ? " active" : ""}`} onClick={() => setFilter("")}>All</button>
        {EVENT_STATUSES.map((s) => (
          <button key={s} className={`filter-pill${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={fetchEvents} style={{ marginLeft: "auto" }}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : !events.length ? (
        <div className="empty-state"><div className="icon">📅</div><p>No event bookings found</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Contact</th>
                  <th>Event Type</th>
                  <th>Date</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.eventId}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{ev.eventId}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{ev.phone}</div>
                    </td>
                    <td>{ev.eventType}</td>
                    <td>{ev.date}</td>
                    <td>{ev.guests}</td>
                    <td><span className={`badge ${ev.status}`}>{ev.status}</span></td>
                    <td><button className="btn btn-burg btn-sm" onClick={() => setDetail(ev)}>View</button></td>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3>Event {detail.eventId}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: "var(--text-dim)" }}>Name:</span> {detail.name}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Email:</span> {detail.email}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Phone:</span> {detail.phone}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Type:</span> {detail.eventType}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Date:</span> {detail.date} {detail.time || ""}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Guests:</span> {detail.guests}</div>
              <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Location:</span> {detail.location}</div>
              {detail.budget && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Budget:</span> {detail.budget}</div>}
              {detail.theme && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Theme:</span> {detail.theme}</div>}
              {detail.menu && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Menu Notes:</span> {detail.menu}</div>}
              {detail.notes && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Notes:</span> {detail.notes}</div>}
            </div>

            <div style={{ borderTop: "1px solid rgba(114,47,55,.3)", paddingTop: 12 }}>
              <div className="form-label">Update Status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EVENT_STATUSES.filter((s) => s !== detail.status).map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${s === "cancelled" ? "btn-red" : s === "completed" || s === "confirmed" ? "btn-green" : "btn-burg"}`}
                    onClick={() => handleStatus(detail.eventId, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
