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
  Image,
} from "react-native";
import { C, S } from "../theme";
import { useAuth } from "../context/Auth";

const logo = require("../../assets/icon.png");

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
      const raw = err.message || "Authentication failed";
      let msg = raw;
      if (raw.includes("auth/configuration-not-found") || raw.includes("configuration not found")) {
        msg = "Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication → Sign-in method.";
      } else if (raw.includes("auth/email-already-in-use")) {
        msg = "This email is already registered. Try signing in instead.";
      } else if (raw.includes("auth/invalid-email")) {
        msg = "Please enter a valid email address.";
      } else if (raw.includes("auth/weak-password")) {
        msg = "Password must be at least 6 characters.";
      } else if (raw.includes("auth/user-not-found") || raw.includes("auth/wrong-password") || raw.includes("auth/invalid-credential")) {
        msg = "Invalid email or password.";
      } else if (raw.includes("auth/")) {
        msg = raw.split("auth/")[1].replace(/[-)]/g, " ").trim();
      }
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
        {/* Logo */}
        <View style={st.logoWrap}>
          <Image source={logo} style={st.logo} resizeMode="contain" />
          <Text style={st.brandName}>Kutunza Gourmet</Text>
          <Text style={st.tagline}>Nurturing Kings</Text>
        </View>

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
  container: { padding: 20, paddingTop: 16 },
  logoWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: C.textDim,
    marginTop: 2,
  },
  tabs: { flexDirection: "row", marginBottom: 24, gap: 10 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.burg, borderColor: C.burg },
  tabText: { color: C.textDim, fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: "#fff" },
  pwWrap: { position: "relative", flexDirection: "row", alignItems: "center" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  forgot: { color: C.burg, fontSize: 12 },
});
