// mobile/src/navigation/index.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../theme";
import { useCart } from "../context/Cart";

// ─── Screens ─────────────────────────────────────────────────────────────────
import MenuScreen from "../screens/Menu";
import CartScreen from "../screens/Cart";
import CheckoutScreen from "../screens/Checkout";
import OrdersScreen from "../screens/Orders";
import OrderDetailScreen from "../screens/OrderDetail";
import EventsScreen from "../screens/Events";
import AuthScreen from "../screens/Auth";
import ProfileScreen from "../screens/Profile";
import RewardsScreen from "../screens/Rewards";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Shared stack header style ───────────────────────────────────────────────
const screenOpts = {
  headerStyle: { backgroundColor: C.bg },
  headerTintColor: C.burg,
  headerTitleStyle: { fontWeight: "600", fontSize: 16, color: C.cream },
  contentStyle: { backgroundColor: C.bg },
  headerShadowVisible: false,
};

// ─── Per-tab stacks ──────────────────────────────────────────────────────────
function MenuStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="MenuHome" component={MenuScreen} options={{ title: "Menu" }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="CartHome" component={CartScreen} options={{ title: "Cart" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="OrdersHome" component={OrdersScreen} options={{ title: "My Orders" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order Details" }} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="EventsHome" component={EventsScreen} options={{ title: "Book an Event" }} />
    </Stack.Navigator>
  );
}

function RewardsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="RewardsHome" component={RewardsScreen} options={{ title: "Rewards" }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Sign In" }} />
    </Stack.Navigator>
  );
}

// ─── Cart badge ──────────────────────────────────────────────────────────────
function CartBadge() {
  const { cartCount } = useCart();
  if (!cartCount) return null;
  return (
    <View style={bs.badge}>
      <Text style={bs.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
    </View>
  );
}

const bs = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: C.burg,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

// ─── Tab icons ───────────────────────────────────────────────────────────────
const icons = {
  Menu: "restaurant-outline",
  Events: "calendar-outline",
  Cart: "cart-outline",
  Rewards: "gift-outline",
  Orders: "receipt-outline",
  Profile: "person-outline",
};

// ─── Root navigator ──────────────────────────────────────────────────────────
export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <View>
            <Ionicons name={icons[route.name]} size={size} color={color} />
            {route.name === "Cart" && <CartBadge />}
          </View>
        ),
        tabBarActiveTintColor: C.burg,
        tabBarInactiveTintColor: C.textDim,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 58,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      })}
    >
      <Tab.Screen name="Menu" component={MenuStack} />
      <Tab.Screen name="Events" component={EventsStack} />
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Rewards" component={RewardsStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
