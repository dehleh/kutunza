// mobile/src/data.js
// Static catalogue data — mirrors frontend/src/constants.js

// ─── Bowl Sizes ──────────────────────────────────────────────────────────────
export const BOWL_SIZES = [
  { id: "single", label: "Single Portion", desc: "~1 person",  multiplier: 1 },
  { id: "3L",     label: "3 L Bowl",       desc: "~3 people",  multiplier: 4 },
  { id: "5L",     label: "5 L Bowl",       desc: "~5 people",  multiplier: 6 },
  { id: "10L",    label: "10 L Bowl",      desc: "~10 people", multiplier: 11 },
  { id: "15L",    label: "15 L Bowl",      desc: "~15 people", multiplier: 16 },
  { id: "20L",    label: "20 L Bowl",      desc: "~20 people", multiplier: 20 },
];

export const BOWL_ELIGIBLE = ["rice", "soups", "swallow", "pasta", "general"];

// ─── Default Menu ────────────────────────────────────────────────────────────
export const DEFAULT_MENU = [
  {
    id: "rice", label: "Rice", icon: "🍛",
    items: [
      { id: "r1", name: "Ofada Kutunza & Sauce", price: 5500, desc: "Traditional ofada rice with rich ayamase sauce", active: true },
      { id: "r2", name: "Fried Rice", price: 2000, desc: "Fragrant fried rice with mixed vegetables", active: true },
      { id: "r3", name: "Jollof Rice", price: 2000, desc: "Signature smoky party jollof rice", active: true },
      { id: "r4", name: "Chinese Rice", price: 2000, desc: "Stir-fried rice with Asian-inspired seasonings", active: true },
      { id: "r5", name: "White Rice & Sauce", price: 3000, desc: "Steamed white rice with rich tomato stew", active: true },
      { id: "r6", name: "Native Rice", price: 2500, desc: "Locally prepared native rice with palm oil base", active: true },
      { id: "r7", name: "Coconut Rice", price: 2500, desc: "Rice slow-cooked in fresh coconut milk", active: true },
      { id: "r8", name: "Basmati Specials", price: 4000, desc: "Premium long-grain basmati rice, royally seasoned", active: true },
      { id: "r9", name: "Rice Sticks", price: 2500, desc: "Wok-fried rice noodles in umami broth", active: true },
    ],
  },
  {
    id: "soups", label: "Soups", icon: "🍲",
    items: [
      { id: "s1",  name: "Efo-Riro", price: 2000, desc: "Rich Yoruba spinach soup with assorted meat", active: true },
      { id: "s2",  name: "Oha Soup", price: 2000, desc: "Delicate oha leaf soup with cocoyam thickener", active: true },
      { id: "s3",  name: "Banga", price: 2000, desc: "Palm nut cream soup with spice perfection", active: true },
      { id: "s4",  name: "Egusi", price: 2000, desc: "Melon seed soup with bitter leaf, slow-cooked", active: true },
      { id: "s5",  name: "Seafood Okro", price: 2000, desc: "Draw soup loaded with fresh seafood", active: true },
      { id: "s6",  name: "Ofada Sauce", price: 3000, desc: "Authentic green pepper ayamase sauce", active: true },
      { id: "s7",  name: "Stew", price: 2000, desc: "Slow-simmered tomato stew, deeply flavoured", active: true },
      { id: "s8",  name: "Omi Obe", price: 1500, desc: "Light peppery soup base", active: true },
      { id: "s9",  name: "Afang", price: 2000, desc: "Calabar classic with wild spinach & waterleaf", active: true },
      { id: "s10", name: "Groundnut Soup", price: 3000, desc: "Nutty rich soup with a Northern heritage", active: true },
      { id: "s11", name: "Ogbono", price: 2000, desc: "Silky draw soup with ogbono seeds", active: true },
      { id: "s12", name: "Catfish Pepper Soup", price: 8000, desc: "Hot pepper broth with fresh catfish", active: true },
      { id: "s13", name: "Goat Meat Pepper Soup", price: 8000, desc: "Spiced pepper broth with tender goat meat", active: true },
    ],
  },
  {
    id: "swallow", label: "Swallow", icon: "⚪",
    items: [
      { id: "sw1", name: "Poundo", price: 1000, desc: "Smooth pounded yam flour", active: true },
      { id: "sw2", name: "Garri (Eba)", price: 700, desc: "Classic garri eba, smooth & firm", active: true },
      { id: "sw3", name: "Oat Swallow", price: 1000, desc: "Healthy oat-based swallow", active: true },
      { id: "sw4", name: "Semo", price: 700, desc: "Smooth semolina swallow", active: true },
      { id: "sw5", name: "Amala", price: 1000, desc: "Authentic yam flour amala", active: true },
    ],
  },
  {
    id: "protein", label: "Protein", icon: "🥩",
    items: [
      { id: "p1",  name: "Chicken", price: 4000, desc: "Seasoned & grilled/fried to order", active: true },
      { id: "p2",  name: "Beef", price: 2000, desc: "Tender slow-cooked beef cuts", active: true },
      { id: "p3",  name: "Goat Meat", price: 4000, desc: "Premium goat cuts, well-seasoned", active: true },
      { id: "p4",  name: "Ram Meat", price: 4000, desc: "Tender ram portions", active: true },
      { id: "p5",  name: "Turkey", price: 8000, desc: "Whole seasoned turkey pieces", active: true },
      { id: "p6",  name: "Croaker Fish", price: 3000, desc: "Fresh Atlantic croaker, grilled or fried", active: true },
      { id: "p7",  name: "Titus Fish", price: 3000, desc: "Mackerel titus, seasoned & prepared", active: true },
      { id: "p8",  name: "Hake Fish", price: 3000, desc: "White hake fillet", active: true },
      { id: "p9",  name: "Panla Fish", price: 3000, desc: "Dried stockfish, rehydrated & seasoned", active: true },
      { id: "p10", name: "Herring (Shawa)", price: 1500, desc: "Smoked herring, rich flavour", active: true },
      { id: "p11", name: "Crab", price: 1500, desc: "Fresh crab portions", active: true },
      { id: "p12", name: "Tiger Prawns", price: 1500, desc: "Succulent tiger prawns", active: true },
      { id: "p13", name: "Assorted Meat", price: 3000, desc: "Mixed meat cuts medley", active: true },
      { id: "p14", name: "Gizzard", price: 3000, desc: "Perfectly peppered gizzard", active: true },
      { id: "p15", name: "Catfish", price: 3000, desc: "Fresh catfish, prepared to order", active: true },
    ],
  },
  {
    id: "pasta", label: "Pasta", icon: "🍝",
    items: [
      { id: "pa1", name: "White Pasta & Sauce", price: 5000, desc: "Al dente pasta in rich tomato meat sauce", active: true },
      { id: "pa2", name: "Jollof Pasta", price: 5000, desc: "Pasta cooked jollof-style in spiced tomato base", active: true },
      { id: "pa3", name: "Chinese Pasta", price: 5500, desc: "Stir-fried pasta with Asian-fusion seasonings", active: true },
      { id: "pa4", name: "Macaroni Pasta", price: 5500, desc: "Elbow macaroni in béchamel & tomato sauce", active: true },
      { id: "pa5", name: "French Pasta", price: 5500, desc: "Continental-style pasta with creamy herb sauce", active: true },
    ],
  },
  {
    id: "sides", label: "Sides", icon: "🌽",
    items: [
      { id: "si1", name: "Plantain", price: 500, desc: "Fried sweet plantain (dodo)", active: true },
      { id: "si2", name: "Beans", price: 1000, desc: "Seasoned honey beans", active: true },
      { id: "si3", name: "Coleslaw", price: 1000, desc: "Creamy fresh coleslaw", active: true },
      { id: "si4", name: "Salad", price: 1000, desc: "Garden salad with dressing", active: true },
      { id: "si5", name: "Sweetcorn", price: 500, desc: "Steamed corn kernels", active: true },
      { id: "si6", name: "Stick Meat", price: 2000, desc: "Peppered stick meat skewers", active: true },
      { id: "si7", name: "Stick Gizzard", price: 2000, desc: "Peppered gizzard skewers", active: true },
    ],
  },
  {
    id: "fries", label: "Fries & Chips", icon: "🍟",
    items: [
      { id: "f1", name: "Sweet Potato Chips", price: 2000, desc: "Crispy sweet potato chips", active: true },
      { id: "f2", name: "Irish Potato Chips", price: 2000, desc: "Classic golden fries", active: true },
      { id: "f3", name: "Yam Chips", price: 2000, desc: "Traditional fried yam strips", active: true },
      { id: "f4", name: "Plantain Chips", price: 2000, desc: "Crispy fried plantain chips", active: true },
      { id: "f5", name: "Small Chops", price: 5000, desc: "Mixed platter: puff puff, spring rolls, samosa", active: true },
    ],
  },
  {
    id: "general", label: "General", icon: "🍳",
    items: [
      { id: "g1", name: "Ewa Agoyin & Sauce", price: 3000, desc: "Soft-cooked beans with spiced pepper sauce", active: true },
      { id: "g2", name: "Yam & Egg Sauce", price: 4000, desc: "Boiled yam with peppered egg stew", active: true },
      { id: "g3", name: "Yam & Fish Sauce", price: 4000, desc: "Boiled yam with smoked fish stew", active: true },
      { id: "g4", name: "Yam & Chicken Sauce", price: 4000, desc: "Boiled yam with spiced chicken stew", active: true },
    ],
  },
];

