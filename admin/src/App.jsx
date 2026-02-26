// admin/src/App.jsx
import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { onAuthChange, logout, auth } from "./firebase";
import { authAPI } from "./api";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import Users from "./pages/Users";

// ─── Auth context ────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// ─── Toast context ───────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </ToastCtx.Provider>
  );
}

// ─── Sidebar layout ──────────────────────────────────────────────────────────
const NAV = [
  { path: "/orders", label: "Orders", icon: "📦" },
  { path: "/menu", label: "Menu", icon: "🍽" },
  { path: "/events", label: "Events", icon: "📅" },
  { path: "/users", label: "Users", icon: "👥" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

function Layout({ children }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Kutunza</h2>
          <small>Admin Panel</small>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.path}
              className={`sidebar-link${loc.pathname.startsWith(n.path) ? " active" : ""}`}
              onClick={() => nav(n.path)}
            >
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8, wordBreak: "break-all" }}>
            {user?.email}
          </div>
          <button onClick={logout}>Sign Out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        try {
          const res = await authAPI.getProfile();
          if (res?.isAdmin) {
            setUser(u);
            setIsAdmin(true);
          } else {
            // Not an admin — sign out
            await logout();
            setUser(null);
            setIsAdmin(false);
          }
        } catch {
          await logout();
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  if (user === undefined) {
    return <div className="spinner" style={{ marginTop: "40vh" }} />;
  }

  return (
    <AuthCtx.Provider value={{ user, isAdmin }}>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/orders" /> : <Login />} />
          <Route
            path="/*"
            element={
              user ? (
                <Layout>
                  <Routes>
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/orders" />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </ToastProvider>
    </AuthCtx.Provider>
  );
}
