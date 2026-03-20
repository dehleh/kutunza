// mobile/src/screens/Checkout.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { C, S, fmt } from "../theme";
import { useAuth } from "../context/Auth";
import { useCart } from "../context/Cart";
import { orderAPI, paymentAPI, settingsAPI, discountAPI } from "../api";

export default function CheckoutScreen({ route, navigation }) {
  const deliveryFee = route.params?.deliveryFee || 1500;
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();

  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("delivery"); // delivery | pickup
  const [busy, setBusy] = useState(false);
  const [payUrl, setPayUrl] = useState(null); // Paystack WebView URL
  const [done, setDone] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null); // { discountAmount, code, type, value, description }
  const [discountError, setDiscountError] = useState("");
  const [validating, setValidating] = useState(false);

  const orderRef = useRef(null);
  const payTimerRef = useRef(null);
  const discountAmount = discountInfo?.discountAmount || 0;
  const total = subtotal + (mode === "delivery" ? deliveryFee : 0) - discountAmount;

  // Fetch WhatsApp settings
  useEffect(() => {
    settingsAPI.get().then((res) => {
      const s = res.settings || res;
      if (s.whatsappEnabled && s.whatsappNumber) {
        setWhatsappEnabled(true);
        setWhatsappNumber(s.whatsappNumber);
      }
    }).catch(() => {});
  }, []);

  // M12 — Payment WebView timeout (5 minutes)
  useEffect(() => {
    if (payUrl) {
      payTimerRef.current = setTimeout(() => {
        setPayUrl(null);
        Alert.alert("Payment timeout", "Payment took too long. Please try again from your orders.");
      }, 5 * 60 * 1000);
    }
    return () => { if (payTimerRef.current) clearTimeout(payTimerRef.current); };
  }, [payUrl]);

  // ─── Apply discount code ──────────────────────────────────────────────────
  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) return;
    setDiscountError("");
    setDiscountInfo(null);
    setValidating(true);
    try {
      const res = await discountAPI.validate(code, subtotal);
      setDiscountInfo(res);
    } catch (err) {
      setDiscountError(err.message || "Invalid code");
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountInfo(null);
    setDiscountError("");
  };

  // ─── Place order & init payment ────────────────────────────────────────────
  const handlePay = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Name and phone are required.");
      return;
    }
    if (mode === "delivery" && !address.trim()) {
      Alert.alert("Missing info", "Delivery address is required.");
      return;
    }

    setBusy(true);
    try {
      // Map cart to backend's expected format: { id, name, qty, finalPrice, bowlSize }
      const cartItems = cart.map((c) => ({
        id: c.id,
        name: c.name,
        qty: c.qty,
        finalPrice: c.price * (c.bowlMultiplier || 1),
        bowlSize: c.bowlSize
          ? { label: c.bowlLabel || c.bowlSize }
          : null,
        categoryId: c.categoryId,
      }));

      // 1. Place order (fields match backend/routes/orders.js)
      const order = await orderAPI.place({
        cart: cartItems,
        name: name.trim(),
        phone: phone.trim(),
        address: mode === "delivery" ? address.trim() : "",
        deliveryType: mode,
        note: notes.trim(),
        discountCode: discountInfo?.code || null,
      });

      orderRef.current = order.orderId || order.id;

      // 2. Initialise Paystack
      const pay = await paymentAPI.initialize({
        orderId: orderRef.current,
        email: user.email,
        amount: total,
      });

      if (pay?.authorizationUrl) {
        setPayUrl(pay.authorizationUrl);
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Could not process order");
    } finally {
      setBusy(false);
    }
  };

  // ─── WebView navigation callback ──────────────────────────────────────────
  const handleWebViewNav = async (navState) => {
    const url = navState.url || "";
    // Paystack redirects to callback URL with ?reference=xxx
    if (url.includes("reference=") || url.includes("trxref=")) {
      setPayUrl(null);
      setBusy(true);
      try {
        const ref = new URL(url).searchParams.get("reference") ||
                    new URL(url).searchParams.get("trxref");
        if (ref) await paymentAPI.verify(ref);
        clearCart();
        setDone(true);
      } catch {
        Alert.alert("Verification failed", "Please check your orders for status.");
        clearCart();
        setDone(true);
      } finally {
        setBusy(false);
      }
    }
  };

  // ─── WhatsApp order ────────────────────────────────────────────────────────
  const handleWhatsApp = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Name and phone are required.");
      return;
    }
    if (mode === "delivery" && !address.trim()) {
      Alert.alert("Missing info", "Delivery address is required.");
      return;
    }

    setBusy(true);
    try {
      const cartItems = cart.map((c) => ({
        id: c.id,
        name: c.name,
        qty: c.qty,
        finalPrice: c.price * (c.bowlMultiplier || 1),
        bowlSize: c.bowlSize ? { label: c.bowlLabel || c.bowlSize } : null,
        categoryId: c.categoryId,
      }));

      // Create order in backend with WhatsApp payment method
      const order = await orderAPI.place({
        cart: cartItems,
        name: name.trim(),
        phone: phone.trim(),
        address: mode === "delivery" ? address.trim() : "",
        deliveryType: mode,
        note: notes.trim(),
        paymentMethod: "whatsapp",
        discountCode: discountInfo?.code || null,
      });

      const oid = order.orderId || order.id;

      // Build WhatsApp message
      const itemLines = cart.map((c) => {
        const lbl = c.bowlLabel ? ` (${c.bowlLabel})` : "";
        const lineTotal = c.price * (c.bowlMultiplier || 1) * c.qty;
        return `• ${c.name}${lbl} ×${c.qty} — ${fmt(lineTotal)}`;
      }).join("\n");

      const msg = [
        `🛒 *New Order from Kutunza*`,
        `Order: *${oid}*`,
        ``,
        `*Items:*`,
        itemLines,
        ``,
        `Subtotal: ${fmt(subtotal)}`,
        mode === "delivery" ? `Delivery: ${fmt(deliveryFee)}` : `Pickup (no delivery fee)`,
        `*Total: ${fmt(total)}*`,
        ``,
        `*Customer:* ${name.trim()}`,
        `*Phone:* ${phone.trim()}`,
        mode === "delivery" ? `*Address:* ${address.trim()}` : `*Pickup order*`,
        notes.trim() ? `*Notes:* ${notes.trim()}` : "",
        ``,
        `💳 Please share your account details so I can make the transfer.`,
      ].filter(Boolean).join("\n");

      // Clean WhatsApp number: remove spaces, dashes, leading +
      const cleanNum = whatsappNumber.replace(/[\s\-+]/g, "");
      const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;

      const supported = await Linking.canOpenURL(waUrl);
      if (supported) {
        await Linking.openURL(waUrl);
      } else {
        Alert.alert("WhatsApp not available", "Please install WhatsApp to use this option.");
      }

      clearCart();
      setDone(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not process order");
    } finally {
      setBusy(false);
    }
  };

  // ─── Done state ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={[S.screen, { alignItems: "center", justifyContent: "center", padding: 30 }]}>
        <Ionicons name="checkmark-circle" size={72} color={C.greenLight} />
        <Text style={st.doneTitle}>Order Placed!</Text>
        <Text style={st.doneDesc}>
          You'll receive account details on WhatsApp to complete payment. Your order will be prepared once payment is confirmed.
        </Text>
        <TouchableOpacity
          style={[S.btnGold, { marginTop: 24, width: "100%" }]}
          onPress={() => navigation.getParent()?.navigate("Orders")}
        >
          <Text style={S.btnGoldText}>View Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Paystack WebView ──────────────────────────────────────────────────────
  if (payUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <TouchableOpacity
          style={st.cancelPay}
          onPress={() => {
            setPayUrl(null);
            Alert.alert("Payment cancelled", "You can retry from your orders.");
          }}
        >
          <Ionicons name="close" size={20} color={C.cream} />
          <Text style={{ color: C.cream, marginLeft: 6 }}>Cancel</Text>
        </TouchableOpacity>
        <WebView
          source={{ uri: payUrl }}
          onNavigationStateChange={handleWebViewNav}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator color={C.burg} size="large" style={StyleSheet.absoluteFill} />
          )}
        />
      </View>
    );
  }

  // ─── Checkout form ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={S.screen}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mode toggle */}
        <View style={[S.row, { marginBottom: 16, gap: 10 }]}>
          {["delivery", "pickup"].map((m) => (
            <TouchableOpacity
              key={m}
              style={[st.modeBtn, mode === m && st.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[st.modeText, mode === m && st.modeTextActive]}>
                {m === "delivery" ? "Delivery" : "Pickup"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        <Text style={S.label}>Full Name</Text>
        <TextInput style={S.input} value={name} onChangeText={setName} placeholderTextColor={C.textDim} placeholder="Your name" />

        <Text style={[S.label, { marginTop: 14 }]}>Phone</Text>
        <TextInput style={S.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={C.textDim} placeholder="e.g. 08012345678" />

        {mode === "delivery" && (
          <>
            <Text style={[S.label, { marginTop: 14 }]}>Delivery Address</Text>
            <TextInput
              style={[S.input, { minHeight: 60, textAlignVertical: "top" }]}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholderTextColor={C.textDim}
              placeholder="Street, area, landmark"
            />
          </>
        )}

        <Text style={[S.label, { marginTop: 14 }]}>Notes (optional)</Text>
        <TextInput
          style={[S.input, { minHeight: 50, textAlignVertical: "top" }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor={C.textDim}
          placeholder="Special requests…"
        />

        {/* Order summary */}
        <View style={st.summaryCard}>
          <Text style={S.sectionTitle}>Order Summary</Text>
          {cart.map((c) => {
            const key = c.bowlSize ? `${c.id}_${c.bowlSize}` : c.id;
            const lineTotal = c.price * (c.bowlMultiplier || 1) * c.qty;
            return (
              <View key={key} style={[S.rowBetween, { marginTop: 6 }]}>
                <Text style={st.sumItem} numberOfLines={1}>
                  {c.name} {c.bowlLabel ? `(${c.bowlLabel})` : ""} ×{c.qty}
                </Text>
                <Text style={st.sumPrice}>{fmt(lineTotal)}</Text>
              </View>
            );
          })}
          <View style={[S.divider, { marginVertical: 10 }]} />
          <View style={S.rowBetween}>
            <Text style={st.sumItem}>Subtotal</Text>
            <Text style={st.sumPrice}>{fmt(subtotal)}</Text>
          </View>
          {mode === "delivery" && (
            <View style={[S.rowBetween, { marginTop: 4 }]}>
              <Text style={st.sumItem}>Delivery</Text>
              <Text style={st.sumPrice}>{fmt(deliveryFee)}</Text>
            </View>
          )}
          {discountAmount > 0 && (
            <View style={[S.rowBetween, { marginTop: 4 }]}>
              <Text style={[st.sumItem, { color: C.greenLight }]}>Discount ({discountInfo?.code})</Text>
              <Text style={{ color: C.greenLight, fontSize: 13, fontWeight: "600" }}>-{fmt(discountAmount)}</Text>
            </View>
          )}
          <View style={[S.rowBetween, { marginTop: 8 }]}>
            <Text style={[st.sumItem, { color: C.cream, fontWeight: "700" }]}>Total</Text>
            <Text style={{ color: C.burg, fontSize: 17, fontWeight: "700" }}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Discount code */}
        <View style={st.discountSection}>
          <Text style={[S.label, { marginBottom: 6 }]}>Discount Code</Text>
          {discountInfo ? (
            <View style={st.discountApplied}>
              <View style={{ flex: 1 }}>
                <Text style={st.discountAppliedCode}>{discountInfo.code}</Text>
                <Text style={st.discountAppliedDesc}>
                  {discountInfo.type === "percentage" ? `${discountInfo.value}% off` : `₦${discountInfo.value.toLocaleString()} off`}
                  {" — "}{fmt(discountAmount)} saved
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveDiscount}>
                <Ionicons name="close-circle" size={22} color={C.redLight} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TextInput
                style={[S.input, { flex: 1, textTransform: "uppercase" }]}
                value={discountCode}
                onChangeText={(t) => { setDiscountCode(t.toUpperCase()); setDiscountError(""); }}
                placeholder="Enter code"
                placeholderTextColor={C.textDim}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[S.btnBurg, { paddingHorizontal: 16, paddingVertical: 12, opacity: validating ? 0.6 : 1 }]}
                onPress={handleApplyDiscount}
                disabled={validating || !discountCode.trim()}
              >
                {validating ? (
                  <ActivityIndicator color={C.burg} size="small" />
                ) : (
                  <Text style={S.btnBurgText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {discountError ? <Text style={st.discountErr}>{discountError}</Text> : null}
        </View>

        {/* Pay button */}
        <TouchableOpacity
          style={[S.btnGold, { marginTop: 20, opacity: busy ? 0.6 : 1 }]}
          onPress={handlePay}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <Text style={S.btnGoldText}>Pay {fmt(total)}</Text>
          )}
        </TouchableOpacity>

        {/* WhatsApp order button */}
        {whatsappEnabled && (
          <TouchableOpacity
            style={[st.whatsappBtn, { marginTop: 12 }]}
            onPress={handleWhatsApp}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={st.whatsappBtnText}>Order via WhatsApp</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: C.burg, borderColor: C.burg },
  modeText: { color: C.textDim, fontWeight: "600", fontSize: 13 },
  modeTextActive: { color: "#fff" },
  summaryCard: {
    backgroundColor: C.bg2,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  sumItem: { color: C.textDim, fontSize: 13, flex: 1 },
  sumPrice: { color: C.cream, fontSize: 13, fontWeight: "600" },
  cancelPay: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: C.bg2,
  },
  doneTitle: { color: C.cream, fontSize: 22, fontWeight: "700", marginTop: 16 },
  doneDesc: { color: C.textDim, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  whatsappBtn: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  discountSection: {
    marginTop: 16,
  },
  discountApplied: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.green,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  discountAppliedCode: {
    color: C.greenLight,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
  discountAppliedDesc: {
    color: C.greenLight,
    fontSize: 12,
    marginTop: 2,
  },
  discountErr: {
    color: C.redLight,
    fontSize: 12,
    marginTop: 6,
  },
});
