"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Tournament, TournamentStatus } from "@/lib/types";

// Admin approval / lifecycle overrides for tournaments. `mock-data.tournaments`
// is an in-memory array, so a status change made in the UI is kept here and
// merged back with `effectiveStatus()` wherever a tournament's state matters.
//
// Flow: a hosted tournament is submitted as DRAFT → an admin approves it, which
// sets REGISTRATION_OPEN (it becomes visible and its Matches workspace unlocks)
// → the workspace drives it through to COMPLETED when results are published.

type OverrideMap = Record<string, TournamentStatus>;

interface TournamentStatusContextValue {
  overrides: OverrideMap;
  isLoading: boolean;
  statusFor: (tournamentId: string) => TournamentStatus | undefined;
  approve: (tournamentId: string) => void;
  revert: (tournamentId: string) => void;
  complete: (tournamentId: string) => void;
  setStatus: (tournamentId: string, status: TournamentStatus) => void;
}

const STORAGE_KEY = "tt-demo-tournament-status";

const TournamentStatusContext = createContext<TournamentStatusContextValue | null>(null);

function readStorage(): OverrideMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function TournamentStatusProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOverrides(readStorage());
    setIsLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setOverrides(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setStatus = useCallback((tournamentId: string, status: TournamentStatus) => {
    setOverrides((current) => {
      const next = { ...current, [tournamentId]: status };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<TournamentStatusContextValue>(
    () => ({
      overrides,
      isLoading,
      statusFor: (id) => overrides[id],
      approve: (id) => setStatus(id, "REGISTRATION_OPEN"),
      revert: (id) => setStatus(id, "DRAFT"),
      complete: (id) => setStatus(id, "COMPLETED"),
      setStatus,
    }),
    [overrides, isLoading, setStatus],
  );

  return (
    <TournamentStatusContext.Provider value={value}>{children}</TournamentStatusContext.Provider>
  );
}

export function useTournamentStatus() {
  const ctx = useContext(TournamentStatusContext);
  if (!ctx) throw new Error("useTournamentStatus must be used within TournamentStatusProvider");
  return ctx;
}

/** Merge a stored override onto a tournament's own status. */
export function effectiveStatus(
  tournament: Pick<Tournament, "id" | "status">,
  overrides: OverrideMap,
): TournamentStatus {
  return overrides[tournament.id] ?? tournament.status;
}

/** A tournament is "live" (its Matches workspace is open) once it's past DRAFT. */
export function isLive(status: TournamentStatus): boolean {
  return status !== "DRAFT";
}
