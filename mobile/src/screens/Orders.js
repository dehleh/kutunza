// mobile/src/screens/Orders.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { C, S, fmt } from "../theme";
import { orderAPI } from "../api";
import { useAuth } from "../context/Auth";

const STATUS_COLORS = {
  pending: C.gold,
  confirmed: C.greenLight,
  preparing: C.gold,
  ready: C.greenLight,
  delivered: C.greenLight,
  cancelled: C.redLight,
};

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res?.orders || res || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [fetchOrders])
  );

  const handleCancel = (id) => {
    Alert.alert("Cancel order?", "This cannot be undone.", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await orderAPI.cancelOrder(id, "Customer cancelled");
            fetchOrders();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  // ─── Not signed in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={S.screen}>
        <View style={S.empty}>
          <Ionicons name="lock-closed-outline" size={48} color={C.textDim} />
          <Text style={[S.emptyText, { marginTop: 10 }]}>
            Sign in to view your orders
          </Text>
          <TouchableOpacity
            style={[S.btnBurg, { marginTop: 16 }]}
            onPress={() => navigation.getParent()?.navigate("Profile", { screen: "Auth" })}
          >
            <Text style={S.btnBurgText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={S.screen}>
        <ActivityIndicator color={C.burg} size="large" style={{ marginTop: 40 }} />
      </View>
    );
  }

  // ─── Order card ────────────────────────────────────────────────────────────
  const renderOrder = ({ item: o }) => {
    const date = o.createdAt
      ? new Date(o.createdAt._seconds ? o.createdAt._seconds * 1000 : o.createdAt).toLocaleDateString()
      : "";
    const statusColor = STATUS_COLORS[o.status] || C.textDim;
    const canCancel = o.status === "pending";

    return (
      <View style={st.card}>
        <View style={S.rowBetween}>
          <Text style={st.orderId}>#{(o.orderId || "").slice(-6).toUpperCase()}</Text>
          <View style={[st.statusBadge, { borderColor: statusColor }]}>
            <Text style={[st.statusText, { color: statusColor }]}>
              {(o.status || "").toUpperCase()}
            </Text>
          </View>
        </View>

        {date ? <Text style={st.date}>{date}</Text> : null}

        {(o.cart || []).slice(0, 3).map((item, idx) => (
          <Text key={idx} style={st.itemLine} numberOfLines={1}>
            {item.name} {item.bowlSize ? `(${item.bowlSize})` : ""} ×{item.qty}
          </Text>
        ))}
        {(o.cart || []).length > 3 && (
          <Text style={st.itemLine}>+{o.cart.length - 3} more…</Text>
        )}

        <View style={[S.rowBetween, { marginTop: 10 }]}>
          <Text style={st.total}>{fmt(o.total || 0)}</Text>
          <TouchableOpacity
            style={st.viewBtn}
            onPress={() => navigation.navigate("OrderDetail", { order: o })}
          >
            <Text style={st.viewBtnText}>View</Text>
            <Ionicons name="chevron-forward" size={14} color={C.burg} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={S.screen}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.orderId || o.id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            tintColor={C.burg}
            colors={[C.burg]}
          />
        }
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={S.emptyIcon}>📦</Text>
            <Text style={S.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: C.bg2,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  orderId: { color: C.textDim, fontSize: 11, fontWeight: "600" },
  date: { color: C.textDim, fontSize: 11, marginTop: 2, marginBottom: 8 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  itemLine: { color: C.text, fontSize: 12, marginTop: 3 },
  total: { color: C.burg, fontSize: 16, fontWeight: "700" },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewBtnText: { color: C.burg, fontSize: 12, fontWeight: "600" },
});
