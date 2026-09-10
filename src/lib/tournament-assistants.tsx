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

// Delegated match-console access. A tournament's host can hand any platform
// account (player / club / host login — the host's call) full run-of-the-house
// access to that one tournament's Matches workspace, and revoke it later. The
// grantee sees *only* the Matches console for that tournament (via /assist),
// never the overview, registrations or exports.
//
// localStorage shape: { [tournamentId]: AssistantGrant[] } — same
// storage-store + cross-tab `storage` listener pattern as every other provider
// here, so a grant or a revoke propagates to every open tab immediately.

const STORAGE_KEY = "tt-demo-tournament-assistants";

export interface AssistantGrant {
  /** The login id the host typed — the identity we match a session against. */
  uniqueId: string;
  name: string;
  /** PLAYER | CLUB | HOST | ADMIN — display only. */
  role: string;
  /** Rating/directory id when known (players), for parity with other stores. */
  personId?: string;
  /** ISO timestamp the access was granted. */
  addedAt: string;
}

type AssistantMap = Record<string, AssistantGrant[]>;

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function readStore(): AssistantMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as AssistantMap) : {};
  } catch {
    return {};
  }
}

interface TournamentAssistantsContextValue {
  /** Grants for one tournament, oldest first. */
  assistantsFor: (tournamentId: string) => AssistantGrant[];
  /** Add (or refresh) a grant. No-op if `uniqueId` already has access. */
  grant: (tournamentId: string, person: { uniqueId: string; name: string; role: string; personId?: string }) => void;
  /** Remove a grant by login id. */
  revoke: (tournamentId: string, uniqueId: string) => void;
  /** Does this login id currently have access to this tournament? */
  isAssistant: (tournamentId: string, uniqueId: string | undefined) => boolean;
  /** Tournament ids this login id has been granted access to. */
  assignmentsFor: (uniqueId: string | undefined) => string[];
  isLoading: boolean;
}

const TournamentAssistantsContext = createContext<TournamentAssistantsContextValue | null>(null);

export function TournamentAssistantsProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<AssistantMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    apiGet<AssistantMap>("/api/tournament-assistants")
      .then(setMap)
      .catch((e) => console.error("assistants load", e));
  }, []);

  useEffect(() => {
    if (USE_DB) {
      apiGet<AssistantMap>("/api/tournament-assistants")
        .then(setMap)
        .catch((e) => console.error("assistants load", e))
        .finally(() => setIsLoading(false));
      const onFocus = () => refetch();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
    // Hydrate on mount and stay in sync with other tabs / other logins on this
    // machine — the same localStorage-store shape used across this codebase
    // (mount read, then a `storage` listener). No server to subscribe to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMap(readStore());
    setIsLoading(false);
    const refresh = () => setMap(readStore());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [refetch]);

  const persist = useCallback((next: AssistantMap) => {
    setMap(next);
    if (USE_DB) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — session-only */
    }
  }, []);

  const grant = useCallback<TournamentAssistantsContextValue["grant"]>(
    (tournamentId, person) => {
      const current = USE_DB ? map : readStore();
      const list = current[tournamentId] ?? [];
      if (list.some((g) => norm(g.uniqueId) === norm(person.uniqueId))) return;
      persist({
        ...current,
        [tournamentId]: [
          ...list,
          {
            uniqueId: person.uniqueId.trim(),
            name: person.name,
            role: person.role,
            personId: person.personId,
            addedAt: new Date().toISOString(),
          },
        ],
      });
      if (USE_DB) {
        apiSend<AssistantMap>("/api/tournament-assistants", "POST", { tournamentId, person })
          .then(setMap)
          .catch((e) => console.error("assistants grant", e));
      }
    },
    [persist, map],
  );

  const revoke = useCallback<TournamentAssistantsContextValue["revoke"]>(
    (tournamentId, uniqueId) => {
      const current = USE_DB ? map : readStore();
      const list = current[tournamentId] ?? [];
      const next = list.filter((g) => norm(g.uniqueId) !== norm(uniqueId));
      const copy = { ...current };
      if (next.length) copy[tournamentId] = next;
      else delete copy[tournamentId];
      persist(copy);
      if (USE_DB) {
        apiSend<AssistantMap>("/api/tournament-assistants", "DELETE", { tournamentId, uniqueId })
          .then(setMap)
          .catch((e) => console.error("assistants revoke", e));
      }
    },
    [persist, map],
  );

  const assistantsFor = useCallback(
    (tournamentId: string) => map[tournamentId] ?? [],
    [map],
  );

  const isAssistant = useCallback(
    (tournamentId: string, uniqueId: string | undefined) => {
      if (!uniqueId) return false;
      return (map[tournamentId] ?? []).some((g) => norm(g.uniqueId) === norm(uniqueId));
    },
    [map],
  );

  const assignmentsFor = useCallback(
    (uniqueId: string | undefined) => {
      if (!uniqueId) return [];
      const u = norm(uniqueId);
      return Object.entries(map)
        .filter(([, list]) => list.some((g) => norm(g.uniqueId) === u))
        .map(([tournamentId]) => tournamentId);
    },
    [map],
  );

  const value = useMemo<TournamentAssistantsContextValue>(
    () => ({ assistantsFor, grant, revoke, isAssistant, assignmentsFor, isLoading }),
    [assistantsFor, grant, revoke, isAssistant, assignmentsFor, isLoading],
  );

  return (
    <TournamentAssistantsContext.Provider value={value}>{children}</TournamentAssistantsContext.Provider>
  );
}

export function useTournamentAssistants() {
  const ctx = useContext(TournamentAssistantsContext);
  if (!ctx) throw new Error("useTournamentAssistants must be used within TournamentAssistantsProvider");
  return ctx;
}

/**
 * A match-console grant is **event-wide**: being handed one category unlocks
 * every category of that event. Given the raw granted tournament ids and the
 * full tournament list, returns the set of *all* tournament ids the grantee can
 * open — the granted ones plus every sibling that shares their event. Also
 * covers legacy single-category grants made before grants fanned out.
 */
export function expandGrantsToEvent(
  grantedIds: Iterable<string>,
  tournaments: readonly { id: string; eventId: string }[],
): Set<string> {
  const granted = new Set(grantedIds);
  const grantedEventIds = new Set<string>();
  for (const t of tournaments) if (granted.has(t.id)) grantedEventIds.add(t.eventId);
  const out = new Set<string>();
  for (const t of tournaments) {
    if (granted.has(t.id) || grantedEventIds.has(t.eventId)) out.add(t.id);
  }
  return out;
}
