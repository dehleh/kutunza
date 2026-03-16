// admin/src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { settingsAPI } from "../api";
import { useToast } from "../App";

export default function Settings() {
  const toast = useToast();
  const [form, setForm] = useState({
    businessName: "Kutunza Gourmet",
    phone1: "",
    phone2: "",
    website: "",
    address: "",
    deliveryAreas: "",
    deliveryFee: 1500,
    minOrderAmount: 0,
    operatingHours: "",
    socialLinks: { instagram: "", twitter: "", facebook: "" },
    whatsappNumber: "",
    whatsappEnabled: false,
    bankAccountDetails: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const s = res.settings || res;
      setForm({
        businessName: s.businessName ?? "Kutunza Gourmet",
        phone1: s.phone1 ?? "",
        phone2: s.phone2 ?? "",
        website: s.website ?? "",
        address: s.address ?? "",
        deliveryAreas: s.deliveryAreas ?? "",
        deliveryFee: s.deliveryFee ?? 1500,
        minOrderAmount: s.minOrderAmount ?? s.minOrder ?? 0,
        operatingHours: s.operatingHours ?? "",
        socialLinks: {
          instagram: s.socialLinks?.instagram ?? "",
          twitter: s.socialLinks?.twitter ?? "",
          facebook: s.socialLinks?.facebook ?? "",
        },
        whatsappNumber: s.whatsappNumber ?? "",
        whatsappEnabled: s.whatsappEnabled ?? false,
        bankAccountDetails: s.bankAccountDetails ?? "",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSocial = (key, value) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await settingsAPI.update({
        ...form,
        deliveryFee: Number(form.deliveryFee),
        minOrderAmount: Number(form.minOrderAmount),
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

      <form onSubmit={handleSave}>
        {/* Business Info */}
        <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Business Info</h3>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input className="form-input" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone 1</label>
            <input className="form-input" value={form.phone1} onChange={(e) => set("phone1", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone 2</label>
            <input className="form-input" value={form.phone2} onChange={(e) => set("phone2", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="form-input" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>

        {/* Delivery & Orders */}
        <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Delivery & Orders</h3>
          <div className="form-group">
            <label className="form-label">Delivery Fee (₦)</label>
            <input className="form-input" type="number" value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Order Amount (₦)</label>
            <input className="form-input" type="number" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Areas</label>
            <textarea className="form-input" rows={3} value={form.deliveryAreas} onChange={(e) => set("deliveryAreas", e.target.value)} placeholder="e.g. Lekki, Victoria Island, Ikoyi" />
          </div>
          <div className="form-group">
            <label className="form-label">Operating Hours</label>
            <input className="form-input" value={form.operatingHours} onChange={(e) => set("operatingHours", e.target.value)} placeholder="e.g. Mon–Sat 9am–9pm" />
          </div>
        </div>

        {/* WhatsApp Ordering */}
        <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>WhatsApp Ordering</h3>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.whatsappEnabled}
                onChange={(e) => set("whatsappEnabled", e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Enable WhatsApp ordering
            </label>
            <small style={{ color: "#8E8E9A", display: "block", marginTop: 4 }}>
              When enabled, customers can place orders via WhatsApp. You'll share account details for bank transfer, then confirm payment before preparing the order.
            </small>
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp Number</label>
            <input
              className="form-input"
              value={form.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="e.g. 2348012345678 (with country code, no +)"
            />
            <small style={{ color: "#8E8E9A", display: "block", marginTop: 4 }}>
              International format without + or spaces. Orders will be sent to this number.
            </small>
          </div>
          <div className="form-group">
            <label className="form-label">Bank Account Details</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.bankAccountDetails}
              onChange={(e) => set("bankAccountDetails", e.target.value)}
              placeholder="e.g. Bank Name: GTBank&#10;Account Number: 0123456789&#10;Account Name: Kutunza Foods"
            />
            <small style={{ color: "#8E8E9A", display: "block", marginTop: 4 }}>
              These details will be shared with customers on WhatsApp for bank transfers.
            </small>
          </div>
        </div>

        {/* Social Links */}
        <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Social Links</h3>
          <div className="form-group">
            <label className="form-label">Instagram</label>
            <input className="form-input" value={form.socialLinks.instagram} onChange={(e) => setSocial("instagram", e.target.value)} placeholder="@handle or URL" />
          </div>
          <div className="form-group">
            <label className="form-label">Twitter</label>
            <input className="form-input" value={form.socialLinks.twitter} onChange={(e) => setSocial("twitter", e.target.value)} placeholder="@handle or URL" />
          </div>
          <div className="form-group">
            <label className="form-label">Facebook</label>
            <input className="form-input" value={form.socialLinks.facebook} onChange={(e) => setSocial("facebook", e.target.value)} placeholder="Page URL" />
          </div>
        </div>

        <button className="btn btn-gold" type="submit" disabled={busy} style={{ marginBottom: 32 }}>
          {busy ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
