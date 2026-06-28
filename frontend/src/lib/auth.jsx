import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api, getStoredToken, setStoredToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const user = await api("/auth/me", { token });
        if (active) {
          setUser(user);
        }
      } catch {
        if (active) {
          setToken(null);
          setStoredToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(payload) {
    const data = await api("/auth/login", { method: "POST", body: payload, token: null });
    setToken(data.token);
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    return api("/auth/register", {
      method: "POST",
      body: payload,
      token: null,
    });
  }

  function logout() {
    setToken(null);
    setStoredToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, booting, login, register, logout }),
    [token, user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
