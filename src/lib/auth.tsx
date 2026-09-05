"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { appUsers } from "@/lib/mock-data";

export interface SessionUser {
  id: string;
  /** Login handle — unique across all accounts. */
  uniqueId: string;
  /** Display name for the dashboard. Not unique. */
  name: string;
  role: Role;
  email?: string;
  /** The seed player/club this account previews as, when it is a demo login. */
  linkedId?: string | null;
}

interface Account {
  uniqueId: string;
  name: string;
  password: string;
  role: Role;
  email?: string;
  linkedId?: string | null;
  /** Seed accounts reuse the demo AppUser id so membership records line up. */
  id?: string;
  createdAt: string;
}

export type AuthResult = { ok: true; role: Role } | { ok: false; error: string };

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  /** Quick, credential-free demo preview of a portal. */
  login: (role: Role) => void;
  /** Create an account (unique ID + name + password) and sign in. */
  register: (input: {
    uniqueId: string;
    name: string;
    password: string;
    role: Role;
    email?: string;
  }) => AuthResult;
  /** Sign in with a unique ID and password. */
  signIn: (input: { uniqueId: string; password: string }) => AuthResult;
  logout: () => void;
  dashboardPath: (role: Role) => string;
}

const SESSION_KEY = "tt-demo-session";
const ACCOUNTS_KEY = "tt-demo-accounts";

export const dashboardPathForRole: Record<Role, string> = {
  PLAYER: "/player/dashboard",
  CLUB: "/club/dashboard",
  HOST: "/host/dashboard",
  ADMIN: "/admin/dashboard",
};

/** Built-in logins so every portal is reachable out of the box. */
export const SEED_ACCOUNTS: readonly Account[] = [
  { uniqueId: "player", id: "u-1", name: "Arjun Sharma", password: "player", role: "PLAYER", email: "arjun@apexttc.in", linkedId: "p-1", createdAt: "" },
  { uniqueId: "club", id: "u-2", name: "Apex TTC Admin", password: "club", role: "CLUB", email: "contact@apexttc.in", linkedId: "club-apex", createdAt: "" },
  { uniqueId: "host", id: "u-3", name: "Karnataka TTA Ops", password: "host", role: "HOST", email: "ops@ktta.in", linkedId: null, createdAt: "" },
  { uniqueId: "admin", id: "u-4", name: "Platform Admin", password: "admin", role: "ADMIN", email: "admin@ttmanagement.app", linkedId: null, createdAt: "" },
];

const norm = (s: string) => s.trim().toLowerCase();

function readAccounts(): Account[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sessionFromAccount(a: Account): SessionUser {
  return {
    id: a.id ?? `acc-${norm(a.uniqueId)}`,
    uniqueId: a.uniqueId,
    name: a.name,
    role: a.role,
    email: a.email,
    linkedId: a.linkedId ?? null,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((session: SessionUser) => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const login = useCallback(
    (role: Role) => {
      const seed = SEED_ACCOUNTS.find((a) => a.role === role);
      if (seed) {
        persist(sessionFromAccount(seed));
        return;
      }
      const matched = appUsers.find((u) => u.role === role) ?? appUsers[0];
      persist({ id: matched.id, uniqueId: matched.id, name: matched.name, email: matched.email, role });
    },
    [persist],
  );

  const register = useCallback<AuthContextValue["register"]>(
    ({ uniqueId, name, password, role, email }) => {
      const uid = uniqueId.trim();
      if (!uid || !name.trim() || !password) {
        return { ok: false, error: "Enter a unique ID, name and password." };
      }
      const taken =
        SEED_ACCOUNTS.some((a) => norm(a.uniqueId) === norm(uid)) ||
        readAccounts().some((a) => norm(a.uniqueId) === norm(uid));
      if (taken) return { ok: false, error: "That unique ID is already taken — pick another." };

      const account: Account = {
        uniqueId: uid,
        name: name.trim(),
        password,
        role,
        email: email?.trim() || undefined,
        linkedId: null,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...readAccounts(), account]));
      persist(sessionFromAccount(account));
      return { ok: true, role };
    },
    [persist],
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    ({ uniqueId, password }) => {
      const uid = uniqueId.trim();
      if (!uid || !password) return { ok: false, error: "Enter your unique ID and password." };
      const account =
        readAccounts().find((a) => norm(a.uniqueId) === norm(uid)) ??
        SEED_ACCOUNTS.find((a) => norm(a.uniqueId) === norm(uid));
      if (!account || account.password !== password) {
        return { ok: false, error: "Unknown unique ID or wrong password." };
      }
      persist(sessionFromAccount(account));
      return { ok: true, role: account.role };
    },
    [persist],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        signIn,
        logout,
        dashboardPath: (role) => dashboardPathForRole[role],
      }}
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
