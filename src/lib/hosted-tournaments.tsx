"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { events as seedEvents, tournaments as seedTournaments } from "@/lib/mock-data";
import { applyEventEdit, applyTournamentEdit, useTournamentEdits } from "@/lib/tournament-edits";
import { USE_DB, apiGet, apiSend } from "@/lib/data-backend";
import type { Tournament, TTEvent } from "@/lib/types";

// Tournaments created through the public "Host a Tournament" form. `mock-data`
// arrays are in-memory only and reset on reload, so hosted events are kept here
// in localStorage and merged back wherever tournaments/events are listed. One
// host submission = one TTEvent + one Tournament per category, all sharing the
// event id.

const STORAGE_KEY = "tt-demo-hosted";

interface HostedData {
  tournaments: Tournament[];
  events: TTEvent[];
}

interface HostedTournamentsContextValue {
  hosted: HostedData;
  isLoading: boolean;
  addHostedEvent: (event: TTEvent, categories: Tournament[]) => void;
}

const HostedTournamentsContext = createContext<HostedTournamentsContextValue | null>(null);

function readStorage(): HostedData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.tournaments) && Array.isArray(parsed.events)) {
      return parsed as HostedData;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return { tournaments: [], events: [] };
}

export function HostedTournamentsProvider({ children }: { children: ReactNode }) {
  const [hosted, setHosted] = useState<HostedData>({ tournaments: [], events: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (USE_DB) {
      apiGet<HostedData>("/api/hosted-tournaments")
        .then((d) =>
          setHosted({ events: d.events ?? [], tournaments: d.tournaments ?? [] }),
        )
        .catch((e) => console.error("hosted-tournaments load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    setHosted(readStorage());
    setIsLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHosted(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addHostedEvent = useCallback((event: TTEvent, categories: Tournament[]) => {
    setHosted((current) => {
      const next: HostedData = {
        events: [...current.events, event],
        tournaments: [...current.tournaments, ...categories],
      };
      if (USE_DB) {
        apiSend<HostedData>("/api/hosted-tournaments", "POST", { event, categories })
          .then((d) => setHosted({ events: d.events ?? [], tournaments: d.tournaments ?? [] }))
          .catch((e) => console.error("hosted-tournaments add", e));
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const value = useMemo<HostedTournamentsContextValue>(
    () => ({ hosted, isLoading, addHostedEvent }),
    [hosted, isLoading, addHostedEvent],
  );

  return (
    <HostedTournamentsContext.Provider value={value}>{children}</HostedTournamentsContext.Provider>
  );
}

export function useHostedTournaments() {
  const ctx = useContext(HostedTournamentsContext);
  if (!ctx) throw new Error("useHostedTournaments must be used within HostedTournamentsProvider");
  return ctx;
}

/** Seed tournaments plus everything created through the host form, with any
 *  post go-live host edits merged in. */
export function useAllTournaments(): Tournament[] {
  const { hosted } = useHostedTournaments();
  const { edits } = useTournamentEdits();
  return useMemo(
    () =>
      [...seedTournaments, ...hosted.tournaments].map((t) =>
        applyTournamentEdit(t, edits.tournaments[t.id]),
      ),
    [hosted.tournaments, edits.tournaments],
  );
}

/** Seed events plus everything created through the host form, with host edits
 *  merged in. */
export function useAllEvents(): TTEvent[] {
  const { hosted } = useHostedTournaments();
  const { edits } = useTournamentEdits();
  return useMemo(
    () => [...seedEvents, ...hosted.events].map((e) => applyEventEdit(e, edits.events[e.id])),
    [hosted.events, edits.events],
  );
}
