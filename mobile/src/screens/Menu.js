// mobile/src/screens/Menu.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { C, S } from "../theme";
import { DEFAULT_MENU, BOWL_ELIGIBLE } from "../data";
import { menuAPI } from "../api";
import { useCart } from "../context/Cart";
import MenuCard from "../components/MenuCard";
import BowlPicker from "../components/BowlPicker";
import * as Haptics from "expo-haptics";

export default function MenuScreen() {
  const { cart, addToCart } = useCart();

  const [categories, setCategories] = useState(DEFAULT_MENU);
  const [activeCat, setActiveCat] = useState(DEFAULT_MENU[0]?.id);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [bowlItem, setBowlItem] = useState(null); // triggers BowlPicker

  // ─── Fetch menu from backend (fallback to default) ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await menuAPI.getMenu();
        if (res?.menu?.length) setCategories(res.menu);
      } catch {
        /* use DEFAULT_MENU */
      }
      setLoading(false);
    })();
  }, []);

  // ─── Current items (filtered by category + search) ─────────────────────────
  const items = useMemo(() => {
    const cat = categories.find((c) => c.id === activeCat);
    if (!cat) return [];
    let list = cat.items.filter((i) => i.active !== false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.desc?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, activeCat, search]);

  // ─── Cart qty lookup ───────────────────────────────────────────────────────
  const cartQty = useCallback(
    (itemId) => {
      return cart
        .filter((c) => c.id === itemId)
        .reduce((s, c) => s + c.qty, 0);
    },
    [cart]
  );

  // ─── Add handler (opens bowl picker if eligible) ───────────────────────────
  const handleAdd = useCallback(
    (item) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (BOWL_ELIGIBLE.includes(activeCat)) {
        setBowlItem({ ...item, categoryId: activeCat });
      } else {
        addToCart({ ...item, categoryId: activeCat, qty: 1 });
      }
    },
    [activeCat, addToCart]
  );

  const handleBowlSelect = useCallback(
    (size) => {
      if (!bowlItem) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addToCart({
        ...bowlItem,
        bowlSize: size.id,
        bowlLabel: size.label,
        bowlMultiplier: size.multiplier,
        qty: 1,
      });
      setBowlItem(null);
    },
    [bowlItem, addToCart]
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={S.screen}>
        <ActivityIndicator color={C.burg} size="large" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={S.screen}>
      {/* Search */}
      <View style={st.searchWrap}>
        <TextInput
          style={st.search}
          placeholder="Search menu…"
          placeholderTextColor={C.textDim}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category pills */}
      <View style={st.pillsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.pills}
        >
          {categories.map((cat) => {
            const active = cat.id === activeCat;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[st.pill, active && st.pillActive]}
                onPress={() => setActiveCat(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={st.pillIcon}>{cat.icon}</Text>
                <Text style={[st.pillLabel, active && st.pillLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Items grid */}
      {search.trim() && items.length > 0 && (
        <Text style={st.resultCount}>{items.length} result{items.length !== 1 ? "s" : ""}</Text>
      )}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={st.grid}
        renderItem={({ item }) => (
          <MenuCard
            item={item}
            onAdd={handleAdd}
            inCartQty={cartQty(item.id)}
            categoryId={activeCat}
          />
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={S.emptyIcon}>🍽</Text>
            <Text style={S.emptyText}>No items found</Text>
          </View>
        }
      />

      {/* Bowl picker modal */}
      <BowlPicker
        visible={!!bowlItem}
        itemName={bowlItem?.name}
        onSelect={handleBowlSelect}
        onClose={() => setBowlItem(null)}
      />
    </View>
  );
}

const st = StyleSheet.create({
  searchWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  search: {
    backgroundColor: C.bg2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.cream,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillsWrap: {
    backgroundColor: C.bg,
    zIndex: 1,
  },
  pills: { paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillActive: { backgroundColor: C.burg, borderColor: C.burg },
  pillIcon: { fontSize: 14, marginRight: 6 },
  pillLabel: { color: C.text, fontSize: 12, fontWeight: "600" },
  pillLabelActive: { color: "#fff" },
  grid: { paddingHorizontal: 8, paddingBottom: 20, paddingTop: 4 },
  resultCount: { color: C.textDim, fontSize: 11, paddingHorizontal: 14, marginBottom: 4 },
});
