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
  rice:     ["#b8942f", "#8a6a1a"],
  soups:    ["#8b2232", "#5a1a2a"],
  swallow:  ["#d4b86a", "#a08040"],
  protein:  ["#7a4a2a", "#5a3018"],
  pasta:    ["#c8a030", "#9a7a20"],
  sides:    ["#3a7a4a", "#1a4a2a"],
  fries:    ["#c47a20", "#8a5a10"],
  general:  ["#6a3a4a", "#4a2030"],
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
