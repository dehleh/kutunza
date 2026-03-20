// admin/src/pages/Menu.jsx
import React, { useState, useEffect, useCallback } from "react";
import { menuAPI } from "../api";
import { useToast } from "../App";

const fmt = (n) => "₦" + Number(n || 0).toLocaleString();

// Default menu — same as mobile/src/data.js so admin can seed Firestore
const DEFAULT_MENU = [
  { id: "rice", label: "Rice", icon: "🍛", items: [
    { id: "r1", name: "Ofada Kutunza & Sauce", price: 5500, desc: "Traditional ofada rice with rich ayamase sauce", active: true },
    { id: "r2", name: "Fried Rice", price: 2000, desc: "Fragrant fried rice with mixed vegetables", active: true },
    { id: "r3", name: "Jollof Rice", price: 2000, desc: "Signature smoky party jollof rice", active: true },
    { id: "r4", name: "Chinese Rice", price: 2000, desc: "Stir-fried rice with Asian-inspired seasonings", active: true },
    { id: "r5", name: "White Rice & Sauce", price: 3000, desc: "Steamed white rice with rich tomato stew", active: true },
    { id: "r6", name: "Native Rice", price: 2500, desc: "Locally prepared native rice with palm oil base", active: true },
    { id: "r7", name: "Coconut Rice", price: 2500, desc: "Rice slow-cooked in fresh coconut milk", active: true },
    { id: "r8", name: "Basmati Specials", price: 4000, desc: "Premium long-grain basmati rice, royally seasoned", active: true },
    { id: "r9", name: "Rice Sticks", price: 2500, desc: "Wok-fried rice noodles in umami broth", active: true },
  ]},
  { id: "soups", label: "Soups", icon: "🍲", items: [
    { id: "s1", name: "Efo-Riro", price: 2000, desc: "Rich Yoruba spinach soup with assorted meat", active: true },
    { id: "s2", name: "Oha Soup", price: 2000, desc: "Delicate oha leaf soup with cocoyam thickener", active: true },
    { id: "s3", name: "Banga", price: 2000, desc: "Palm nut cream soup with spice perfection", active: true },
    { id: "s4", name: "Egusi", price: 2000, desc: "Melon seed soup with bitter leaf, slow-cooked", active: true },
    { id: "s5", name: "Seafood Okro", price: 2000, desc: "Draw soup loaded with fresh seafood", active: true },
    { id: "s6", name: "Ofada Sauce", price: 3000, desc: "Authentic green pepper ayamase sauce", active: true },
    { id: "s7", name: "Stew", price: 2000, desc: "Slow-simmered tomato stew, deeply flavoured", active: true },
    { id: "s8", name: "Omi Obe", price: 1500, desc: "Light peppery soup base", active: true },
    { id: "s9", name: "Afang", price: 2000, desc: "Calabar classic with wild spinach & waterleaf", active: true },
    { id: "s10", name: "Groundnut Soup", price: 3000, desc: "Nutty rich soup with a Northern heritage", active: true },
    { id: "s11", name: "Ogbono", price: 2000, desc: "Silky draw soup with ogbono seeds", active: true },
    { id: "s12", name: "Catfish Pepper Soup", price: 8000, desc: "Hot pepper broth with fresh catfish", active: true },
    { id: "s13", name: "Goat Meat Pepper Soup", price: 8000, desc: "Spiced pepper broth with tender goat meat", active: true },
  ]},
  { id: "swallow", label: "Swallow", icon: "⚪", items: [
    { id: "sw1", name: "Poundo", price: 1000, desc: "Smooth pounded yam flour", active: true },
    { id: "sw2", name: "Garri (Eba)", price: 700, desc: "Classic garri eba, smooth & firm", active: true },
    { id: "sw3", name: "Oat Swallow", price: 1000, desc: "Healthy oat-based swallow", active: true },
    { id: "sw4", name: "Semo", price: 700, desc: "Smooth semolina swallow", active: true },
    { id: "sw5", name: "Amala", price: 1000, desc: "Authentic yam flour amala", active: true },
  ]},
  { id: "protein", label: "Protein", icon: "🥩", items: [
    { id: "p1", name: "Chicken", price: 4000, desc: "Seasoned & grilled/fried to order", active: true },
    { id: "p2", name: "Beef", price: 2000, desc: "Tender slow-cooked beef cuts", active: true },
    { id: "p3", name: "Goat Meat", price: 4000, desc: "Premium goat cuts, well-seasoned", active: true },
    { id: "p4", name: "Ram Meat", price: 4000, desc: "Tender ram portions", active: true },
    { id: "p5", name: "Turkey", price: 8000, desc: "Whole seasoned turkey pieces", active: true },
    { id: "p6", name: "Croaker Fish", price: 3000, desc: "Fresh Atlantic croaker, grilled or fried", active: true },
    { id: "p7", name: "Titus Fish", price: 3000, desc: "Mackerel titus, seasoned & prepared", active: true },
    { id: "p8", name: "Hake Fish", price: 3000, desc: "White hake fillet", active: true },
    { id: "p9", name: "Panla Fish", price: 3000, desc: "Dried stockfish, rehydrated & seasoned", active: true },
    { id: "p10", name: "Herring (Shawa)", price: 1500, desc: "Smoked herring, rich flavour", active: true },
    { id: "p11", name: "Crab", price: 1500, desc: "Fresh crab portions", active: true },
    { id: "p12", name: "Tiger Prawns", price: 1500, desc: "Succulent tiger prawns", active: true },
    { id: "p13", name: "Assorted Meat", price: 3000, desc: "Mixed meat cuts medley", active: true },
    { id: "p14", name: "Gizzard", price: 3000, desc: "Perfectly peppered gizzard", active: true },
    { id: "p15", name: "Catfish", price: 3000, desc: "Fresh catfish, prepared to order", active: true },
  ]},
  { id: "pasta", label: "Pasta", icon: "🍝", items: [
    { id: "pa1", name: "White Pasta & Sauce", price: 5000, desc: "Al dente pasta in rich tomato meat sauce", active: true },
    { id: "pa2", name: "Jollof Pasta", price: 5000, desc: "Pasta cooked jollof-style in spiced tomato base", active: true },
    { id: "pa3", name: "Chinese Pasta", price: 5500, desc: "Stir-fried pasta with Asian-fusion seasonings", active: true },
    { id: "pa4", name: "Macaroni Pasta", price: 5500, desc: "Elbow macaroni in béchamel & tomato sauce", active: true },
    { id: "pa5", name: "French Pasta", price: 5500, desc: "Continental-style pasta with creamy herb sauce", active: true },
  ]},
  { id: "sides", label: "Sides", icon: "🌽", items: [
    { id: "si1", name: "Plantain", price: 500, desc: "Fried sweet plantain (dodo)", active: true },
    { id: "si2", name: "Beans", price: 1000, desc: "Seasoned honey beans", active: true },
    { id: "si3", name: "Coleslaw", price: 1000, desc: "Creamy fresh coleslaw", active: true },
    { id: "si4", name: "Salad", price: 1000, desc: "Garden salad with dressing", active: true },
    { id: "si5", name: "Sweetcorn", price: 500, desc: "Steamed corn kernels", active: true },
    { id: "si6", name: "Stick Meat", price: 2000, desc: "Peppered stick meat skewers", active: true },
    { id: "si7", name: "Stick Gizzard", price: 2000, desc: "Peppered gizzard skewers", active: true },
  ]},
  { id: "fries", label: "Fries & Chips", icon: "🍟", items: [
    { id: "f1", name: "Sweet Potato Chips", price: 2000, desc: "Crispy sweet potato chips", active: true },
    { id: "f2", name: "Irish Potato Chips", price: 2000, desc: "Classic golden fries", active: true },
    { id: "f3", name: "Yam Chips", price: 2000, desc: "Traditional fried yam strips", active: true },
    { id: "f4", name: "Plantain Chips", price: 2000, desc: "Crispy fried plantain chips", active: true },
    { id: "f5", name: "Small Chops", price: 5000, desc: "Mixed platter: puff puff, spring rolls, samosa", active: true },
  ]},
  { id: "general", label: "General", icon: "🍳", items: [
    { id: "g1", name: "Ewa Agoyin & Sauce", price: 3000, desc: "Soft-cooked beans with spiced pepper sauce", active: true },
    { id: "g2", name: "Yam & Egg Sauce", price: 4000, desc: "Boiled yam with peppered egg stew", active: true },
    { id: "g3", name: "Yam & Fish Sauce", price: 4000, desc: "Boiled yam with smoked fish stew", active: true },
    { id: "g4", name: "Yam & Chicken Sauce", price: 4000, desc: "Boiled yam with spiced chicken stew", active: true },
  ]},
];

