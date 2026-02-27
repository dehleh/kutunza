// mobile/src/components/MenuCard.js
// Clean, light card with subtle shadow and accent colours

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fmt } from "../theme";
import { CAT_COLORS, CAT_EMOJI, ITEM_IMAGES } from "../assets/images";

export default function MenuCard({ item, onAdd, inCartQty, categoryId }) {
  const [c1, c2] = CAT_COLORS[categoryId] || CAT_COLORS.general;
  const emoji = CAT_EMOJI[categoryId] || "🍽";
  const localImg = ITEM_IMAGES[item.id];
  const remoteImg = item.imageUrl;
  const hasImage = localImg || remoteImg;

  return (
    <View style={s.card}>
      {/* ─── Visual header ──────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: c2 + "18" }]}>
        {hasImage ? (
          <Image
            source={localImg || { uri: remoteImg }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={s.emoji}>{emoji}</Text>
        )}
      </View>

      {/* ─── Body ───────────────────────────────────────────────────── */}
      <View style={s.body}>
        <Text style={s.price}>{fmt(item.price)}</Text>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <Text style={s.desc} numberOfLines={2}>{item.desc}</Text>
      </View>

      {/* ─── Add button ─────────────────────────────────────────────── */}
      <TouchableOpacity style={[s.addBtn, { backgroundColor: c2 }]} onPress={() => onAdd(item)} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color="#fff" />
      </TouchableOpacity>

      {/* ─── Cart badge ─────────────────────────────────────────────── */}
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
    backgroundColor: C.bg,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // ─ Header / image area
  header: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  emoji: { fontSize: 32 },
  // ─ Body
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 40, // space for add button
  },
  price: {
    color: C.burg,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  name: {
    color: C.cream,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    marginBottom: 3,
  },
  desc: {
    color: C.textDim,
    fontSize: 10.5,
    lineHeight: 14,
  },
  // ─ Add button
  addBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  // ─ Cart badge
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: C.burg,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
