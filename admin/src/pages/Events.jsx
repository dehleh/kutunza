// admin/src/pages/Events.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { eventAPI, menuAPI } from "../api";
import { useToast } from "../App";

const EVENT_STATUSES = ["pending", "reviewed", "confirmed", "completed", "cancelled"];
const EVENT_TYPES = [
  "Corporate Dinner", "Wedding Reception", "Birthday Celebration",
  "Product Launch", "Private Gathering", "Board Meeting",
  "Anniversary Dinner", "Baby Shower / Naming Ceremony",
  "Graduation Party", "Festival & Cultural Event",
];

const fmt = (n) => "₦" + Number(n).toLocaleString();

export default function Events() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  // ─── New booking modal state ────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", eventType: "", date: "", guests: "", location: "", budget: "", notes: "" });
  const [selectedItems, setSelectedItems] = useState({});
  const [menuCat, setMenuCat] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch menu for create form
  useEffect(() => {
    if (!showCreate) return;
    (async () => {
      try {
        const res = await menuAPI.getAll();
        const cats = res.categories || res.menu || res;
        if (Array.isArray(cats) && cats.length) {
          setMenu(cats);
          setMenuCat(cats[0].id);
        }
      } catch { /* menu will be empty */ }
    })();
  }, [showCreate]);

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

  // ─── Create form helpers ────────────────────────────────────────────────
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filteredItems = useMemo(() => {
    const cat = menu.find((c) => c.id === menuCat);
    if (!cat) return [];
    let items = (cat.items || []).filter((i) => i.active !== false);
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items.map((i) => ({ ...i, category: cat.label, categoryId: cat.id }));
  }, [menu, menuCat, menuSearch]);

  const selectedList = useMemo(() => Object.values(selectedItems), [selectedItems]);
  const menuTotal = useMemo(() => selectedList.reduce((s, i) => s + i.price * i.qty, 0), [selectedList]);

  const setQty = (item, delta) => {
    setSelectedItems((prev) => {
      const key = item.id || item.itemId;
      const existing = prev[key];
      const newQty = (existing?.qty || 0) + delta;
      if (newQty <= 0) { const copy = { ...prev }; delete copy[key]; return copy; }
      return { ...prev, [key]: { itemId: key, name: item.name, category: item.category, price: item.price, qty: newQty } };
    });
  };

  const handleSuggestMenu = async () => {
    const b = parseInt(form.budget, 10);
    const g = parseInt(form.guests, 10);
    if (!b || b < 1000) { toast("Enter a budget of at least ₦1,000", "error"); return; }
    if (!g || g < 1) { toast("Enter guest count first", "error"); return; }
    setSuggesting(true);
    try {
      const res = await eventAPI.suggestMenu({ budget: b, guests: g });
      const items = res.menuItems || [];
      const map = {};
      items.forEach((it) => { map[it.itemId] = { itemId: it.itemId, name: it.name, category: it.category, price: it.price, qty: it.qty }; });
      setSelectedItems(map);
      toast(`${items.length} items suggested within ${fmt(b)} budget`);
    } catch (err) {
      toast(err.message || "Suggestion failed", "error");
    } finally {
      setSuggesting(false);
    }
  };

  const handleCreate = async () => {
    const { name, email, phone, eventType, date, guests, location } = form;
    if (!name || !email || !phone || !eventType || !date || !guests || !location) {
      toast("Fill all required fields", "error"); return;
    }
    if (!selectedList.length) { toast("Select at least one menu item", "error"); return; }
    setSubmitting(true);
    try {
      await eventAPI.create({
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        eventType, date: date.trim(), guests: parseInt(guests, 10) || 0,
        location: location.trim(), budget: parseInt(form.budget, 10) || 0,
        menuItems: selectedList, notes: form.notes.trim(),
      });
      toast("Event booking created!");
      setShowCreate(false);
      resetCreateForm();
      fetchEvents();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setForm({ name: "", email: "", phone: "", eventType: "", date: "", guests: "", location: "", budget: "", notes: "" });
    setSelectedItems({});
    setMenuSearch("");
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Event Bookings</h1>
          <p>Review and manage catering event requests</p>
        </div>
        <button className="btn btn-burg" onClick={() => setShowCreate(true)}>+ New Booking</button>
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
                  <th>Menu Items</th>
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
                    <td>{(ev.menuItems || []).length || "—"}</td>
                    <td><span className={`badge ${ev.status}`}>{ev.status}</span></td>
                    <td><button className="btn btn-burg btn-sm" onClick={() => setDetail(ev)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Detail modal ──────────────────────────────────────────────── */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>Event {detail.eventId}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: "var(--text-dim)" }}>Name:</span> {detail.name}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Email:</span> {detail.email}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Phone:</span> {detail.phone}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Type:</span> {detail.eventType}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Date:</span> {detail.date} {detail.time || ""}</div>
              <div><span style={{ color: "var(--text-dim)" }}>Guests:</span> {detail.guests}</div>
              <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Location:</span> {detail.location}</div>
              {detail.budget ? <div><span style={{ color: "var(--text-dim)" }}>Budget:</span> {fmt(detail.budget)}</div> : null}
              {detail.notes && <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--text-dim)" }}>Notes:</span> {detail.notes}</div>}
            </div>

            {/* Menu items table */}
            {detail.menuItems && detail.menuItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">Menu Items</div>
                <table style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Item</th>
                      <th style={{ textAlign: "left" }}>Category</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Price</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.menuItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.name}</td>
                        <td style={{ color: "var(--text-dim)" }}>{it.category}</td>
                        <td style={{ textAlign: "right" }}>{it.qty}</td>
                        <td style={{ textAlign: "right" }}>{fmt(it.price)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(it.price * it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1px solid rgba(114,47,55,.3)" }}>
                      <td colSpan="4" style={{ fontWeight: 600, paddingTop: 8 }}>Total</td>
                      <td style={{ textAlign: "right", fontWeight: 700, paddingTop: 8, color: "var(--burg)" }}>{fmt(detail.menuTotal || detail.menuItems.reduce((s, i) => s + i.price * i.qty, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

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

      {/* ─── Create booking modal ──────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}>
            <h3>New Event Booking</h3>

            {/* Contact */}
            <div className="form-label">Contact Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <input className="input" placeholder="Full name *" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              <input className="input" placeholder="Email *" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              <input className="input" placeholder="Phone *" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            </div>

            {/* Event info */}
            <div className="form-label">Event Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <select className="input" value={form.eventType} onChange={(e) => setField("eventType", e.target.value)}>
                <option value="">Select event type *</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="input" type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
              <input className="input" placeholder="Number of guests *" type="number" value={form.guests} onChange={(e) => setField("guests", e.target.value)} />
              <input className="input" placeholder="Location *" value={form.location} onChange={(e) => setField("location", e.target.value)} />
            </div>

            {/* Budget + Suggest */}
            <div className="form-label">Budget & Menu Suggestion</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              <input className="input" style={{ flex: 1 }} placeholder="Budget (e.g. 500000)" type="number" value={form.budget} onChange={(e) => setField("budget", e.target.value)} />
              <button className="btn btn-burg btn-sm" disabled={!form.budget || suggesting} onClick={handleSuggestMenu}>
                {suggesting ? "Suggesting…" : "✨ Suggest Menu"}
              </button>
            </div>

            {/* Selected items summary */}
            {selectedList.length > 0 && (
              <div style={{ background: "rgba(107,32,55,.06)", border: "1px solid rgba(107,32,55,.2)", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  <span>{selectedList.length} item{selectedList.length > 1 ? "s" : ""} selected</span>
                  <span style={{ color: "var(--burg)" }}>{fmt(menuTotal)}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedList.map((it) => (
                    <span key={it.itemId} style={{ background: "var(--bg2)", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                      {it.qty}× {it.name}
                      <button onClick={() => setQty(it, -it.qty)} style={{ marginLeft: 4, cursor: "pointer", color: "var(--text-dim)", background: "none", border: "none", fontSize: 11 }}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Menu browser */}
            <div className="form-label">Select Menu Items</div>
            <input className="input" placeholder="Search menu items…" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} style={{ marginBottom: 8, width: "100%" }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {menu.map((cat) => (
                <button key={cat.id} className={`filter-pill${menuCat === cat.id ? " active" : ""}`} onClick={() => setMenuCat(cat.id)}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 14 }}>
              {filteredItems.map((item) => {
                const sel = selectedItems[item.id];
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{fmt(item.price)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {sel ? (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setQty(item, -1)} style={{ minWidth: 28, padding: "2px 6px" }}>−</button>
                          <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}>{sel.qty}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setQty(item, 1)} style={{ minWidth: 28, padding: "2px 6px" }}>+</button>
                        </>
                      ) : (
                        <button className="btn btn-burg btn-sm" onClick={() => setQty(item, 1)}>+ Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!filteredItems.length && <div style={{ padding: 16, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>No items in this category</div>}
            </div>

            {/* Notes */}
            <div className="form-label">Additional Notes</div>
            <textarea className="input" rows={2} placeholder="Dietary needs, special requests…" value={form.notes} onChange={(e) => setField("notes", e.target.value)} style={{ width: "100%", resize: "vertical" }} />

            <div className="modal-actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => { setShowCreate(false); resetCreateForm(); }}>Cancel</button>
              <button className="btn btn-burg" disabled={submitting} onClick={handleCreate}>
                {submitting ? "Submitting…" : "Create Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
