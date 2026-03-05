// admin/src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { settingsAPI } from "../api";
import { useToast } from "../App";

export default function Settings() {
  const toast = useToast();
  const [deliveryFee, setDeliveryFee] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const s = res.settings || res;
      setDeliveryFee(s.deliveryFee ?? 1500);
      setMinOrder(s.minOrderAmount ?? s.minOrder ?? 2000);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await settingsAPI.update({
        deliveryFee: Number(deliveryFee),
        minOrderAmount: Number(minOrder),
      });
      toast("Settings saved");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>App-wide configuration</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Delivery Fee (₦)</label>
            <input
              className="form-input"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Order Amount (₦)</label>
            <input
              className="form-input"
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              min={0}
            />
          </div>
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
