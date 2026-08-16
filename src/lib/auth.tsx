"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { appUsers } from "@/lib/mock-data";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (role: Role) => void;
  logout: () => void;
  dashboardPath: (role: Role) => string;
}

const STORAGE_KEY = "tt-demo-session";

export const dashboardPathForRole: Record<Role, string> = {
  PLAYER: "/player/dashboard",
  CLUB: "/club/dashboard",
  HOST: "/host/dashboard",
  ADMIN: "/admin/dashboard",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (role: Role) => {
    const matched = appUsers.find((u) => u.role === role) ?? appUsers[0];
    const session: SessionUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, dashboardPath: (role) => dashboardPathForRole[role] }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== role) {
      router.replace(`/login?next=${dashboardPathForRole[role]}`);
    }
  }, [isLoading, user, role, router]);

  if (isLoading) {
    return <div className="flex-1" />;
  }

  if (user?.role !== role) {
    return null;
  }

  return <>{children}</>;
}
