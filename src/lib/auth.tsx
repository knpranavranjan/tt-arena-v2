"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { appUsers } from "@/lib/mock-data";
import { USE_DB, apiSend } from "@/lib/data-backend";

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

export type AuthResult =
  | { ok: true; role: Role; uniqueId: string }
  | { ok: false; error: string };

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  /** Quick, credential-free demo preview of a portal. */
  login: (role: Role) => void;
  /** Create an account. The SPINID is issued by the system, not chosen. */
  register: (input: {
    name: string;
    password: string;
    role: Role;
    email: string;
  }) => Promise<AuthResult>;
  /** Sign in with a SPINID *or* email, plus password. */
  signIn: (input: { identifier: string; password: string }) => Promise<AuthResult>;
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

/** SPINID prefix letter per role — SRP.. player, SRH.. host, SRC.. club, SRA.. admin. */
export const ROLE_LETTER: Record<Role, string> = {
  PLAYER: "P",
  HOST: "H",
  CLUB: "C",
  ADMIN: "A",
};

/** Built-in logins so every portal is reachable out of the box. They take the
 *  first SPINID in each role's sequence; real sign-ups continue from there. */
export const SEED_ACCOUNTS: readonly Account[] = [
  { uniqueId: "SRP01", id: "u-1", name: "Arjun Sharma", password: "player", role: "PLAYER", email: "arjun@apexttc.in", linkedId: "p-1", createdAt: "" },
  { uniqueId: "SRC01", id: "u-2", name: "Apex TTC Admin", password: "club", role: "CLUB", email: "contact@apexttc.in", linkedId: "club-apex", createdAt: "" },
  { uniqueId: "SRH01", id: "u-3", name: "Karnataka TTA Ops", password: "host", role: "HOST", email: "ops@ktta.in", linkedId: null, createdAt: "" },
  { uniqueId: "SRA01", id: "u-4", name: "Platform Admin", password: "admin", role: "ADMIN", email: "admin@ttmanagement.app", linkedId: null, createdAt: "" },
];

const norm = (s: string) => s.trim().toLowerCase();

/** The next SPINID for a role — max existing number for that prefix, plus one. */
function nextUniqueId(role: Role, accounts: readonly Account[]): string {
  const prefix = `SR${ROLE_LETTER[role]}`;
  let max = 0;
  for (const a of [...SEED_ACCOUNTS, ...accounts]) {
    const id = a.uniqueId?.toUpperCase() ?? "";
    if (!id.startsWith(prefix)) continue;
    const n = parseInt(id.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

function readAccounts(): Account[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sessionFromAccount(a: {
  id?: string;
  uniqueId: string;
  name: string;
  role: Role;
  email?: string | null;
  linkedId?: string | null;
}): SessionUser {
  return {
    id: a.id ?? `acc-${norm(a.uniqueId)}`,
    uniqueId: a.uniqueId,
    name: a.name,
    role: a.role,
    email: a.email ?? undefined,
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
    async ({ name, password, role, email }) => {
      if (USE_DB) {
        try {
          const res = await apiSend<
            { ok: true; account: Parameters<typeof sessionFromAccount>[0] } | { ok: false; error: string }
          >("/api/accounts", "POST", { op: "register", name, password, role, email });
          if (!res.ok) return res;
          persist(sessionFromAccount(res.account));
          return { ok: true, role: res.account.role, uniqueId: res.account.uniqueId };
        } catch {
          return { ok: false, error: "Couldn't reach the server. Try again." };
        }
      }

      const mail = email.trim();
      if (!name.trim() || !password || !mail) {
        return { ok: false, error: "Enter your name, email and a password." };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        return { ok: false, error: "Enter a valid email address." };
      }
      const accounts = readAccounts();
      const emailTaken = [...SEED_ACCOUNTS, ...accounts].some(
        (a) => a.email && norm(a.email) === norm(mail),
      );
      if (emailTaken) {
        return {
          ok: false,
          error: "That email already has an account. Use a different email to register for another role.",
        };
      }

      const uniqueId = nextUniqueId(role, accounts);
      const account: Account = {
        uniqueId,
        name: name.trim(),
        password,
        role,
        email: mail,
        linkedId: null,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
      persist(sessionFromAccount(account));
      return { ok: true, role, uniqueId };
    },
    [persist],
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async ({ identifier, password }) => {
      if (USE_DB) {
        try {
          const res = await apiSend<
            { ok: true; account: Parameters<typeof sessionFromAccount>[0] } | { ok: false; error: string }
          >("/api/accounts", "POST", { op: "signin", identifier, password });
          if (!res.ok) return res;
          persist(sessionFromAccount(res.account));
          return { ok: true, role: res.account.role, uniqueId: res.account.uniqueId };
        } catch {
          return { ok: false, error: "Couldn't reach the server. Try again." };
        }
      }

      const id = identifier.trim();
      if (!id || !password) return { ok: false, error: "Enter your email or SPINID and password." };
      const matches = (a: Account) =>
        norm(a.uniqueId) === norm(id) || (a.email != null && norm(a.email) === norm(id));
      const account = readAccounts().find(matches) ?? SEED_ACCOUNTS.find(matches);
      if (!account || account.password !== password) {
        return { ok: false, error: "Unknown email / SPINID, or wrong password." };
      }
      persist(sessionFromAccount(account));
      return { ok: true, role: account.role, uniqueId: account.uniqueId };
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
