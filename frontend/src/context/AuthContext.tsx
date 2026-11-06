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
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else {
        // Default session: Budi Santoso (Petugas Bed Management) as seen in Figma 164:3797
        const defaultUser = DEMO_USERS["budi.santoso"].account;
        const defaultToken = "mock-jwt-token-1-init";
        setUser(defaultUser);
        setToken(defaultToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
        localStorage.setItem(TOKEN_STORAGE_KEY, defaultToken);
      }
    } catch {
      // ignore JSON parse error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<UserAccount> => {
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
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const switchRole = (newRole: UserRole) => {
    let target = Object.values(DEMO_USERS).find((u) => u.account.role === newRole)?.account;
    if (!target) {
      target = DEMO_USERS["budi.santoso"].account;
    }
    setUser(target);
    const mockToken = `mock-jwt-token-${target.id_akun}-${Date.now()}`;
    setToken(mockToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(target));
    localStorage.setItem(TOKEN_STORAGE_KEY, mockToken);
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
