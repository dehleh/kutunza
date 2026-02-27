// mobile/src/screens/OrderDetail.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, fmt } from "../theme";
import { orderAPI } from "../api";

const STATUS_META = {
  pending:          { color: C.gold,       icon: "time-outline",             label: "Pending" },
  confirmed:        { color: C.greenLight, icon: "checkmark-circle-outline", label: "Confirmed" },
  preparing:        { color: C.gold,       icon: "flame-outline",            label: "Preparing" },
  out_for_delivery: { color: "#4a9aff",    icon: "bicycle-outline",          label: "Out for delivery" },
  delivered:        { color: C.greenLight, icon: "checkmark-done-outline",   label: "Delivered" },
  cancelled:        { color: C.redLight,   icon: "close-circle-outline",     label: "Cancelled" },
};

export default function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params;
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const canCancel = order.status === "pending";

  const handleCancel = () => {
    Alert.alert("Cancel order?", "This cannot be undone.", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await orderAPI.cancelOrder(order.orderId, "Customer cancelled");
            navigation.goBack();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const formatDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw._seconds ? raw._seconds * 1000 : raw);
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScrollView style={S.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* ─── Status banner ──────────────────────────────────────────── */}
      <View style={[st.statusBanner, { borderColor: meta.color + "60" }]}>
        <Ionicons name={meta.icon} size={32} color={meta.color} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={[st.statusLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={st.orderId}>#{(order.orderId || "").slice(-8).toUpperCase()}</Text>
        </View>
        <Text style={st.totalBig}>{fmt(order.total || 0)}</Text>
      </View>

      {/* ─── Customer & delivery info ───────────────────────────────── */}
      <View style={S.card}>
        <Text style={st.sectionHead}>Delivery Info</Text>
        <InfoRow icon="person-outline" label="Name" value={order.customer?.name || order.name || "—"} />
        <InfoRow icon="call-outline" label="Phone" value={order.customer?.phone || order.phone || "—"} />
        <InfoRow icon="car-outline" label="Type" value={(order.deliveryType || "delivery").replace("_", " ")} />
        {order.address ? <InfoRow icon="location-outline" label="Address" value={order.address} /> : null}
        {order.note ? <InfoRow icon="chatbubble-outline" label="Note" value={order.note} /> : null}
        <InfoRow icon="calendar-outline" label="Placed" value={formatDate(order.createdAt)} />
      </View>

      {/* ─── Payment ────────────────────────────────────────────────── */}
      <View style={[S.card, { marginTop: 12 }]}>
        <Text style={st.sectionHead}>Payment</Text>
        <InfoRow icon="card-outline" label="Status" value={(order.paymentStatus || "pending").toUpperCase()} valueColor={order.paymentStatus === "paid" ? C.greenLight : C.gold} />
        {order.paystackReference ? <InfoRow icon="link-outline" label="Ref" value={order.paystackReference} /> : null}
        {order.paidAt ? <InfoRow icon="time-outline" label="Paid at" value={formatDate(order.paidAt)} /> : null}
      </View>

      {/* ─── Items ──────────────────────────────────────────────────── */}
      <View style={[S.card, { marginTop: 12 }]}>
        <Text style={st.sectionHead}>Items</Text>
        {(order.cart || []).map((item, i) => {
          const lineTotal = item.lineTotal || item.finalPrice * item.qty || item.price * (item.bowlMultiplier || 1) * item.qty;
          return (
            <View key={i} style={st.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.itemName}>
                  {item.name}
                  {item.bowlSize?.label ? ` (${item.bowlSize.label})` : ""}
                </Text>
                <Text style={st.itemQty}>Qty: {item.qty}</Text>
              </View>
              <Text style={st.itemPrice}>{fmt(lineTotal)}</Text>
            </View>
          );
        })}
        <View style={S.divider} />
        <View style={S.rowBetween}>
          <Text style={st.sumLabel}>Subtotal</Text>
          <Text style={st.sumValue}>{fmt(order.subtotal || 0)}</Text>
        </View>
        {(order.deliveryFee || 0) > 0 && (
          <View style={[S.rowBetween, { marginTop: 4 }]}>
            <Text style={st.sumLabel}>Delivery</Text>
            <Text style={st.sumValue}>{fmt(order.deliveryFee)}</Text>
          </View>
        )}
        <View style={[S.rowBetween, { marginTop: 8 }]}>
          <Text style={[st.sumLabel, { color: C.cream, fontWeight: "700" }]}>Total</Text>
          <Text style={{ color: C.burg, fontSize: 17, fontWeight: "700" }}>{fmt(order.total || 0)}</Text>
        </View>
      </View>

      {/* ─── Timeline ───────────────────────────────────────────────── */}
      {order.timeline?.length > 0 && (
        <View style={[S.card, { marginTop: 12 }]}>
          <Text style={st.sectionHead}>Timeline</Text>
          {order.timeline.map((t, i) => {
            const tMeta = STATUS_META[t.status] || STATUS_META.pending;
            const isLast = i === order.timeline.length - 1;
            return (
              <View key={i} style={st.timelineRow}>
                {/* vertical line + dot */}
                <View style={st.timelineTrack}>
                  <View style={[st.timelineDot, { backgroundColor: tMeta.color }]} />
                  {!isLast && <View style={st.timelineLine} />}
                </View>
                <View style={st.timelineContent}>
                  <Text style={[st.timelineStatus, { color: tMeta.color }]}>
                    {tMeta.label}
                  </Text>
                  <Text style={st.timelineTime}>
                    {t.timestamp ? formatDate(t.timestamp) : ""}
                  </Text>
                  {t.note ? <Text style={st.timelineNote}>{t.note}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ─── Cancel button ──────────────────────────────────────────── */}
      {canCancel && (
        <TouchableOpacity
          style={[S.btnGhost, { marginTop: 16, borderColor: C.redLight + "60" }]}
          onPress={handleCancel}
        >
          <Text style={[S.btnGhostText, { color: C.redLight }]}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <View style={st.infoRow}>
      <Ionicons name={icon} size={16} color={C.textDim} style={{ marginRight: 10 }} />
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={[st.infoValue, valueColor && { color: valueColor }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg2,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusLabel: { fontSize: 16, fontWeight: "700" },
  orderId: { color: C.textDim, fontSize: 11, fontWeight: "600", marginTop: 2 },
  totalBig: { color: C.burg, fontSize: 20, fontWeight: "700" },
  sectionHead: { color: C.cream, fontSize: 14, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoLabel: { color: C.textDim, fontSize: 12, width: 70 },
  infoValue: { color: C.cream, fontSize: 13, flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  itemName: { color: C.cream, fontSize: 13, fontWeight: "600" },
  itemQty: { color: C.textDim, fontSize: 11, marginTop: 2 },
  itemPrice: { color: C.burg, fontSize: 13, fontWeight: "600", marginLeft: 12 },
  sumLabel: { color: C.textDim, fontSize: 13 },
  sumValue: { color: C.cream, fontSize: 13, fontWeight: "600" },
  timelineRow: { flexDirection: "row", minHeight: 52 },
  timelineTrack: { width: 24, alignItems: "center" },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  timelineStatus: { fontSize: 13, fontWeight: "600" },
  timelineTime: { color: C.textDim, fontSize: 11, marginTop: 2 },
  timelineNote: { color: C.text, fontSize: 11, marginTop: 4, fontStyle: "italic" },
});
