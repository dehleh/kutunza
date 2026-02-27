// mobile/src/theme.js
// Centralised design tokens — light, sleek theme with gold & burgundy accents

import { StyleSheet } from "react-native";

export const C = {
  // ─── Backgrounds (light) ──────────────────────────────────────────────
  bg:        "#FFFFFF",       // main background — white
  bg2:       "#F6F6F8",       // card / section background — very light grey
  bg3:       "#EEEEF2",       // input / well background

  // ─── Brand ────────────────────────────────────────────────────────────
  burg:      "#6B2037",       // burgundy primary
  burgDark:  "#4A1426",
  burgDeep:  "#370E1C",
  gold:      "#B8942F",       // gold accent
  goldLight: "#D4B86A",
  goldPale:  "#F5ECD4",

  // ─── Text ─────────────────────────────────────────────────────────────
  cream:     "#1E1E24",       // primary text — near-black
  text:      "#3A3A44",       // secondary text — dark grey
  textDim:   "#8E8E9A",       // muted / caption

  // ─── Semantic ─────────────────────────────────────────────────────────
  green:     "#D5F5E3",
  greenLight:"#28A745",
  red:       "#FDE8E8",
  redLight:  "#E04848",

  // ─── Misc ─────────────────────────────────────────────────────────────
  border:    "#E4E4EA",       // subtle borders
  shadow:    "#00000010",     // card shadows
};

export const FONT = {
  regular: { fontWeight: "400" },
  medium:  { fontWeight: "500" },
  semi:    { fontWeight: "600" },
  bold:    { fontWeight: "700" },
};

export const fmt = (n) => "₦" + Number(n).toLocaleString();

// Common reusable styles
export const S = StyleSheet.create({
  // Full-screen container
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  // Section title
  sectionTitle: {
    color: C.cream,
    fontSize: 18,
    ...FONT.bold,
    marginBottom: 12,
  },
  // Form label
  label: {
    color: C.text,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
    ...FONT.semi,
  },
  // Text input
  input: {
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    color: C.cream,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  // Primary button (gold)
  btnGold: {
    backgroundColor: C.burg,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGoldText: {
    color: "#fff",
    fontSize: 13,
    ...FONT.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Secondary button (outline)
  btnBurg: {
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.burg,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBurgText: {
    color: C.burg,
    fontSize: 13,
    ...FONT.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Ghost button
  btnGhost: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: {
    color: C.text,
    fontSize: 13,
    ...FONT.semi,
  },
  // Card container
  card: {
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
  },
  // Centered empty state
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    color: C.textDim,
    fontSize: 14,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  // Row helpers
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
