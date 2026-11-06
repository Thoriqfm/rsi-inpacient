"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserAccount, UserRole } from "@/types";
import { DEMO_USERS } from "@/lib/mock-fallback";
import { loginApi } from "@/lib/api-client";

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isLoading: boolean;
  dataSource: "backend" | "mock";
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
  const [dataSource, setDataSource] = useState<"backend" | "mock">("mock");

  useEffect(() => {
    async function initAuth() {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (storedUser && storedToken && !storedToken.startsWith("mock-")) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setDataSource("backend");
          return;
        }

        // Attempt silent login to live backend if available
        const parsedUser: UserAccount = storedUser
          ? JSON.parse(storedUser)
          : DEMO_USERS["budi.santoso"].account;
        const targetUsername = parsedUser.username || "budi.santoso";

        try {
          const result = await loginApi(targetUsername, "password123");
          setUser(result.user);
          setToken(result.token);
          setDataSource(result.source);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
          localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
          return;
        } catch {
          // Fallback to mock session
        }

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
    setDataSource("mock");
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
    } catch {
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
