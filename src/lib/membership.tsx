"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { USE_DB, apiGet, apiSend } from "@/lib/data-backend";
import type { Role } from "@/lib/types";

// Only Player and Club accounts pay for site access — Host pays per
// tournament (see hosting-plans.tsx) and Admin doesn't pay at all.
export type MembershipRole = Extract<Role, "PLAYER" | "CLUB">;

export interface MembershipRecord {
  userId: string;
  role: MembershipRole;
  expiresAt: string;
}

export interface MembershipFees {
  PLAYER: number;
  CLUB: number;
}

// Admin-editable annual fee. A payment (first activation, or a later
// renewal) always sets expiresAt to exactly one year from that moment.
export const defaultMembershipFees: MembershipFees = {
  PLAYER: 499,
  CLUB: 1499,
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const RECORDS_KEY = "tt-demo-memberships";
const FEES_KEY = "tt-demo-membership-fees";

interface MembershipContextValue {
  records: MembershipRecord[];
  fees: MembershipFees;
  isLoading: boolean;
  activateRecord: (userId: string, role: MembershipRole) => void;
  updateFee: (role: MembershipRole, amount: number) => void;
}

const MembershipContext = createContext<MembershipContextValue | null>(null);

function readRecords(): MembershipRecord[] {
  const raw = window.localStorage.getItem(RECORDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(RECORDS_KEY);
    return [];
  }
}

function readFees(): MembershipFees {
  const raw = window.localStorage.getItem(FEES_KEY);
  if (!raw) return defaultMembershipFees;
  try {
    const parsed = JSON.parse(raw);
    return {
      PLAYER: typeof parsed?.PLAYER === "number" ? parsed.PLAYER : defaultMembershipFees.PLAYER,
      CLUB: typeof parsed?.CLUB === "number" ? parsed.CLUB : defaultMembershipFees.CLUB,
    };
  } catch {
    window.localStorage.removeItem(FEES_KEY);
    return defaultMembershipFees;
  }
}

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<MembershipRecord[]>([]);
  const [fees, setFees] = useState<MembershipFees>(defaultMembershipFees);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (USE_DB) {
      apiGet<{ records: MembershipRecord[]; fees: MembershipFees }>("/api/membership")
        .then(({ records, fees }) => {
          setRecords(records);
          setFees(fees);
        })
        .catch((e) => console.error("membership load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    setRecords(readRecords());
    setFees(readFees());
    setIsLoading(false);
    // Keep multiple open tabs/portals in sync with each other.
    const onStorage = (e: StorageEvent) => {
      if (e.key === RECORDS_KEY) setRecords(readRecords());
      if (e.key === FEES_KEY) setFees(readFees());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activateRecord = useCallback((userId: string, role: MembershipRole) => {
    const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
    setRecords((current) => {
      const next = current.some((r) => r.userId === userId)
        ? current.map((r) => (r.userId === userId ? { ...r, role, expiresAt } : r))
        : [...current, { userId, role, expiresAt }];
      if (USE_DB) {
        apiSend<{ expiresAt: string }>("/api/membership", "POST", {
          op: "activate",
          userId,
          role,
        })
          .then(({ expiresAt: serverExpiry }) =>
            setRecords((cur) =>
              cur.map((r) => (r.userId === userId ? { ...r, expiresAt: serverExpiry } : r)),
            ),
          )
          .catch((e) => console.error("membership activate", e));
      } else {
        window.localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const updateFee = useCallback((role: MembershipRole, amount: number) => {
    setFees((current) => {
      const next = { ...current, [role]: amount };
      if (USE_DB) {
        apiSend("/api/membership", "PATCH", { op: "fee", role, amount }).catch((e) =>
          console.error("membership fee", e),
        );
      } else {
        window.localStorage.setItem(FEES_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  return (
    <MembershipContext.Provider value={{ records, fees, isLoading, activateRecord, updateFee }}>
      {children}
    </MembershipContext.Provider>
  );
}

function useMembershipContext() {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error("useMembershipContext must be used within MembershipProvider");
  return ctx;
}

// Status for the signed-in player/club. `hasRecord: false` means they've
// never paid; an existing record with a past `expiresAt` means it lapsed —
// both are "not active" and get gated by RequireActiveMembership below.
//
// The current time is read once per mount (and refreshed every minute)
// into state rather than called inline during render — reading the clock
// directly while rendering is an impure operation React can re-run at any
// time, which would make "is this expired" answer differently from one
// render to the next for no visible reason.
export function useMembershipStatus() {
  const { user } = useAuth();
  const { records, fees, isLoading, activateRecord } = useMembershipContext();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const record = user ? records.find((r) => r.userId === user.id) : undefined;
  const expiresAtMs = record ? new Date(record.expiresAt).getTime() : null;
  const clockReady = now !== null;
  const isActive = clockReady && expiresAtMs !== null && expiresAtMs > (now as number);
  const daysRemaining =
    clockReady && expiresAtMs !== null ? Math.ceil((expiresAtMs - (now as number)) / (24 * 60 * 60 * 1000)) : null;
  const fee = user && (user.role === "PLAYER" || user.role === "CLUB") ? fees[user.role] : undefined;

  return {
    isLoading: isLoading || !clockReady,
    hasRecord: !!record,
    isActive,
    expiresAt: record?.expiresAt,
    daysRemaining,
    fee,
    activate: () => {
      if (user && (user.role === "PLAYER" || user.role === "CLUB")) activateRecord(user.id, user.role);
    },
  };
}

export function useMembershipFees() {
  const { fees, isLoading, updateFee } = useMembershipContext();
  return { fees, isLoading, updateFee };
}

const renewPathForRole: Record<MembershipRole, string> = {
  PLAYER: "/player/renew",
  CLUB: "/club/renew",
};

// Wrap every in-portal page (except the renew page itself) for PLAYER and
// CLUB layouts. Redirects to that role's renew page whenever membership
// isn't currently active, blocking access until they pay.
export function RequireActiveMembership({ role, children }: { role: MembershipRole; children: ReactNode }) {
  const router = useRouter();
  const { isLoading, isActive } = useMembershipStatus();

  useEffect(() => {
    if (!isLoading && !isActive) {
      router.replace(renewPathForRole[role]);
    }
  }, [isLoading, isActive, role, router]);

  if (isLoading) {
    return <div className="flex-1" />;
  }

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
