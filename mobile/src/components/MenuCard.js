// mobile/src/components/MenuCard.js
// Redesigned card with category gradient header, image support, and add-to-cart button

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
      <View style={[s.header, { backgroundColor: c2 }]}>
        {hasImage ? (
          <Image
            source={localImg || { uri: remoteImg }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.emojiWrap, { backgroundColor: c1 + "30" }]}>
            <Text style={s.emoji}>{emoji}</Text>
          </View>
        )}
        {/* Gradient overlay for text readability */}
        <View style={[s.headerOverlay, { backgroundColor: c2 + "B0" }]} />
        <Text style={s.headerPrice}>{fmt(item.price)}</Text>
      </View>

      {/* ─── Body ───────────────────────────────────────────────────── */}
      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
        <Text style={s.desc} numberOfLines={2}>{item.desc}</Text>
      </View>

      {/* ─── Add button ─────────────────────────────────────────────── */}
      <TouchableOpacity style={s.addBtn} onPress={() => onAdd(item)} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={C.bg} />
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
    backgroundColor: C.bg2,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.burg + "30",
    position: "relative",
  },
  // ─ Header / image area
  header: {
    height: 90,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  emojiWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 32 },
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
  headerPrice: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingBottom: 6,
    zIndex: 2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // ─ Body
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 36, // space for add button
  },
  name: {
    color: C.cream,
    fontSize: 13,
    fontWeight: "700",
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
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    borderColor: C.bg2,
  },
  badgeText: { color: C.gold, fontSize: 10, fontWeight: "700" },
});
