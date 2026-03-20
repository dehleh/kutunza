// mobile/src/screens/Rewards.js
// Loyalty & Rewards screen — points balance, tier progress, history, redemption

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FONT, fmt } from "../theme";
import { useAuth } from "../context/Auth";
import { rewardsAPI } from "../api";

const TIER_ICONS = {
  Bronze: "shield-outline",
  Silver: "shield-half-outline",
  Gold: "shield-checkmark-outline",
  Platinum: "diamond-outline",
};

export default function RewardsScreen({ navigation }) {
  const { user } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [rewardsRes, configRes] = await Promise.all([
        rewardsAPI.get(),
        rewardsAPI.getConfig(),
      ]);
      setRewards(rewardsRes.rewards);
      setConfig(configRes.config);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
    else setLoading(false);
  }, [user, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleRedeem = async () => {
    const pts = parseInt(redeemAmount);
    if (!pts || pts <= 0) {
      Alert.alert("Invalid", "Enter a valid number of points to redeem.");
      return;
    }
    if (config && pts < (config.minRedeemPoints || 100)) {
      Alert.alert("Minimum", `You need at least ${config.minRedeemPoints || 100} points to redeem.`);
      return;
    }
    if (rewards && pts > rewards.pointsBalance) {
      Alert.alert("Insufficient", "You don't have enough points.");
      return;
    }

    setRedeeming(true);
    try {
      const res = await rewardsAPI.redeem(pts);
      Alert.alert(
        "Redeemed!",
        `You got a ${fmt(res.discount)} discount!\n\nYour code: ${res.code}\n\nUse it at checkout.`,
      );
      setRedeemAmount("");
      loadData();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to redeem points.");
    } finally {
      setRedeeming(false);
    }
  };

  // Not signed in
  if (!user) {
    return (
      <View style={[S.screen, { padding: 20, alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="gift-outline" size={72} color={C.textDim} />
        <Text style={st.guestTitle}>Kutunza Rewards</Text>
        <Text style={st.guestDesc}>Sign in to earn points on every order and unlock exclusive rewards.</Text>
        <TouchableOpacity
          style={[S.btnGold, { marginTop: 24, width: "100%" }]}
          onPress={() => navigation.getParent()?.navigate("Profile", { screen: "Auth" })}
        >
          <Text style={S.btnGoldText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[S.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={C.burg} />
      </View>
    );
  }

  const tier = rewards?.tier || { name: "Bronze", color: "#CD7F32", multiplier: 1, minPoints: 0 };
  const tiers = rewards?.tiers || [];
  const nextTier = tiers.find(t => t.minPoints > (rewards?.annualPoints || 0));
  const pointsToNext = nextTier ? nextTier.minPoints - (rewards?.annualPoints || 0) : 0;
  const progressPercent = nextTier
    ? Math.min(100, ((rewards?.annualPoints || 0) - tier.minPoints) / (nextTier.minPoints - tier.minPoints) * 100)
    : 100;

  return (
    <ScrollView
      style={S.screen}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.burg} colors={[C.burg]} />}
    >
      {/* Points balance card */}
      <View style={[st.balanceCard, { borderColor: tier.color }]}>
        <Ionicons name={TIER_ICONS[tier.name] || "shield-outline"} size={36} color={tier.color} />
        <Text style={st.tierName}>{tier.name} Member</Text>
        <Text style={st.pointsBalance}>{(rewards?.pointsBalance || 0).toLocaleString()}</Text>
        <Text style={st.pointsLabel}>Available Points</Text>
        {tier.multiplier > 1 && (
          <View style={[st.multiplierBadge, { backgroundColor: tier.color + "20" }]}>
            <Text style={[st.multiplierText, { color: tier.color }]}>{tier.multiplier}x Points Multiplier</Text>
          </View>
        )}
      </View>

      {/* Tier progress */}
      {nextTier && (
        <View style={st.progressSection}>
          <View style={st.progressHeader}>
            <Text style={st.progressLabel}>Progress to {nextTier.name}</Text>
            <Text style={st.progressPoints}>{pointsToNext.toLocaleString()} pts to go</Text>
          </View>
          <View style={st.progressBar}>
            <View style={[st.progressFill, { width: `${progressPercent}%`, backgroundColor: nextTier.color }]} />
          </View>
        </View>
      )}
      {!nextTier && rewards?.annualPoints > 0 && (
        <View style={st.progressSection}>
          <Text style={[st.progressLabel, { textAlign: "center" }]}>
            You've reached the highest tier! Enjoy {tier.multiplier}x points on every order.
          </Text>
        </View>
      )}

      {/* Stats row */}
      <View style={st.statsRow}>
        <View style={st.statCard}>
          <Text style={st.statNum}>{(rewards?.monthlyPoints || 0).toLocaleString()}</Text>
          <Text style={st.statLabel}>This Month</Text>
        </View>
        <View style={st.statCard}>
          <Text style={st.statNum}>{(rewards?.annualPoints || 0).toLocaleString()}</Text>
          <Text style={st.statLabel}>This Year</Text>
        </View>
        <View style={st.statCard}>
          <Text style={st.statNum}>{(rewards?.lifetimePoints || 0).toLocaleString()}</Text>
          <Text style={st.statLabel}>Lifetime</Text>
        </View>
      </View>

      {/* Monthly & Annual spend */}
      <View style={st.spendRow}>
        <View style={[st.spendCard, { flex: 1 }]}>
          <Text style={st.spendLabel}>Monthly Spend</Text>
          <Text style={st.spendValue}>{fmt(rewards?.monthlySpent || 0)}</Text>
          {config && rewards?.monthlySpent < (config.monthlyBonusThreshold || 10000) && (
            <Text style={st.spendHint}>
              Spend {fmt((config.monthlyBonusThreshold || 10000) - (rewards?.monthlySpent || 0))} more for {config.monthlyBonusPoints || 50} bonus pts
            </Text>
          )}
          {config && rewards?.monthlySpent >= (config.monthlyBonusThreshold || 10000) && (
            <Text style={[st.spendHint, { color: C.greenLight }]}>Monthly bonus earned!</Text>
          )}
        </View>
        <View style={[st.spendCard, { flex: 1 }]}>
          <Text style={st.spendLabel}>Annual Spend</Text>
          <Text style={st.spendValue}>{fmt(rewards?.annualSpent || 0)}</Text>
        </View>
      </View>

      <View style={S.divider} />

      {/* Redeem section */}
      <Text style={st.sectionTitle}>Redeem Points</Text>
      <Text style={st.redeemInfo}>
        {config ? `${config.redemptionRate || 1} point = ₦${config.redemptionRate || 1}. Min: ${config.minRedeemPoints || 100} points.` : "Loading..."}
      </Text>
      <View style={st.redeemRow}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={redeemAmount}
          onChangeText={setRedeemAmount}
          placeholder="Points to redeem"
          placeholderTextColor={C.textDim}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={[S.btnGold, { marginLeft: 12, paddingHorizontal: 20, opacity: redeeming ? 0.6 : 1 }]}
          onPress={handleRedeem}
          disabled={redeeming}
        >
          {redeeming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={S.btnGoldText}>Redeem</Text>
          )}
        </TouchableOpacity>
      </View>
      {redeemAmount ? (
        <Text style={st.redeemPreview}>
          = {fmt(parseInt(redeemAmount || 0) * (config?.redemptionRate || 1))} discount
        </Text>
      ) : null}

      <View style={[S.divider, { marginTop: 20 }]} />

      {/* Tier guide */}
      <Text style={st.sectionTitle}>Tier Guide</Text>
      {tiers.map(t => (
        <View key={t.name} style={[st.tierRow, tier.name === t.name && st.tierRowActive]}>
          <Ionicons name={TIER_ICONS[t.name] || "shield-outline"} size={22} color={t.color} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.tierRowName}>{t.name}</Text>
            <Text style={st.tierRowReq}>
              {t.minPoints === 0 ? "Starting tier" : `${t.minPoints.toLocaleString()}+ annual points`}
            </Text>
          </View>
          <Text style={[st.tierRowMult, { color: t.color }]}>{t.multiplier}x</Text>
        </View>
      ))}

      <View style={[S.divider, { marginTop: 20 }]} />

      {/* Transaction history */}
      <Text style={st.sectionTitle}>Recent Activity</Text>
      {(!rewards?.recentTransactions || rewards.recentTransactions.length === 0) ? (
        <Text style={st.emptyTx}>No reward activity yet. Place an order to start earning points!</Text>
      ) : (
        rewards.recentTransactions.map((tx, i) => (
          <View key={i} style={st.txRow}>
            <View style={[st.txIcon, { backgroundColor: tx.points > 0 ? C.green : C.red }]}>
              <Ionicons
                name={tx.points > 0 ? "add" : "remove"}
                size={16}
                color={tx.points > 0 ? C.greenLight : C.redLight}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.txDesc} numberOfLines={2}>{tx.description}</Text>
              <Text style={st.txDate}>{tx.createdAt?.slice(0, 10)}</Text>
            </View>
            <Text style={[st.txPoints, { color: tx.points > 0 ? C.greenLight : C.redLight }]}>
              {tx.points > 0 ? "+" : ""}{tx.points}
            </Text>
          </View>
        ))
      )}

      {rewards?.memberSince && (
        <Text style={st.memberSince}>Member since {rewards.memberSince.slice(0, 10)}</Text>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  guestTitle: { color: C.cream, fontSize: 20, ...FONT.bold, marginTop: 16 },
  guestDesc: { color: C.textDim, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },

  balanceCard: {
    backgroundColor: C.bg2,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 16,
  },
  tierName: { color: C.text, fontSize: 13, ...FONT.semi, marginTop: 8, textTransform: "uppercase", letterSpacing: 1 },
  pointsBalance: { color: C.cream, fontSize: 42, ...FONT.bold, marginTop: 4 },
  pointsLabel: { color: C.textDim, fontSize: 12, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  multiplierBadge: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  multiplierText: { fontSize: 12, ...FONT.semi },

  progressSection: { marginBottom: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { color: C.text, fontSize: 13, ...FONT.medium },
  progressPoints: { color: C.textDim, fontSize: 12 },
  progressBar: { height: 8, backgroundColor: C.bg3, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: C.bg2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  statNum: { color: C.burg, fontSize: 16, ...FONT.bold },
  statLabel: { color: C.textDim, fontSize: 9, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },

  spendRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  spendCard: {
    backgroundColor: C.bg2,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  spendLabel: { color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  spendValue: { color: C.cream, fontSize: 18, ...FONT.bold, marginTop: 4 },
  spendHint: { color: C.gold, fontSize: 10, marginTop: 6, ...FONT.medium },

  sectionTitle: { color: C.cream, fontSize: 16, ...FONT.bold, marginTop: 16, marginBottom: 10 },
  redeemInfo: { color: C.textDim, fontSize: 12, marginBottom: 10 },
  redeemRow: { flexDirection: "row", alignItems: "center" },
  redeemPreview: { color: C.gold, fontSize: 13, ...FONT.semi, marginTop: 8 },

  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  tierRowActive: { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  tierRowName: { color: C.cream, fontSize: 14, ...FONT.semi },
  tierRowReq: { color: C.textDim, fontSize: 11, marginTop: 2 },
  tierRowMult: { fontSize: 16, ...FONT.bold },

  emptyTx: { color: C.textDim, fontSize: 13, textAlign: "center", paddingVertical: 20 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txDesc: { color: C.text, fontSize: 13 },
  txDate: { color: C.textDim, fontSize: 11, marginTop: 2 },
  txPoints: { fontSize: 15, ...FONT.bold, minWidth: 50, textAlign: "right" },

  memberSince: { color: C.textDim + "80", fontSize: 11, textAlign: "center", marginTop: 20 },
});
