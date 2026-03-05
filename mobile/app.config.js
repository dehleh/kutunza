// mobile/app.config.js
// Dynamic Expo config — reads env vars at build time

export default ({ config }) => ({
  ...config,
  name: "Kutunza Gourmet",
  slug: "kutunza-gourmet",
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
    url: "https://u.expo.dev/your-project-id",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
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
  ],
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
      projectId: "ffb82c5e-0b3f-44f2-b27d-0083795dfbb0",
    },
  },
});
