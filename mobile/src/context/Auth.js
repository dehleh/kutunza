// mobile/src/context/Auth.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  auth,
  loginWithEmail,
  registerWithEmail,
  logout as fbLogout,
  resetPassword,
  onAuthChange,
} from "../firebase";
import { authAPI } from "../api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ─── Listener ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdTokenResult(true);
          setIsAdmin(!!token.claims.admin);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const cred = await loginWithEmail(email, password);
    return cred.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const cred = await registerWithEmail(email, password, name);
    // Create server-side profile
    try {
      await authAPI.createProfile({ name, email });
    } catch {
      /* non-blocking */
    }
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    await fbLogout();
    setIsAdmin(false);
  }, []);

  const forgot = useCallback((email) => resetPassword(email), []);

  // ─── Value ─────────────────────────────────────────────────────────────────
  const value = {
    user,
    loading,
    isAdmin,
    login,
    register,
    logout,
    forgot,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
