// mobile/src/screens/Events.js
import React, { useState } from "react";
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
import { C, S, fmt } from "../theme";
import { EVENT_TYPES, MENU_SUGGESTIONS } from "../data";
import { eventAPI } from "../api";
import { useAuth } from "../context/Auth";

const STEPS = ["Details", "Event Info", "Menu & Budget"];

export default function EventsScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // form
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [venue, setVenue] = useState("");
  const [budgetTier, setBudgetTier] = useState("");
  const [menuNotes, setMenuNotes] = useState("");

  const canNext =
    step === 0
      ? name.trim() && email.trim() && phone.trim()
      : step === 1
      ? eventType && date.trim() && guests.trim()
      : budgetTier;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to book an event.");
      return;
    }
    setBusy(true);
    try {
      // Field names match backend/routes/events.js
      await eventAPI.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        eventType,
        date: date.trim(),
        guests: parseInt(guests, 10) || 0,
        location: venue.trim(),
        budget: budgetTier,
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
          onPress={() => { setDone(false); setStep(0); setEventType(""); setBudgetTier(""); }}
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
            <TextInput style={S.input} value={date} onChangeText={setDate} placeholderTextColor={C.textDim} placeholder="e.g. 15 March 2026" />

            <Text style={[S.label, { marginTop: 14 }]}>Guest Count</Text>
            <TextInput style={S.input} value={guests} onChangeText={setGuests} keyboardType="number-pad" placeholderTextColor={C.textDim} placeholder="e.g. 200" />

            <Text style={[S.label, { marginTop: 14 }]}>Venue (optional)</Text>
            <TextInput style={S.input} value={venue} onChangeText={setVenue} placeholderTextColor={C.textDim} placeholder="Event location" />
          </View>
        )}

        {/* ─── Step 2: Menu & Budget ────────────────────────────────────── */}
        {step === 2 && (
          <View style={st.section}>
            <Text style={S.label}>Budget Tier</Text>
            {Object.entries(MENU_SUGGESTIONS).map(([key, tier]) => (
              <TouchableOpacity
                key={key}
                style={[st.tierCard, budgetTier === key && st.tierCardActive]}
                onPress={() => setBudgetTier(key)}
              >
                <Text style={[st.tierTitle, budgetTier === key && st.tierTitleActive]}>
                  {tier.label}
                </Text>
                <Text style={st.tierItems}>{tier.items.join(" • ")}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[S.label, { marginTop: 14 }]}>Additional Menu Notes</Text>
            <TextInput
              style={[S.input, { minHeight: 60, textAlignVertical: "top" }]}
              value={menuNotes}
              onChangeText={setMenuNotes}
              multiline
              placeholderTextColor={C.textDim}
              placeholder="Dietary needs, specific dishes, etc."
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
          {step < 2 ? (
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
    borderColor: C.burg + "60",
  },
  stepDotActive: { backgroundColor: C.burg, borderColor: C.gold + "60" },
  stepNum: { color: C.textDim, fontSize: 12, fontWeight: "700" },
  stepNumActive: { color: C.gold },
  stepLabel: { color: C.textDim, fontSize: 10, marginTop: 4 },
  stepLabelActive: { color: C.gold },
  section: { marginTop: 4 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.burg + "40",
  },
  chipActive: { backgroundColor: C.burg, borderColor: C.gold + "60" },
  chipText: { color: C.textDim, fontSize: 12, fontWeight: "500" },
  chipTextActive: { color: C.gold },
  tierCard: {
    backgroundColor: C.bg2,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.burg + "30",
  },
  tierCardActive: { borderColor: C.gold + "80", backgroundColor: C.burg + "40" },
  tierTitle: { color: C.cream, fontSize: 14, fontWeight: "600" },
  tierTitleActive: { color: C.gold },
  tierItems: { color: C.textDim, fontSize: 11, marginTop: 6, lineHeight: 18 },
  doneTitle: { color: C.cream, fontSize: 22, fontWeight: "700", marginTop: 16 },
  doneDesc: { color: C.textDim, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
});
