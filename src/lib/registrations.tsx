"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { USE_DB, apiGet, apiSend } from "@/lib/data-backend";

export type RegistrationStatus = "PENDING_PAYMENT" | "REGISTERED";

export interface RegistrationAnswer {
  question: string;
  answer: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  playerId: string;
  playerName: string;
  status: RegistrationStatus;
  createdAt: string;
  /** The player's answers to the host's registration questions. */
  answers?: RegistrationAnswer[];
}

interface RegistrationsContextValue {
  registrations: TournamentRegistration[];
  isLoading: boolean;
  register: (
    tournamentId: string,
    playerId: string,
    playerName: string,
    entryFee: number,
    answers?: RegistrationAnswer[],
  ) => void;
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
    if (USE_DB) {
      apiGet<TournamentRegistration[]>("/api/registrations")
        .then(setRegistrations)
        .catch((e) => console.error("registrations load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    setRegistrations(readStorage());
    setIsLoading(false);
    // Keep multiple open tabs/portals in sync with each other.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRegistrations(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const register = useCallback<RegistrationsContextValue["register"]>(
    (tournamentId, playerId, playerName, entryFee, answers) => {
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
            ...(answers && answers.length > 0 ? { answers } : {}),
          },
        ];
        if (USE_DB) {
          apiSend<TournamentRegistration>("/api/registrations", "POST", {
            tournamentId,
            playerId,
            playerName,
            entryFee,
            answers,
          })
            .then((row) =>
              setRegistrations((cur) =>
                cur.map((r) =>
                  r.tournamentId === tournamentId && r.playerId === playerId ? row : r,
                ),
              ),
            )
            .catch((e) => console.error("registrations register", e));
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
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
      if (USE_DB) {
        apiSend("/api/registrations", "PATCH", {
          op: "confirmPayment",
          tournamentId,
          playerId,
        }).catch((e) => console.error("registrations confirmPayment", e));
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
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
