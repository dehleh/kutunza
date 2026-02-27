// mobile/src/assets/images.js
// Category-level hero images & per-item image mappings.
//
// In production, each menu item can have an `imageUrl` field in Firestore.
// These local mappings serve as fallbacks when no remote URL is set.
//
// To add your own photos:
//   1. Place .jpg files in mobile/assets/food/  (e.g. jollof.jpg)
//   2. Map them below:  "r3": require("../../assets/food/jollof.jpg")
//   3. MenuCard will automatically show the image.

// ─── Category accent colours (gradient pairs) ───────────────────────────────
export const CAT_COLORS = {
  rice:     ["#D4A937", "#B8942F"],
  soups:    ["#8B2232", "#6B2037"],
  swallow:  ["#C9A84C", "#A08040"],
  protein:  ["#8A5A3A", "#6B4020"],
  pasta:    ["#C8A030", "#A08020"],
  sides:    ["#2E8B4A", "#1A6A3A"],
  fries:    ["#D48A30", "#B07020"],
  general:  ["#7A4A5A", "#5A3040"],
};

// ─── Category hero emoji (shown when no image) ──────────────────────────────
export const CAT_EMOJI = {
  rice: "🍛",
  soups: "🍲",
  swallow: "⚪",
  protein: "🥩",
  pasta: "🍝",
  sides: "🌽",
  fries: "🍟",
  general: "🍳",
};

// ─── Per-item local image overrides ──────────────────────────────────────────
// Uncomment and add require() calls for local assets:
//
// export const ITEM_IMAGES = {
//   r3: require("../../assets/food/jollof.jpg"),
//   p11: require("../../assets/food/crab.jpg"),
//   s6: require("../../assets/food/ofada_sauce.jpg"),
// };
export const ITEM_IMAGES = {};
