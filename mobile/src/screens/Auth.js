// mobile/src/screens/Auth.js
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
import { C, S } from "../theme";
import { useAuth } from "../context/Auth";

export default function AuthScreen({ navigation }) {
  const { login, register, forgot } = useAuth();
  const [tab, setTab] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Email and password are required.");
      return;
    }
    if (tab === "register" && !name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (tab === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.message?.includes("auth/")
        ? err.message.split("auth/")[1].replace(/[-)]/g, " ").trim()
        : err.message || "Authentication failed";
      Alert.alert("Error", msg);
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      Alert.alert("Enter email", "Type your email above first.");
      return;
    }
    try {
      await forgot(email.trim());
      Alert.alert("Email sent", "Check your inbox for a password reset link.");
    } catch (err) {
      Alert.alert("Error", err.message || "Could not send reset email");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={S.screen}
        contentContainerStyle={st.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tab toggle */}
        <View style={st.tabs}>
          {["login", "register"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[st.tab, tab === t && st.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[st.tabText, tab === t && st.tabTextActive]}>
                {t === "login" ? "Sign In" : "Register"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name field (register only) */}
        {tab === "register" && (
          <>
            <Text style={S.label}>Name</Text>
            <TextInput
              style={S.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={C.textDim}
              placeholder="Full name"
              autoCapitalize="words"
            />
            <View style={{ height: 14 }} />
          </>
        )}

        <Text style={S.label}>Email</Text>
        <TextInput
          style={S.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={C.textDim}
          placeholder="you@email.com"
        />

        <View style={{ height: 14 }} />
        <Text style={S.label}>Password</Text>
        <View style={st.pwWrap}>
          <TextInput
            style={[S.input, { flex: 1, paddingRight: 44 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            placeholderTextColor={C.textDim}
            placeholder="Min 8 characters"
          />
          <TouchableOpacity style={st.eyeBtn} onPress={() => setShowPw(!showPw)}>
            <Text style={{ color: C.textDim, fontSize: 12 }}>
              {showPw ? "HIDE" : "SHOW"}
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "login" && (
          <TouchableOpacity onPress={handleForgot} style={{ marginTop: 10 }}>
            <Text style={st.forgot}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[S.btnGold, { marginTop: 24 }]}
          onPress={handleSubmit}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <Text style={S.btnGoldText}>
              {tab === "login" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { padding: 20, paddingTop: 30 },
  tabs: { flexDirection: "row", marginBottom: 24, gap: 10 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.burg + "60",
  },
  tabActive: { backgroundColor: C.burg, borderColor: C.gold + "60" },
  tabText: { color: C.textDim, fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: C.gold },
  pwWrap: { position: "relative", flexDirection: "row", alignItems: "center" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  forgot: { color: C.goldLight, fontSize: 12 },
});
