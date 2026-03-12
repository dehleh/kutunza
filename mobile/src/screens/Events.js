// mobile/src/screens/Events.js
import React, { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { C, S, fmt } from "../theme";
import { EVENT_TYPES, DEFAULT_MENU } from "../data";
import { eventAPI, menuAPI } from "../api";
import { useAuth } from "../context/Auth";

const STEPS = ["Details", "Event Info", "Menu", "Review"];

export default function EventsScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // form – step 0
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  // form – step 1
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [dateObj, setDateObj] = useState(new Date(Date.now() + 7 * 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [guests, setGuests] = useState("");
  const [venue, setVenue] = useState("");

  // form – step 2 (menu)
  const [menu, setMenu] = useState([]); // full menu categories
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: { name, category, price, qty } }
  const [menuCat, setMenuCat] = useState(""); // active category filter
  const [menuSearch, setMenuSearch] = useState("");
  const [budget, setBudget] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  // form – step 3 (review)
  const [menuNotes, setMenuNotes] = useState("");

  // Fetch live menu
  useEffect(() => {
    (async () => {
      try {
        const res = await menuAPI.getMenu();
        const cats = res.categories || res.menu || res;
        if (Array.isArray(cats) && cats.length) setMenu(cats);
        else setMenu(DEFAULT_MENU);
      } catch {
        setMenu(DEFAULT_MENU);
      }
    })();
  }, []);

  // Set default category
  useEffect(() => {
    if (menu.length && !menuCat) setMenuCat(menu[0].id);
  }, [menu]);

  // Filtered items for current category
  const filteredItems = useMemo(() => {
    const cat = menu.find((c) => c.id === menuCat);
    if (!cat) return [];
    let items = (cat.items || []).filter((i) => i.active !== false);
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items.map((i) => ({ ...i, category: cat.label, categoryId: cat.id }));
  }, [menu, menuCat, menuSearch]);

  // Selected items as array
  const selectedList = useMemo(() => Object.values(selectedItems), [selectedItems]);
  const menuTotal = useMemo(() => selectedList.reduce((s, i) => s + i.price * i.qty, 0), [selectedList]);

  const setQty = (item, newQty) => {
    setSelectedItems((prev) => {
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[item.id || item.itemId];
        return copy;
      }
      return {
        ...prev,
        [item.id || item.itemId]: {
          itemId: item.id || item.itemId,
          name: item.name,
          category: item.category,
          price: item.price,
          qty: Math.min(newQty, 5000),
        },
      };
    });
  };

  // Custom menu items
  const [customItems, setCustomItems] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("");

  const addCustomItem = () => {
    const n = customName.trim();
    const p = parseInt(customPrice, 10);
    const q = parseInt(customQty, 10) || 1;
    if (!n) { Alert.alert("Name required", "Enter a name for the custom item."); return; }
    if (!p || p < 1) { Alert.alert("Price required", "Enter a valid price."); return; }
    const id = `custom-${Date.now()}`;
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { itemId: id, name: n, category: "Custom", price: p, qty: Math.min(q, 5000) },
    }));
    setCustomName(""); setCustomPrice(""); setCustomQty("");
  };

  const removeItem = (itemId) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleSuggestMenu = async () => {
    const b = parseInt(budget, 10);
    const g = parseInt(guests, 10);
    if (!b || b < 1000) {
      Alert.alert("Budget required", "Enter a budget of at least ₦1,000 to get suggestions.");
      return;
    }
    if (!g || g < 1) {
      Alert.alert("Guest count required", "Go back & enter number of guests first.");
      return;
    }
    setSuggesting(true);
    try {
      const res = await eventAPI.suggestMenu({ budget: b, guests: g });
      const items = res.menuItems || [];
      const map = {};
      items.forEach((it) => {
        map[it.itemId] = { itemId: it.itemId, name: it.name, category: it.category, price: it.price, qty: it.qty };
      });
      setSelectedItems(map);
      Alert.alert("Menu Suggested!", `${items.length} items selected within your ${fmt(b)} budget.`);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not suggest menu");
    } finally {
      setSuggesting(false);
    }
  };

  const canNext =
    step === 0
      ? name.trim() && email.trim() && phone.trim()
      : step === 1
      ? eventType && date.trim() && guests.trim()
      : step === 2
      ? selectedList.length > 0
      : true;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to book an event.");
      return;
    }
    setBusy(true);
    try {
      await eventAPI.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        eventType,
        date: date.trim(),
        guests: parseInt(guests, 10) || 0,
        location: venue.trim(),
        budget: parseInt(budget, 10) || 0,
        menuItems: selectedList,
        notes: menuNotes.trim(),
      });
      setDone(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  // ─── Done ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={[S.screen, { alignItems: "center", justifyContent: "center", padding: 30 }]}>
        <Ionicons name="calendar-outline" size={64} color={C.greenLight} />
        <Text style={st.doneTitle}>Booking Received!</Text>
        <Text style={st.doneDesc}>
          Our events team will contact you within 24 hours to discuss your event.
        </Text>
        <TouchableOpacity
          style={[S.btnGold, { marginTop: 24, width: "100%" }]}
          onPress={() => {
            setDone(false); setStep(0); setEventType(""); setSelectedItems({});
            setBudget(""); setMenuNotes("");
          }}
        >
          <Text style={S.btnGoldText}>Book Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Step indicator ────────────────────────────────────────────────────────
  const StepBar = () => (
    <View style={st.stepBar}>
      {STEPS.map((label, i) => (
        <View key={i} style={[st.stepItem, i <= step && st.stepItemActive]}>
          <View style={[st.stepDot, i <= step && st.stepDotActive]}>
            <Text style={[st.stepNum, i <= step && st.stepNumActive]}>{i + 1}</Text>
          </View>
          <Text style={[st.stepLabel, i <= step && st.stepLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={S.screen}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <StepBar />

        {/* ─── Step 0: Contact details ──────────────────────────────────── */}
        {step === 0 && (
          <View style={st.section}>
            <Text style={S.label}>Full Name</Text>
            <TextInput style={S.input} value={name} onChangeText={setName} placeholderTextColor={C.textDim} placeholder="Your name" />
            <Text style={[S.label, { marginTop: 14 }]}>Email</Text>
            <TextInput style={S.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.textDim} placeholder="you@email.com" />
            <Text style={[S.label, { marginTop: 14 }]}>Phone</Text>
            <TextInput style={S.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={C.textDim} placeholder="08012345678" />
          </View>
        )}

        {/* ─── Step 1: Event info ───────────────────────────────────────── */}
        {step === 1 && (
          <View style={st.section}>
            <Text style={S.label}>Event Type</Text>
            <View style={st.chipWrap}>
              {EVENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[st.chip, eventType === t && st.chipActive]}
                  onPress={() => setEventType(t)}
                >
                  <Text style={[st.chipText, eventType === t && st.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[S.label, { marginTop: 14 }]}>Event Date</Text>
            <TouchableOpacity
              style={st.dateBtn}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={18} color={date ? C.cream : C.textDim} />
              <Text style={[st.dateBtnText, !date && { color: C.textDim }]}>
                {date || "Select a date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setDateObj(selectedDate);
                    setDate(
                      selectedDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    );
                  }
                }}
              />
            )}

            <Text style={[S.label, { marginTop: 14 }]}>Guest Count</Text>
            <TextInput style={S.input} value={guests} onChangeText={setGuests} keyboardType="number-pad" placeholderTextColor={C.textDim} placeholder="e.g. 200" />

            <Text style={[S.label, { marginTop: 14 }]}>Location</Text>
            <TextInput style={S.input} value={venue} onChangeText={setVenue} placeholderTextColor={C.textDim} placeholder="Event location" />
          </View>
        )}

        {/* ─── Step 2: Menu Selection ───────────────────────────────────── */}
        {step === 2 && (
          <View style={st.section}>

            {/* Budget suggestion */}
            <Text style={S.label}>Budget (Optional)</Text>
            <View style={[S.row, { gap: 8, marginBottom: 14 }]}>
              <TextInput
                style={[S.input, { flex: 1 }]}
                value={budget}
                onChangeText={setBudget}
                keyboardType="number-pad"
                placeholderTextColor={C.textDim}
                placeholder="e.g. 500000"
              />
              <TouchableOpacity
                style={[st.suggestBtn, (!budget || suggesting) && { opacity: 0.5 }]}
                onPress={handleSuggestMenu}
                disabled={!budget || suggesting}
              >
                {suggesting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={st.suggestBtnText}>Suggest</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Selected items summary */}
            {selectedList.length > 0 && (
              <View style={st.selectedSummary}>
                <View style={[S.row, { justifyContent: "space-between" }]}>
                  <Text style={st.selectedCount}>
                    {selectedList.length} item{selectedList.length > 1 ? "s" : ""} selected
                  </Text>
                  <Text style={st.selectedTotal}>{fmt(menuTotal)}</Text>
                </View>
              </View>
            )}

            {/* Search */}
            <View style={st.searchWrap}>
              <Ionicons name="search" size={16} color={C.textDim} />
              <TextInput
                style={st.searchInput}
                value={menuSearch}
                onChangeText={setMenuSearch}
                placeholder="Search menu..."
                placeholderTextColor={C.textDim}
              />
              {menuSearch ? (
                <TouchableOpacity onPress={() => setMenuSearch("")}>
                  <Ionicons name="close-circle" size={16} color={C.textDim} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll} contentContainerStyle={{ gap: 8 }}>
              {menu.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[st.catPill, menuCat === cat.id && st.catPillActive]}
                  onPress={() => setMenuCat(cat.id)}
                >
                  <Text style={st.catPillIcon}>{cat.icon}</Text>
                  <Text style={[st.catPillText, menuCat === cat.id && st.catPillTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Menu items */}
            {filteredItems.map((item) => {
              const sel = selectedItems[item.id];
              return (
                <View key={item.id} style={st.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.menuName}>{item.name}</Text>
                    <Text style={st.menuPrice}>{fmt(item.price)}</Text>
                  </View>
                  <View style={st.qtyRow}>
                    {sel ? (
                      <>
                        <TouchableOpacity style={st.qtyBtn} onPress={() => removeItem(item.id)}>
                          <Ionicons name="trash-outline" size={14} color={C.burg} />
                        </TouchableOpacity>
                        <TextInput
                          style={st.qtyInput}
                          value={String(sel.qty)}
                          onChangeText={(t) => {
                            const n = parseInt(t, 10);
                            if (t === "" || t === "0") setQty(item, 0);
                            else if (n > 0) setQty(item, n);
                          }}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          maxLength={4}
                        />
                      </>
                    ) : (
                      <TouchableOpacity style={st.addBtn} onPress={() => setQty(item, 1)}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={st.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Custom menu item */}
            <View style={st.customSection}>
              <Text style={[S.label, { marginBottom: 8 }]}>Add Custom Item</Text>
              <View style={st.customRow}>
                <TextInput
                  style={[S.input, { flex: 2 }]}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="Item name"
                  placeholderTextColor={C.textDim}
                  maxLength={100}
                />
              </View>
              <View style={[st.customRow, { marginTop: 8 }]}>
                <TextInput
                  style={[S.input, { flex: 1 }]}
                  value={customPrice}
                  onChangeText={setCustomPrice}
                  placeholder="Price"
                  placeholderTextColor={C.textDim}
                  keyboardType="number-pad"
                  maxLength={8}
                />
                <TextInput
                  style={[S.input, { flex: 1 }]}
                  value={customQty}
                  onChangeText={setCustomQty}
                  placeholder="Qty (1)"
                  placeholderTextColor={C.textDim}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity style={st.addBtn} onPress={addCustomItem}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={st.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ─── Step 3: Review & Notes ───────────────────────────────────── */}
        {step === 3 && (
          <View style={st.section}>
            <Text style={S.sectionTitle}>Booking Summary</Text>

            <View style={st.reviewCard}>
              <Text style={st.reviewLabel}>Contact</Text>
              <Text style={st.reviewValue}>{name} • {email} • {phone}</Text>
            </View>
            <View style={st.reviewCard}>
              <Text style={st.reviewLabel}>Event</Text>
              <Text style={st.reviewValue}>{eventType} • {date} • {guests} guests</Text>
              {venue ? <Text style={st.reviewValue}>{venue}</Text> : null}
            </View>

            <View style={st.reviewCard}>
              <Text style={st.reviewLabel}>Menu ({selectedList.length} items)</Text>
              {selectedList.map((it) => (
                <View key={it.itemId} style={[S.row, { justifyContent: "space-between", marginTop: 4 }]}>
                  <Text style={st.reviewValue}>{it.qty}× {it.name}</Text>
                  <Text style={st.reviewValue}>{fmt(it.price * it.qty)}</Text>
                </View>
              ))}
              <View style={[S.divider, { marginVertical: 8 }]} />
              <View style={[S.row, { justifyContent: "space-between" }]}>
                <Text style={[st.reviewLabel, { marginBottom: 0 }]}>Total</Text>
                <Text style={[st.reviewLabel, { marginBottom: 0, color: C.burg }]}>{fmt(menuTotal)}</Text>
              </View>
            </View>

            <Text style={[S.label, { marginTop: 14 }]}>Additional Notes</Text>
            <TextInput
              style={[S.input, { minHeight: 60, textAlignVertical: "top" }]}
              value={menuNotes}
              onChangeText={setMenuNotes}
              multiline
              placeholderTextColor={C.textDim}
              placeholder="Dietary needs, special requests, etc."
            />
          </View>
        )}

        {/* ─── Navigation buttons ───────────────────────────────────────── */}
        <View style={[S.row, { marginTop: 20, gap: 12 }]}>
          {step > 0 && (
            <TouchableOpacity style={[S.btnBurg, { flex: 1 }]} onPress={() => setStep(step - 1)}>
              <Text style={S.btnBurgText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[S.btnGold, { flex: 1, opacity: canNext ? 1 : 0.5 }]}
              onPress={() => canNext && setStep(step + 1)}
              disabled={!canNext}
            >
              <Text style={S.btnGoldText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[S.btnGold, { flex: 1, opacity: canNext ? 1 : 0.5 }]}
              onPress={handleSubmit}
              disabled={!canNext || busy}
            >
              {busy ? (
                <ActivityIndicator color={C.bg} />
              ) : (
                <Text style={S.btnGoldText}>Submit Booking</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  stepBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepItem: { alignItems: "center", flex: 1 },
  stepItemActive: {},
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bg3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  stepDotActive: { backgroundColor: C.burg, borderColor: C.burg },
  stepNum: { color: C.textDim, fontSize: 12, fontWeight: "700" },
  stepNumActive: { color: "#fff" },
  stepLabel: { color: C.textDim, fontSize: 10, marginTop: 4 },
  stepLabelActive: { color: C.burg },
  section: { marginTop: 4 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bg2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },
  dateBtnText: { color: C.cream, fontSize: 14 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.burg, borderColor: C.burg },
  chipText: { color: C.text, fontSize: 12, fontWeight: "500" },
  chipTextActive: { color: "#fff" },

  // ─── Menu step ───────────────────────────────────────────────────────────
  suggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.burg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  suggestBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  selectedSummary: {
    backgroundColor: C.burg + "10",
    borderWidth: 1,
    borderColor: C.burg + "30",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  selectedCount: { color: C.burg, fontSize: 13, fontWeight: "600" },
  selectedTotal: { color: C.burg, fontSize: 15, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.bg3,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: C.cream, fontSize: 13, padding: 0 },
  catScroll: { marginBottom: 12 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bg2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  catPillActive: { backgroundColor: C.burg, borderColor: C.burg },
  catPillIcon: { fontSize: 14 },
  catPillText: { color: C.text, fontSize: 12, fontWeight: "500" },
  catPillTextActive: { color: "#fff" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  menuName: { color: C.cream, fontSize: 13, fontWeight: "600" },
  menuPrice: { color: C.textDim, fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bg3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.burg + "40",
  },
  qtyInput: {
    color: C.cream,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 44,
    textAlign: "center",
    backgroundColor: C.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.burg + "40",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  customSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.burg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ─── Review step ─────────────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: C.bg2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  reviewLabel: { color: C.text, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  reviewValue: { color: C.cream, fontSize: 13, lineHeight: 20 },

  // ─── Done ────────────────────────────────────────────────────────────────
  doneTitle: { color: C.cream, fontSize: 22, fontWeight: "700", marginTop: 16 },
  doneDesc: { color: C.textDim, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
});
