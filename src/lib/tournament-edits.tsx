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

import { USE_DB, apiGet, apiSend } from "@/lib/data-backend";
import type { Tournament, TTEvent } from "@/lib/types";

// Host edits to a live tournament's details.
//
// `mock-data` tournaments/events are in-memory constants and hosted ones are
// append-only in `hosted-tournaments`, so a host changing the name / venue /
// fees / rules after go-live is stored here as a shallow patch per id and
// merged back wherever the tournament or event is read for players (see
// `useAllTournaments` / `useAllEvents`). Editing is only offered once the
// tournament is live — the pre-live path is to resubmit the host form.

const STORAGE_KEY = "tt-demo-tournament-edits";

/** Tournament fields a host may change post go-live. Everything else (id,
 *  eventId, lifecycle status, the registered roster, results) is off-limits. */
export type TournamentEdit = Partial<
  Pick<
    Tournament,
    | "name"
    | "venue"
    | "date"
    | "registrationDeadline"
    | "maxPlayers"
    | "format"
    | "category"
    | "entryFee"
    | "description"
    | "matchFormat"
    | "ballType"
    | "umpireStatus"
    | "prizePool"
    | "totalPrizePool"
    | "posterUrl"
    | "registrationQuestions"
    | "tieBreakOrder"
  >
>;

/** Event-level fields (shared by every category of the event). */
export type EventEdit = Partial<Pick<TTEvent, "name" | "venue" | "date" | "location" | "posterUrl">>;

interface EditsData {
  tournaments: Record<string, TournamentEdit>;
  events: Record<string, EventEdit>;
}

interface TournamentEditsContextValue {
  edits: EditsData;
  isLoading: boolean;
  tournamentEdit: (tournamentId: string) => TournamentEdit | undefined;
  eventEdit: (eventId: string) => EventEdit | undefined;
  saveTournamentEdit: (tournamentId: string, patch: TournamentEdit) => void;
  saveEventEdit: (eventId: string, patch: EventEdit) => void;
}

const TournamentEditsContext = createContext<TournamentEditsContextValue | null>(null);

const EMPTY: EditsData = { tournaments: {}, events: {} };

function readStorage(): EditsData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && parsed.tournaments && parsed.events) {
      return parsed as EditsData;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return EMPTY;
}

export function TournamentEditsProvider({ children }: { children: ReactNode }) {
  const [edits, setEdits] = useState<EditsData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (USE_DB) {
      apiGet<EditsData>("/api/tournament-edits")
        .then((d) => setEdits({ tournaments: d.tournaments ?? {}, events: d.events ?? {} }))
        .catch((e) => console.error("tournament-edits load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    setEdits(readStorage());
    setIsLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEdits(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveTournamentEdit = useCallback(
    (tournamentId: string, patch: TournamentEdit) => {
      setEdits((current) => {
        const next: EditsData = {
          ...current,
          tournaments: {
            ...current.tournaments,
            [tournamentId]: { ...current.tournaments[tournamentId], ...patch },
          },
        };
        if (USE_DB) {
          apiSend("/api/tournament-edits", "POST", {
            kind: "tournament",
            targetId: tournamentId,
            patch,
          }).catch((e) => console.error("tournament-edits save", e));
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const saveEventEdit = useCallback((eventId: string, patch: EventEdit) => {
    setEdits((current) => {
      const next: EditsData = {
        ...current,
        events: {
          ...current.events,
          [eventId]: { ...current.events[eventId], ...patch },
        },
      };
      if (USE_DB) {
        apiSend("/api/tournament-edits", "POST", { kind: "event", targetId: eventId, patch }).catch(
          (e) => console.error("tournament-edits save", e),
        );
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const value = useMemo<TournamentEditsContextValue>(
    () => ({
      edits,
      isLoading,
      tournamentEdit: (id) => edits.tournaments[id],
      eventEdit: (id) => edits.events[id],
      saveTournamentEdit,
      saveEventEdit,
    }),
    [edits, isLoading, saveTournamentEdit, saveEventEdit],
  );

  return (
    <TournamentEditsContext.Provider value={value}>{children}</TournamentEditsContext.Provider>
  );
}

export function useTournamentEdits() {
  const ctx = useContext(TournamentEditsContext);
  if (!ctx) throw new Error("useTournamentEdits must be used within TournamentEditsProvider");
  return ctx;
}

/** Merge a stored patch onto a tournament. Falls through untouched when there
 *  is no edit for it. */
export function applyTournamentEdit<T extends Tournament>(
  tournament: T,
  edit: TournamentEdit | undefined,
): T {
  if (!edit) return tournament;
  return { ...tournament, ...edit };
}

/** Merge a stored patch onto an event. */
export function applyEventEdit<T extends TTEvent>(event: T, edit: EventEdit | undefined): T {
  if (!edit) return event;
  return { ...event, ...edit };
}
