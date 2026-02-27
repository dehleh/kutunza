// mobile/app.config.js
// Dynamic Expo config — reads env vars at build time

export default ({ config }) => ({
  ...config,
  name: "Kutunza Gourmet",
  slug: "kutunza-gourmet",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  scheme: "kutunza",
  icon: "./assets/icon.png",
  splash: {
    backgroundColor: "#1a0a0a",
    resizeMode: "contain",
  },
  ios: {
    bundleIdentifier: "com.kutunza.gourmet",
    supportsTablet: false,
    buildNumber: "1",
  },
  android: {
    package: "com.kutunza.gourmet",
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#1a0a0a",
    },
  },
  updates: {
    url: "https://u.expo.dev/your-project-id",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  plugins: ["expo-status-bar"],
  extra: {
    fbApiKey: process.env.EXPO_PUBLIC_FB_API_KEY || "",
    fbAuthDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN || "",
    fbProjectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID || "",
    fbStorageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET || "",
    fbMessagingSenderId: process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID || "",
    fbAppId: process.env.EXPO_PUBLIC_FB_APP_ID || "",
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "",
    paystackPublicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    eas: {
      projectId: "your-eas-project-id",
    },
  },
});
