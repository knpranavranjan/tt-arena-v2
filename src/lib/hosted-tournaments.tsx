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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

/** Seed tournaments plus everything created through the host form. */
export function useAllTournaments(): Tournament[] {
  const { hosted } = useHostedTournaments();
  return useMemo(() => [...seedTournaments, ...hosted.tournaments], [hosted.tournaments]);
}

/** Seed events plus everything created through the host form. */
export function useAllEvents(): TTEvent[] {
  const { hosted } = useHostedTournaments();
  return useMemo(() => [...seedEvents, ...hosted.events], [hosted.events]);
}
