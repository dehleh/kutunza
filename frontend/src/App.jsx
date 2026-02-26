// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { onAuthChange, logout } from "./firebase";
import { authAPI, menuAPI } from "./api";
import {
  C, S, LOGO, BOWL_SIZES, BOWL_ELIGIBLE, DEFAULT_MENU,
  DELIVERY_FEE, fmt, newId,
} from "./constants";
import { useToast } from "./components/Toast";
import AuthModal from "./components/AuthModal";
import OrderHistory from "./components/OrderHistory";
import BowlPicker from "./components/BowlPicker";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import EventBooking from "./components/EventBooking";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [activeCat, setActiveCat] = useState("rice");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      setUser(fbUser);
      setAuthLoading(false);
      if (fbUser) {
        try {
          const { isAdmin: admin } = await authAPI.getProfile();
          setIsAdminUser(!!admin);
        } catch { setIsAdminUser(false); }
        try {
          const { menu: liveMenu, seeded } = await menuAPI.getMenu();
          if (seeded && liveMenu.length > 0) setMenu(liveMenu);
        } catch { /* use DEFAULT_MENU */ }
      } else {
        setIsAdminUser(false);
      }
    });
    return unsub;
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const currentCat = menu.find(c => c.id === activeCat);
  const displayItems = search.trim()
    ? menu.flatMap(c => c.items.filter(i => i.active && (i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase()))))
    : (currentCat?.items || []).filter(i => i.active);

  const addToCart = (item, bowlSize) => {
    const finalPrice = bowlSize ? Math.round(item.price * bowlSize.multiplier) : item.price;
    const key = `${item.id}_${bowlSize?.id || "single"}`;
    setCart(prev => {
      const exists = prev.find(i => i.key === key);
      if (exists) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, bowlSize, finalPrice, cartId: `${key}_${Date.now()}`, key, qty: 1 }];
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
    toast.show(`${item.name} added`, "success");
  };

  const handleCheckoutStart = () => {
    if (!user) { setShowCart(false); setShowAuth(true); return; }
    setShowCart(false);
    setShowCheckout(true);
  };

  /* ── Loading screen ─────────────────────────────────────────── */
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <img src={LOGO} alt="Kutunza" style={{ height: 56, marginBottom: 16, opacity: 0.85 }} />
        <div style={{ color: C.textDim, fontSize: 14 }}>Loading…</div>
      </div>
    </div>
  );

  /* ── Admin ──────────────────────────────────────────────────── */
  if (isAdmin) return <AdminDashboard menu={menu} setMenu={setMenu} onExit={() => setIsAdmin(false)} toast={toast} />;

  /* ── Main app ───────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Lora', serif", color: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lora:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,textarea,select{color-scheme:dark}
        input::placeholder,textarea::placeholder{color:${C.textDim}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.burg}40}
        .card{transition:transform 0.15s,border-color 0.15s}.card:hover{transform:translateY(-2px)}
      `}</style>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${C.burg}30`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: `${C.bg}f0`, zIndex: 300,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO} alt="Kutunza" style={{ height: 42, width: 42, objectFit: "contain", borderRadius: 4 }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.cream }}>
            Kutunza <span style={{ color: C.goldLight, fontStyle: "italic" }}>Gourmet</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowEvent(true)} style={{ ...S.btn("ghost"), padding: "7px 12px", fontSize: 11 }}>Events</button>
          {user ? (
            <>
              <button onClick={() => setShowHistory(true)} style={{ ...S.btn("ghost"), padding: "7px 12px", fontSize: 11 }}>Orders</button>
              {isAdminUser && (
                <button onClick={() => setIsAdmin(true)} style={{
                  background: C.bg3, border: `1px solid ${C.burg}40`, borderRadius: "50%",
                  width: 32, height: 32, cursor: "pointer", fontSize: 12, color: C.goldLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "A"}
                </button>
              )}
              <button onClick={() => logout()} style={{ ...S.btn("ghost"), padding: "7px 10px", fontSize: 11, color: C.textDim }}>Sign Out</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ ...S.btn("burg"), padding: "7px 14px", fontSize: 11 }}>Sign In</button>
          )}
          <button onClick={() => setShowCart(true)} style={{
            ...S.btn("burg"), padding: "7px 14px", fontSize: 12,
            display: "flex", alignItems: "center", gap: 5, position: "relative",
          }}>
            Cart{cartCount > 0 && (
              <span style={{
                background: C.goldLight, color: C.bg, borderRadius: "50%",
                width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800,
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ─── Hero (compact) ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.burgDeep}, ${C.burg}cc)`,
        padding: "32px 20px", textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(22px, 5vw, 36px)",
          fontStyle: "italic", color: C.cream, lineHeight: 1.25, marginBottom: 8,
        }}>
          Nigerian Cuisine, <span style={{ color: C.goldLight }}>Elevated</span>
        </h1>
        <p style={{ color: C.text, fontSize: 13, maxWidth: 400, margin: "0 auto 18px", lineHeight: 1.6 }}>
          Fresh meals for delivery or pickup — single portions to 20L bowls.
        </p>
        <button
          onClick={() => document.querySelector("#menu-section")?.scrollIntoView({ behavior: "smooth" })}
          style={{ ...S.btn("gold"), padding: "10px 28px" }}
        >
          Order Now
        </button>
      </div>

      {/* ─── Search ─────────────────────────────────────────────── */}
      <div style={{ padding: "14px 20px", background: C.bg2 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <input
            style={{ ...S.input, paddingLeft: 14, borderRadius: 24, background: C.bg3 }}
            placeholder="Search menu…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─── Category tabs ──────────────────────────────────────── */}
      {!search && (
        <div style={{ padding: "0 20px", background: C.bg2, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 6, paddingBottom: 12, minWidth: "max-content", maxWidth: 900, margin: "0 auto" }}>
            {menu.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                style={{
                  padding: "7px 14px", borderRadius: 20,
                  border: `1px solid ${activeCat === cat.id ? C.goldLight + "40" : C.burg + "25"}`,
                  background: activeCat === cat.id ? C.burg : "transparent",
                  color: activeCat === cat.id ? C.goldLight : C.textDim,
                  fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontWeight: 500,
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Menu grid ──────────────────────────────────────────── */}
      <main id="menu-section" style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        {search && displayItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.textDim }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
            <div style={{ fontSize: 14 }}>No dishes found for "{search}"</div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {displayItems.map(item => {
            const inCartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.qty, 0);
            const catId = search ? menu.find(c => c.items.find(i => i.id === item.id))?.id : activeCat;
            return (
              <div
                key={item.id}
                className="card"
                style={{
                  background: C.bg2, border: `1px solid ${inCartQty > 0 ? C.goldLight + "30" : C.burg + "20"}`,
                  borderRadius: 10, padding: "16px", display: "flex", flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 600, color: C.cream, lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
                    {item.name}
                  </h3>
                  {inCartQty > 0 && (
                    <span style={{
                      background: C.goldLight, color: C.bg, borderRadius: "50%",
                      width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, flexShrink: 0,
                    }}>{inCartQty}</span>
                  )}
                </div>
                <p style={{ color: C.textDim, fontSize: 12, lineHeight: 1.5, flex: 1, marginBottom: 12 }}>{item.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.goldLight, fontWeight: 700 }}>{fmt(item.price)}</span>
                  <BowlPicker item={item} catId={catId} onAdd={addToCart} />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.burg}20`, padding: "18px 20px", textAlign: "center" }}>
        <div style={{ color: C.textDim, fontSize: 12 }}>
          Kutunza Gourmet · Lagos, Nigeria ·{" "}
          <span style={{ color: C.goldLight, cursor: "pointer" }} onClick={() => setShowEvent(true)}>Book an Event</span>
        </div>
      </footer>

      {/* ─── Floating cart FAB ──────────────────────────────────── */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          style={{
            position: "fixed", bottom: 20, right: 20, padding: "12px 20px",
            background: C.burg, border: `1px solid ${C.goldLight}60`, borderRadius: 28,
            color: C.goldLight, cursor: "pointer", fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 8, zIndex: 400,
          }}
        >
          Cart · {cartCount} · {fmt(cart.reduce((s, i) => s + i.finalPrice * i.qty, 0))}
        </button>
      )}

      {/* ─── Modals / Overlays ──────────────────────────────────── */}
      {toast.ToastEl}
      {showCart && (
        <CartDrawer
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={(id) => setCart(p => p.filter(i => i.cartId !== id))}
          onQty={(id, d) => setCart(p => p.map(i => i.cartId === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0))}
          onCheckout={handleCheckoutStart}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          cart={cart} user={user}
          onClose={() => setShowCheckout(false)}
          onSuccess={(oid) => { setCart([]); toast.show(`Order ${oid} confirmed!`, "success"); }}
          toast={toast}
        />
      )}
      {showEvent && <EventBooking onClose={() => setShowEvent(false)} toast={toast} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => toast.show("Welcome to Kutunza!", "success")} />}
      {showHistory && <OrderHistory onClose={() => setShowHistory(false)} />}
    </div>
  );
}
