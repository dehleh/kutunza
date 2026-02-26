// mobile/src/context/Cart.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@kutunza_cart";
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  // ─── Load from storage ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCart(JSON.parse(raw));
      } catch { /* ignore */ }
      setReady(true);
    })();
  }, []);

  // ─── Persist on change ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart)).catch(() => {});
  }, [cart, ready]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const addToCart = useCallback((item) => {
    // item = { id, name, price, qty, bowlSize?, bowlMultiplier?, categoryId }
    setCart((prev) => {
      const key = item.bowlSize ? `${item.id}_${item.bowlSize}` : item.id;
      const idx = prev.findIndex(
        (c) => (c.bowlSize ? `${c.id}_${c.bowlSize}` : c.id) === key
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + (item.qty || 1) };
        return updated;
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id, bowlSize) => {
    setCart((prev) =>
      prev.filter((c) => {
        const key = c.bowlSize ? `${c.id}_${c.bowlSize}` : c.id;
        const target = bowlSize ? `${id}_${bowlSize}` : id;
        return key !== target;
      })
    );
  }, []);

  const updateQty = useCallback((id, bowlSize, qty) => {
    if (qty < 1) return removeFromCart(id, bowlSize);
    setCart((prev) =>
      prev.map((c) => {
        const key = c.bowlSize ? `${c.id}_${c.bowlSize}` : c.id;
        const target = bowlSize ? `${id}_${bowlSize}` : id;
        return key === target ? { ...c, qty } : c;
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const cartCount = useMemo(
    () => cart.reduce((s, c) => s + c.qty, 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (s, c) => s + c.price * (c.bowlMultiplier || 1) * c.qty,
        0
      ),
    [cart]
  );

  const value = {
    cart,
    cartCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
