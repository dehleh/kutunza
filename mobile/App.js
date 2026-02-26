// mobile/App.js
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/Auth";
import { CartProvider } from "./src/context/Cart";
import RootNavigator from "./src/navigation";
import { C } from "./src/theme";

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: C.gold,
    background: C.bg,
    card: C.bg2,
    text: C.cream,
    border: C.burg + "40",
    notification: C.gold,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
