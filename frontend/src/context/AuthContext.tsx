"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserAccount } from "@/types";
import {
  fetchCurrentUserApi,
  getStoredToken,
  loginApi,
  logoutApi,
} from "@/lib/api-client";

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<UserAccount>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "rsi_inpatient_user";
const TOKEN_STORAGE_KEY = "rsi_inpatient_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        const storedToken = getStoredToken();
        if (!storedToken) {
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          if (!cancelled) {
            setUser(null);
            setToken(null);
          }
          return;
        }

        // Verify stored JWT against backend so expired/revoked sessions are rejected.
        const verifiedUser = await fetchCurrentUserApi(storedToken);
        if (!cancelled) {
          setUser(verifiedUser);
          setToken(storedToken);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
        }
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("rsi_auth_expired", handleExpired);
    return () => {
      cancelled = true;
      window.removeEventListener("rsi_auth_expired", handleExpired);
    };
  }, []);

  const login = async (
    username: string,
    pass: string
  ): Promise<UserAccount> => {
    setIsLoading(true);
    try {
      const result = await loginApi(username, pass);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const activeToken = getStoredToken();
    logoutApi(activeToken);
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
