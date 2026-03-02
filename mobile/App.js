// mobile/App.js
import React, { useCallback } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { AuthProvider } from "./src/context/Auth";
import { CartProvider } from "./src/context/Cart";
import RootNavigator from "./src/navigation";
import { C } from "./src/theme";

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: C.burg,
    background: C.bg,
    card: C.bg,
    text: C.cream,
    border: C.border,
    notification: C.burg,
  },
};

// M9 — Deep linking configuration
const linking = {
  prefixes: [Linking.createURL("/"), "kutunza://"],
  config: {
    screens: {
      Main: {
        screens: {
          OrdersTab: { screens: { OrdersHome: "orders" } },
          MenuTab: { screens: { MenuHome: "menu" } },
          CartTab: { screens: { CartHome: "cart", Checkout: "checkout" } },
          ProfileTab: { screens: { ProfileHome: "profile" } },
        },
      },
    },
  },
};

export default function App() {
  const onLayoutRootView = useCallback(async () => {
    // Hide splash once the root view has rendered
    await SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer theme={navTheme} linking={linking}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
