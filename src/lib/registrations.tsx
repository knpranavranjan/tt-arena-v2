"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type RegistrationStatus = "PENDING_PAYMENT" | "REGISTERED";

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  playerId: string;
  playerName: string;
  status: RegistrationStatus;
  createdAt: string;
}

interface RegistrationsContextValue {
  registrations: TournamentRegistration[];
  isLoading: boolean;
  register: (tournamentId: string, playerId: string, playerName: string, entryFee: number) => void;
  confirmPayment: (tournamentId: string, playerId: string) => void;
  statusFor: (tournamentId: string, playerId: string) => RegistrationStatus | undefined;
}

const STORAGE_KEY = "tt-demo-registrations";

const RegistrationsContext = createContext<RegistrationsContextValue | null>(null);

function readStorage(): TournamentRegistration[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RegistrationsProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRegistrations(readStorage());
    setIsLoading(false);
    // Keep multiple open tabs/portals in sync with each other.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRegistrations(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const register = useCallback(
    (tournamentId: string, playerId: string, playerName: string, entryFee: number) => {
      setRegistrations((current) => {
        if (current.some((r) => r.tournamentId === tournamentId && r.playerId === playerId)) {
          return current;
        }
        const next: TournamentRegistration[] = [
          ...current,
          {
            id: makeId(),
            tournamentId,
            playerId,
            playerName,
            status: entryFee > 0 ? "PENDING_PAYMENT" : "REGISTERED",
            createdAt: new Date().toISOString(),
          },
        ];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  // A functional update, like `register` above — not a plain `registrations.map(...)`
  // off the render's closure — so this stays correct even when called in the
  // same tick right after `register()` (e.g. a single "pay now" action that
  // registers and immediately confirms payment for a brand-new category).
  const confirmPayment = useCallback((tournamentId: string, playerId: string) => {
    setRegistrations((current) => {
      const next = current.map((r) =>
        r.tournamentId === tournamentId && r.playerId === playerId ? { ...r, status: "REGISTERED" as const } : r,
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const statusFor = useCallback(
    (tournamentId: string, playerId: string) =>
      registrations.find((r) => r.tournamentId === tournamentId && r.playerId === playerId)?.status,
    [registrations],
  );

  return (
    <RegistrationsContext.Provider value={{ registrations, isLoading, register, confirmPayment, statusFor }}>
      {children}
    </RegistrationsContext.Provider>
  );
}

export function useRegistrations() {
  const ctx = useContext(RegistrationsContext);
  if (!ctx) throw new Error("useRegistrations must be used within RegistrationsProvider");
  return ctx;
}
