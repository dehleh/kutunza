// admin/src/pages/Login.jsx
import React, { useState } from "react";
import { loginWithEmail } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Email and password required");
    setError("");
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      // App.jsx auth listener handles the rest
    } catch (err) {
      const msg = err.message?.includes("auth/")
        ? err.message.split("auth/")[1].replace(/[-)]/g, " ").trim()
        : "Invalid credentials";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Kutunza Admin</h1>
        <p className="sub">Sign in with your admin account</p>

        {error && (
          <div style={{ background: "var(--red)", color: "#fff", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@kutunza.com" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
