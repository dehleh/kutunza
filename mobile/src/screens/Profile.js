// mobile/src/screens/Profile.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, fmt } from "../theme";
import { useAuth } from "../context/Auth";
import { orderAPI, authAPI } from "../api";

export default function ProfileScreen({ navigation }) {
  const { user, isAdmin, logout } = useAuth();
  const [stats, setStats] = useState({ count: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const orders = await orderAPI.getMyOrders();
      const list = Array.isArray(orders) ? orders : orders?.orders || [];
      const delivered = list.filter((o) => o.status === "delivered");
      setStats({
        count: list.length,
        delivered: delivered.length,
        total: list.reduce((sum, o) => sum + (o.total || 0), 0),
      });
    } catch {
      // silent — stats are supplementary
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadStats();
    else setLoading(false);
  }, [user, loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

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

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      await authAPI.createProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      Alert.alert("Saved", "Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
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
    <ScrollView
      style={S.screen}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.burg} colors={[C.burg]} />}
    >
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
              <Ionicons name="shield-checkmark" size={12} color={C.burg} />
              <Text style={st.adminText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats cards */}
      {!loading && (
        <View style={st.statsRow}>
          <View style={st.statCard}>
            <Text style={st.statNum}>{stats.count}</Text>
            <Text style={st.statLabel}>Orders</Text>
          </View>
          <View style={st.statCard}>
            <Text style={st.statNum}>{stats.delivered || 0}</Text>
            <Text style={st.statLabel}>Delivered</Text>
          </View>
          <View style={st.statCard}>
            <Text style={st.statNum}>{fmt(stats.total)}</Text>
            <Text style={st.statLabel}>Total Spent</Text>
          </View>
        </View>
      )}
      {loading && <ActivityIndicator color={C.burg} style={{ marginVertical: 16 }} />}

      <View style={S.divider} />

      {/* Edit profile section */}
      {editing ? (
        <View style={st.editSection}>
          <Text style={st.sectionTitle}>Edit Profile</Text>
          <Text style={S.label}>Display Name</Text>
          <TextInput
            style={S.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Your name"
            placeholderTextColor={C.textDim}
          />
          <Text style={[S.label, { marginTop: 12 }]}>Phone</Text>
          <TextInput
            style={S.input}
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="08012345678"
            placeholderTextColor={C.textDim}
            keyboardType="phone-pad"
          />
          <View style={[S.row, { gap: 12, marginTop: 16 }]}>
            <TouchableOpacity
              style={[S.btnBurg, { flex: 1 }]}
              onPress={() => setEditing(false)}
            >
              <Text style={S.btnBurgText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.btnGold, { flex: 1, opacity: saving ? 0.6 : 1 }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={C.bg} size="small" />
              ) : (
                <Text style={S.btnGoldText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={st.menuItem}
          onPress={() => {
            setEditName(user.displayName || "");
            setEditPhone("");
            setEditing(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color={C.text} />
          <Text style={st.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={C.textDim} />
        </TouchableOpacity>
      )}

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

      {/* App info */}
      <Text style={st.version}>Kutunza v1.0.0</Text>
    </ScrollView>
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
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  displayName: { color: C.cream, fontSize: 18, fontWeight: "600" },
  email: { color: C.textDim, fontSize: 13, marginTop: 2 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  adminText: { color: C.burg, fontSize: 11, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.bg2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  statNum: { color: C.burg, fontSize: 18, fontWeight: "700" },
  statLabel: { color: C.textDim, fontSize: 10, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  editSection: {
    backgroundColor: C.bg2,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: { color: C.cream, fontSize: 16, fontWeight: "600", marginBottom: 12 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuLabel: { color: C.text, fontSize: 15, flex: 1 },
  guestTitle: { color: C.cream, fontSize: 20, fontWeight: "700", marginTop: 16 },
  guestDesc: { color: C.textDim, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },
  version: { color: C.textDim + "60", fontSize: 11, textAlign: "center", marginTop: 30 },
});
