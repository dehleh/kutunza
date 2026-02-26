// admin/src/pages/Menu.jsx
import React, { useState, useEffect, useCallback } from "react";
import { menuAPI } from "../api";
import { useToast } from "../App";

const fmt = (n) => "₦" + Number(n || 0).toLocaleString();

export default function Menu() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [editItem, setEditItem] = useState(null);  // { catId, item } for edit modal
  const [newItem, setNewItem] = useState(null);     // catId for new item modal
  const [newCat, setNewCat] = useState(false);      // show new category modal

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await menuAPI.getAll();
      setCategories(res.menu || []);
      if (!activeCat && res.menu?.length) setActiveCat(res.menu[0].id);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const currentCat = categories.find((c) => c.id === activeCat);

  // ─── Toggle item active ────────────────────────────────────────────────────
  const handleToggle = async (catId, itemId) => {
    try {
      await menuAPI.toggleItem(catId, itemId);
      toast("Item toggled");
      fetchMenu();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  // ─── Delete item ───────────────────────────────────────────────────────────
  const handleDeleteItem = async (catId, itemId) => {
    if (!confirm("Delete this item?")) return;
    try {
      await menuAPI.deleteItem(catId, itemId);
      toast("Item deleted");
      fetchMenu();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  // ─── Delete category ──────────────────────────────────────────────────────
  const handleDeleteCat = async (catId) => {
    if (!confirm("Delete this entire category and all its items?")) return;
    try {
      await menuAPI.deleteCategory(catId);
      toast("Category deleted");
      setActiveCat(null);
      fetchMenu();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>Menu Management</h1>
        <p>Add, edit, and toggle menu items</p>
      </div>

      {/* Category pills */}
      <div className="filter-bar">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`filter-pill${activeCat === c.id ? " active" : ""}`}
            onClick={() => setActiveCat(c.id)}
          >
            {c.icon} {c.label} ({(c.items || []).length})
          </button>
        ))}
        <button className="btn btn-gold btn-sm" onClick={() => setNewCat(true)} style={{ marginLeft: "auto" }}>
          + Category
        </button>
      </div>

      {/* Items table */}
      {currentCat ? (
        <div className="card">
          <div className="card-header">
            <h3>{currentCat.icon} {currentCat.label}</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-gold btn-sm" onClick={() => setNewItem(currentCat.id)}>+ Add Item</button>
              <button className="btn btn-red btn-sm" onClick={() => handleDeleteCat(currentCat.id)}>Delete Category</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Description</th><th>Price</th><th>Active</th><th></th></tr>
              </thead>
              <tbody>
                {(currentCat.items || []).map((item) => (
                  <tr key={item.id} style={{ opacity: item.active === false ? 0.5 : 1 }}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ fontSize: 12, color: "var(--text-dim)", maxWidth: 260 }}>{item.desc}</td>
                    <td style={{ color: "var(--gold)", fontWeight: 600 }}>{fmt(item.price)}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${item.active !== false ? "btn-green" : "btn-ghost"}`}
                        onClick={() => handleToggle(currentCat.id, item.id)}
                      >
                        {item.active !== false ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-burg btn-sm" onClick={() => setEditItem({ catId: currentCat.id, item })}>Edit</button>
                        <button className="btn btn-red btn-sm" onClick={() => handleDeleteItem(currentCat.id, item.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!(currentCat.items || []).length && (
            <div className="empty-state"><p>No items in this category yet</p></div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">🍽</div>
          <p>Select a category or create one</p>
          {!categories.length && (
            <p style={{ fontSize: 12, marginTop: 8, color: "var(--text-dim)" }}>
              Your menu is empty. Use the mobile app's default menu or add categories here.
            </p>
          )}
        </div>
      )}

      {/* ─── Edit item modal ─────────────────────────────────────────── */}
      {editItem && (
        <ItemModal
          title="Edit Item"
          initial={editItem.item}
          onClose={() => setEditItem(null)}
          onSave={async (data) => {
            await menuAPI.editItem(editItem.catId, editItem.item.id, data);
            toast("Item updated");
            setEditItem(null);
            fetchMenu();
          }}
          toast={toast}
        />
      )}

      {/* ─── New item modal ──────────────────────────────────────────── */}
      {newItem && (
        <ItemModal
          title="Add Item"
          initial={{ name: "", price: "", desc: "" }}
          onClose={() => setNewItem(null)}
          onSave={async (data) => {
            await menuAPI.addItem(newItem, data);
            toast("Item added");
            setNewItem(null);
            fetchMenu();
          }}
          toast={toast}
        />
      )}

      {/* ─── New category modal ──────────────────────────────────────── */}
      {newCat && (
        <CategoryModal
          onClose={() => setNewCat(false)}
          onSave={async (data) => {
            await menuAPI.addCategory(data);
            toast("Category created");
            setNewCat(false);
            fetchMenu();
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─── Item modal component ─────────────────────────────────────────────────────
function ItemModal({ title, initial, onClose, onSave, toast }) {
  const [name, setName] = useState(initial.name || "");
  const [price, setPrice] = useState(initial.price || "");
  const [desc, setDesc] = useState(initial.desc || "");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return toast("Name and price required", "error");
    setBusy(true);
    try {
      await onSave({ name, price: Number(price), desc });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{title}</h3>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Price (₦)</label>
          <input className="form-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}

// ─── Category modal component ─────────────────────────────────────────────────
function CategoryModal({ onClose, onSave, toast }) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("🍽");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label) return toast("Category name required", "error");
    setBusy(true);
    try {
      await onSave({ label, icon });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>New Category</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Label</label>
            <input className="form-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Drinks" autoFocus />
          </div>
          <div className="form-group" style={{ maxWidth: 80 }}>
            <label className="form-label">Icon</label>
            <input className="form-input" value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? "Creating…" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