export default function Menu() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
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

  const handleSeedMenu = async () => {
    if (!confirm("This will populate Firestore with the full default menu (8 categories, 68 items). Continue?")) return;
    setSeeding(true);
    try {
      await menuAPI.seed(DEFAULT_MENU);
      toast("Menu seeded successfully! All items are now editable.");
      fetchMenu();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSeeding(false);
    }
  };

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
        <div>
          <h1>Menu Management</h1>
          <p>Add, edit, and toggle menu items</p>
        </div>
        {categories.length > 0 && (
          <button className="btn btn-gold" onClick={handleSeedMenu} disabled={seeding}>
            {seeding ? "Seeding…" : "Seed Default Menu"}
          </button>
        )}
      </div>

      {/* Seed menu banner — shows when Firestore menu is empty */}
      {!categories.length && (
        <div className="card" style={{ textAlign: "center", padding: 40, marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
          <h3 style={{ marginBottom: 8 }}>Menu is empty</h3>
          <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 13 }}>
            The mobile app is showing a hardcoded default menu that you can't edit here.<br />
            Seed the default menu to Firestore so you can manage all items from this dashboard.
          </p>
          <button className="btn btn-gold" onClick={handleSeedMenu} disabled={seeding}>
            {seeding ? "Seeding…" : "Seed Default Menu (8 categories, 68 items)"}
          </button>
        </div>
      )}

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
                <tr><th style={{ width: 50 }}>Image</th><th>Name</th><th>Description</th><th>Price</th><th>Active</th><th></th></tr>
              </thead>
              <tbody>
                {(currentCat.items || []).map((item) => (
                  <tr key={item.id} style={{ opacity: item.active === false ? 0.5 : 1 }}>
                    <td>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          {currentCat.icon}
                        </div>
                      )}
                    </td>
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
  const [imageUrl, setImageUrl] = useState(initial.imageUrl || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) return toast("Please select an image file", "error");
    if (file.size > 5 * 1024 * 1024) return toast("Image must be under 5 MB", "error");
    setUploading(true);
    try {
      const res = await menuAPI.uploadImage(file);
      setImageUrl(res.url);
      toast("Image uploaded");
    } catch (err) {
      toast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return toast("Name and price required", "error");
    setBusy(true);
    try {
      await onSave({ name, price: Number(price), desc, imageUrl: imageUrl.trim() });
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
        <div className="form-group">
          <label className="form-label">Image</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "var(--gold)" : "var(--border)"}`,
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(184,148,47,0.08)" : "transparent",
              transition: "all .2s",
            }}
            onClick={() => document.getElementById("img-upload").click()}
          >
            <input
              id="img-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); }}
            />
            {uploading ? (
              <span style={{ color: "var(--gold)" }}>Uploading…</span>
            ) : (
              <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
                📷 Click to choose or drag & drop an image
              </span>
            )}
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="…or paste image URL"
              style={{ flex: 1 }}
            />
          </div>
          {imageUrl.trim() && (
            <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
              <img
                src={imageUrl.trim()}
                alt="Preview"
                style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                style={{
                  position: "absolute", top: -6, right: -6,
                  background: "var(--burg)", color: "#fff", border: "none",
                  borderRadius: "50%", width: 20, height: 20, fontSize: 12,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-gold" disabled={busy || uploading}>{busy ? "Saving…" : "Save"}</button>
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
