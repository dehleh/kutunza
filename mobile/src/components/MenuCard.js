// mobile/src/components/MenuCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fmt } from "../theme";

export default function MenuCard({ item, onAdd, inCartQty }) {
  return (
    <View style={s.card}>
      <View style={s.body}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <Text style={s.desc} numberOfLines={2}>{item.desc}</Text>
        <Text style={s.price}>{fmt(item.price)}</Text>
      </View>

      <TouchableOpacity style={s.addBtn} onPress={() => onAdd(item)} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={C.bg} />
      </TouchableOpacity>

      {inCartQty > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{inCartQty}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: C.bg2,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.burg + "30",
    position: "relative",
  },
  body: { flex: 1 },
  name: { color: C.cream, fontSize: 14, fontWeight: "600", marginBottom: 4 },
  desc: { color: C.textDim, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  price: { color: C.gold, fontSize: 15, fontWeight: "700" },
  addBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: C.burg,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: C.gold, fontSize: 10, fontWeight: "700" },
});
