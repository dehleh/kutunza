// mobile/src/screens/Profile.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";
import { useAuth } from "../context/Auth";

export default function ProfileScreen({ navigation }) {
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign out?", "You will need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // ─── Not signed in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[S.screen, { padding: 20, alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="person-circle-outline" size={72} color={C.textDim} />
        <Text style={st.guestTitle}>Welcome to Kutunza</Text>
        <Text style={st.guestDesc}>Sign in to place orders, book events, and track your history.</Text>
        <TouchableOpacity
          style={[S.btnGold, { marginTop: 24, width: "100%" }]}
          onPress={() => navigation.navigate("Auth")}
        >
          <Text style={S.btnGoldText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Signed in ─────────────────────────────────────────────────────────────
  return (
    <View style={[S.screen, { padding: 20 }]}>
      {/* Avatar area */}
      <View style={st.header}>
        <View style={st.avatar}>
          <Text style={st.avatarText}>
            {(user.displayName || user.email || "?")[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.displayName}>{user.displayName || "User"}</Text>
          <Text style={st.email}>{user.email}</Text>
          {isAdmin && (
            <View style={st.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color={C.gold} />
              <Text style={st.adminText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      <View style={S.divider} />

      {/* Quick links */}
      <TouchableOpacity
        style={st.menuItem}
        onPress={() => navigation.getParent()?.navigate("Orders")}
      >
        <Ionicons name="receipt-outline" size={20} color={C.text} />
        <Text style={st.menuLabel}>My Orders</Text>
        <Ionicons name="chevron-forward" size={18} color={C.textDim} />
      </TouchableOpacity>

      <TouchableOpacity
        style={st.menuItem}
        onPress={() => navigation.getParent()?.navigate("Events")}
      >
        <Ionicons name="calendar-outline" size={20} color={C.text} />
        <Text style={st.menuLabel}>My Events</Text>
        <Ionicons name="chevron-forward" size={18} color={C.textDim} />
      </TouchableOpacity>

      <View style={[S.divider, { marginTop: 16 }]} />

      {/* Sign out */}
      <TouchableOpacity style={[st.menuItem, { marginTop: 16 }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={C.redLight} />
        <Text style={[st.menuLabel, { color: C.redLight }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.burg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.gold, fontSize: 22, fontWeight: "700" },
  displayName: { color: C.cream, fontSize: 18, fontWeight: "600" },
  email: { color: C.textDim, fontSize: 13, marginTop: 2 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  adminText: { color: C.gold, fontSize: 11, fontWeight: "600" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuLabel: { color: C.text, fontSize: 15, flex: 1 },
  guestTitle: { color: C.cream, fontSize: 20, fontWeight: "700", marginTop: 16 },
  guestDesc: { color: C.textDim, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },
});