// ─── Event Types ──────────────────────────────────────────────────────────────
export const EVENT_TYPES = [
  "Corporate Dinner",
  "Wedding Reception",
  "Birthday Celebration",
  "Product Launch",
  "Private Gathering",
  "Board Meeting",
  "Anniversary Dinner",
  "Baby Shower / Naming Ceremony",
  "Graduation Party",
  "Festival & Cultural Event",
];

export const MENU_SUGGESTIONS = {
  low: {
    label: "Classic Elegance (₦500k – ₦1.5M)",
    items: [
      "Jollof Rice",
      "Pepper Soup",
      "Fried Rice & Chicken",
      "Small Chops",
      "Zobo & Fruit Punch",
    ],
  },
  mid: {
    label: "Regal Experience (₦1.5M – ₦5M)",
    items: [
      "Ofada Kutunza Station",
      "Seafood Okro Soup",
      "Goat Meat Pepper Soup",
      "Basmati Specials",
      "Small Chops Platter",
      "Open Bar Setup",
    ],
  },
  high: {
    label: "King's Table (₦5M+)",
    items: [
      "Live Cooking Stations",
      "7-Course Tasting Menu",
      "All Protein Options",
      "Full Soup & Swallow Bar",
      "Dessert Station",
      "Champagne Toast",
      "Personal Chef Tableside Service",
    ],
  },
};

export const DELIVERY_FEE_DEFAULT = 1500;
