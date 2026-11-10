"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserAccount, UserRole } from "@/types";
import { DEMO_USERS } from "@/lib/mock-fallback";
import {
  loginApi,
  isStrictBackendMode,
  setStrictBackendMode,
} from "@/lib/api-client";

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isLoading: boolean;
  dataSource: "backend" | "mock";
  isStrictBackend: boolean;
  setStrictBackend: (enabled: boolean) => void;
  login: (username: string, pass: string) => Promise<UserAccount>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "rsi_inpatient_user";
const TOKEN_STORAGE_KEY = "rsi_inpatient_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"backend" | "mock">("backend");
  const [isStrict, setIsStrict] = useState<boolean>(true);

  // Sync strict state reactively
  useEffect(() => {
    setIsStrict(isStrictBackendMode());
    const handleStrictChange = () => {
      setIsStrict(isStrictBackendMode());
    };
    window.addEventListener("rsi_strict_mode_changed", handleStrictChange);
    return () => {
      window.removeEventListener("rsi_strict_mode_changed", handleStrictChange);
    };
  }, []);

  const handleSetStrict = (enabled: boolean) => {
    setStrictBackendMode(enabled);
    setIsStrict(enabled);
  };

  useEffect(() => {
    async function initAuth() {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const strict = isStrictBackendMode();

        // If valid backend token exists
        if (storedUser && storedToken && !storedToken.startsWith("mock-")) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setDataSource("backend");
          return;
        }

        // In Strict Backend Mode: do not auto-login with fake mock credentials!
        // Instead, attempt automatic backend login with real credentials
        if (strict) {
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          const targetUsername = parsedUser?.username || "budi.santoso";
          try {
            const result = await loginApi(targetUsername, "password123");
            setUser(result.user);
            setToken(result.token);
            setDataSource("backend");
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
            localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
            return;
          } catch {
            setUser(null);
            setToken(null);
            setDataSource("backend");
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            return;
          }
        }

        // Only in Mock Mode (offline prototype): fallback to local demo user
        const parsedUser: UserAccount = storedUser
          ? JSON.parse(storedUser)
          : DEMO_USERS["budi.santoso"].account;
        const defaultToken = storedToken || "mock-jwt-token-1-init";
        setUser(parsedUser);
        setToken(defaultToken);
        setDataSource("mock");
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsedUser));
        localStorage.setItem(TOKEN_STORAGE_KEY, defaultToken);
      } catch {
        // ignore JSON parse error
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
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
      setDataSource(result.source);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setDataSource("backend");
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const switchRole = async (newRole: UserRole) => {
    let target = Object.values(DEMO_USERS).find(
      (u) => u.account.role === newRole
    )?.account;
    if (!target) {
      target = DEMO_USERS["budi.santoso"].account;
    }

    try {
      const result = await loginApi(target.username, "password123");
      setUser(result.user);
      setToken(result.token);
      setDataSource(result.source);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    } catch (err: unknown) {
      if (isStrictBackendMode()) {
        throw err;
      }
      setUser(target);
      const mockToken = `mock-jwt-token-${target.id_akun}-${Date.now()}`;
      setToken(mockToken);
      setDataSource("mock");
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(target));
      localStorage.setItem(TOKEN_STORAGE_KEY, mockToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        dataSource,
        isStrictBackend: isStrict,
        setStrictBackend: handleSetStrict,
        login,
        logout,
        switchRole,
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
