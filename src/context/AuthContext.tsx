"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export type UserRole = "buyer" | "vendor" | "admin";
export type VendorStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  shopName?: string;
  shopBio?: string;
  status?: VendorStatus;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  shopName?: string;
  shopBio?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (
    dataOrName: RegisterData | string,
    email?: string,
    pass?: string,
    phone?: string
  ) => Promise<{ success: boolean; user?: User; message?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isVendor: boolean;
  isBuyer: boolean;
  isVendorApproved: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "cozy_crochet_auth_user";
const TOKEN_STORAGE_KEY = "cozy_crochet_auth_token";

const DEFAULT_STUDIO_ADMIN: User = {
  id: "usr-admin-arbab",
  name: "AJ (Studio Maker)",
  email: "arbabjabeen2006@gmail.com",
  role: "admin",
  status: "approved",
  phone: "+92 320 7309867",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to null so customer sees clean storefront and blank checkout fields
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const lowerEmail = parsed.email?.toLowerCase().trim();
        if (lowerEmail === "arbabjabeen2006@gmail.com") {
          parsed.role = "admin";
          parsed.name = "AJ (Studio Maker)";
        }
        setUser(parsed);
      }
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        setToken(savedToken);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, initialized]);

  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token, initialized]);

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: user.email, password: "password123" }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated: User = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          status: data.status,
          shopName: data.shopName,
          shopBio: data.shopBio,
          phone: data.phone,
        };
        setUser(updated);
      }
    } catch {
      // ignore
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password: pass }),
      });

      const data = await res.json();

      if (res.ok) {
        const lowerEmail = data.email?.toLowerCase().trim();
        const isMasterAdminEmail = lowerEmail === "arbabjabeen2006@gmail.com";
        const role: UserRole = isMasterAdminEmail ? "admin" : (data.role as UserRole || "buyer");
        const loggedInUser: User = {
          id: data._id,
          name: isMasterAdminEmail ? "AJ (Studio Maker)" : data.name,
          email: data.email,
          role,
          status: "approved",
          phone: data.phone || (isMasterAdminEmail ? "+92 320 7309867" : ""),
        };

        setUser(loggedInUser);
        setToken(data.token || `jwt-${Date.now()}`);
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
        }
        toast.success(`Welcome back, ${loggedInUser.name}!`);
        return { success: true, user: loggedInUser };
      }

      toast.error(data.message || "Login failed");
      return { success: false, message: data.message };
    } catch (err: any) {
      toast.error("Network error during login");
      return { success: false, message: err?.message || "Network error" };
    }
  };

  const register = async (
    dataOrName: RegisterData | string,
    email?: string,
    pass?: string,
    phone?: string
  ): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const payload = typeof dataOrName === "object"
        ? dataOrName
        : {
            name: dataOrName,
            email: email || "",
            password: pass || "",
            phone: phone || "",
            role: "buyer" as UserRole,
          };

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name: payload.name,
          email: payload.email,
          password: payload.password,
          phone: payload.phone,
          role: payload.role || "buyer",
          shopName: payload.shopName,
          shopBio: payload.shopBio,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const registeredUser: User = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          status: data.status,
          shopName: data.shopName,
          shopBio: data.shopBio,
          phone: data.phone,
        };

        setUser(registeredUser);
        setToken(data.token);

        toast.success(`Welcome to The Cozy Crochet, ${registeredUser.name}!`);

        return { success: true, user: registeredUser };
      }

      toast.error(data.message || "Registration failed");
      return { success: false, message: data.message };
    } catch (err: any) {
      toast.error("Network error during registration");
      return { success: false, message: err?.message || "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    toast.info("Signed out successfully");
  };

  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor";
  const isBuyer = !user || user?.role === "buyer" || (user?.role as any) === "customer";
  const isVendorApproved = isVendor && user?.status === "approved";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initialized,
        login,
        register,
        logout,
        isAdmin,
        isVendor,
        isBuyer,
        isVendorApproved,
        refreshUser,
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
