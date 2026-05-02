// mobile/app.config.js
// Dynamic Expo config — reads env vars at build time

export default ({ config }) => ({
  ...config,
  name: "Kutunza Gourmet",
  slug: "kutunza-gourmet",
  owner: "kutunzas-organization",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "kutunza",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.jpg",
    backgroundColor: "#FFFFFF",
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
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  updates: {
    url: "https://u.expo.dev/ffb82c5e-0b3f-44f2-b27d-0083795dfbb0",
  },
  runtimeVersion: "1.0.0",
  plugins: [
    "expo-asset",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/icon.png",
        imageWidth: 200,
        backgroundColor: "#FFFFFF",
      },
    ],
    "./plugins/withAndroidVerificationFile.js",
  ],
  extra: {
    fbApiKey: process.env.EXPO_PUBLIC_FB_API_KEY || "AIzaSyAdHiBfpB2ytaq1oXc9Ck_TmXpaLRyUiaQ",
    fbAuthDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN || "kutunza-5e77b.firebaseapp.com",
    fbProjectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID || "kutunza-5e77b",
    fbStorageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET || "kutunza-5e77b.firebasestorage.app",
    fbMessagingSenderId: process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID || "210838226764",
    fbAppId: process.env.EXPO_PUBLIC_FB_APP_ID || "1:210838226764:web:7d07831362550c2286b1e9",
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://kutunza-backend-production.up.railway.app/api",
    paystackPublicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    eas: {
      projectId: "ffb82c5e-0b3f-44f2-b27d-0083795dfbb0",
    },
  },
});
