// mobile/src/screens/Cart.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, fmt } from "../theme";
import { DELIVERY_FEE_DEFAULT } from "../data";
import { settingsAPI } from "../api";
import { useCart } from "../context/Cart";
import { useAuth } from "../context/Auth";

export default function CartScreen({ navigation }) {
  const { cart, subtotal, updateQty, removeFromCart, cartCount } = useCart();
  const { user } = useAuth();
  const [deliveryFee, setDeliveryFee] = useState(DELIVERY_FEE_DEFAULT);

  useEffect(() => {
    settingsAPI.get().then((r) => {
      if (r?.deliveryFee) setDeliveryFee(r.deliveryFee);
    }).catch(() => {});
  }, []);

  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to place an order.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Profile", { screen: "Auth" }) },
      ]);
      return;
    }
    navigation.navigate("Checkout", { deliveryFee });
  };

  // ─── Cart item row ─────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const linePrice = item.price * (item.bowlMultiplier || 1) * item.qty;
    return (
      <View style={st.row}>
        <View style={st.info}>
          <Text style={st.itemName} numberOfLines={1}>{item.name}</Text>
          {item.bowlLabel && (
            <Text style={st.bowl}>{item.bowlLabel}</Text>
          )}
          <Text style={st.linePrice}>{fmt(linePrice)}</Text>
        </View>

        <View style={st.qtyRow}>
          <TouchableOpacity
            onPress={() => updateQty(item.id, item.bowlSize, item.qty - 1)}
            style={st.qtyBtn}
          >
            <Ionicons name="remove" size={16} color={C.cream} />
          </TouchableOpacity>
          <Text style={st.qtyText}>{item.qty}</Text>
          <TouchableOpacity
            onPress={() => updateQty(item.id, item.bowlSize, item.qty + 1)}
            style={st.qtyBtn}
          >
            <Ionicons name="add" size={16} color={C.cream} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => removeFromCart(item.id, item.bowlSize)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={C.redLight} />
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (!cart.length) {
    return (
      <View style={S.screen}>
        <View style={S.empty}>
          <Text style={S.emptyIcon}>🛒</Text>
          <Text style={S.emptyText}>Your cart is empty</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={S.screen}>
      <FlatList
        data={cart}
        keyExtractor={(c) => (c.bowlSize ? `${c.id}_${c.bowlSize}` : c.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10 }}
        ItemSeparatorComponent={() => <View style={S.divider} />}
      />

      {/* Summary */}
      <View style={st.summary}>
        <View style={S.rowBetween}>
          <Text style={st.sumLabel}>Subtotal ({cartCount} items)</Text>
          <Text style={st.sumValue}>{fmt(subtotal)}</Text>
        </View>
        <View style={S.rowBetween}>
          <Text style={st.sumLabel}>Delivery</Text>
          <Text style={st.sumValue}>{fmt(deliveryFee)}</Text>
        </View>
        <View style={[S.divider, { marginVertical: 8 }]} />
        <View style={S.rowBetween}>
          <Text style={[st.sumLabel, { color: C.cream, fontWeight: "700" }]}>
            Total
          </Text>
          <Text style={[st.sumValue, { color: C.gold, fontSize: 18 }]}>
            {fmt(total)}
          </Text>
        </View>

        <TouchableOpacity style={S.btnGold} onPress={handleCheckout} activeOpacity={0.8}>
          <Text style={S.btnGoldText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  info: { flex: 1 },
  itemName: { color: C.cream, fontSize: 14, fontWeight: "600" },
  bowl: { color: C.textDim, fontSize: 11, marginTop: 2 },
  linePrice: { color: C.gold, fontSize: 13, fontWeight: "600", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.burg,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { color: C.cream, fontSize: 14, fontWeight: "700", minWidth: 20, textAlign: "center" },
  summary: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.burg + "40",
    backgroundColor: C.bg2,
  },
  sumLabel: { color: C.textDim, fontSize: 13 },
  sumValue: { color: C.cream, fontSize: 14, fontWeight: "600" },
});
