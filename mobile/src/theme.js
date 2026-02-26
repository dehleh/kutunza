// mobile/src/theme.js
// Centralised design tokens — colours, spacing, typography, shared styles

import { StyleSheet } from "react-native";

export const C = {
  bg:        "#1a0a0a",
  bg2:       "#2a1218",
  bg3:       "#3a1a22",
  burg:      "#5a1a2a",
  burgDark:  "#3a0e1a",
  burgDeep:  "#2a0a12",
  gold:      "#b8942f",
  goldLight: "#d4b86a",
  goldPale:  "#e8d5a0",
  cream:     "#f5e6c8",
  text:      "#ddd0c0",
  textDim:   "#8a7a6a",
  green:     "#1a4a2a",
  greenLight:"#4aaa6a",
  red:       "#4a1a1a",
  redLight:  "#ea6a6a",
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
    fontSize: 20,
    ...FONT.bold,
    marginBottom: 12,
  },
  // Form label
  label: {
    color: C.goldLight,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
    ...FONT.semi,
  },
  // Text input
  input: {
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.burg + "80",
    borderRadius: 8,
    color: C.cream,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  // Primary button (gold)
  btnGold: {
    backgroundColor: C.goldLight,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGoldText: {
    color: C.bg,
    fontSize: 13,
    ...FONT.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Secondary button (burgundy)
  btnBurg: {
    backgroundColor: C.burg,
    borderWidth: 1,
    borderColor: C.goldLight + "30",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBurgText: {
    color: C.goldLight,
    fontSize: 13,
    ...FONT.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Ghost button
  btnGhost: {
    borderWidth: 1,
    borderColor: C.burg + "60",
    borderRadius: 8,
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
    borderColor: C.burg + "30",
    borderRadius: 12,
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
    backgroundColor: C.burg + "30",
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
