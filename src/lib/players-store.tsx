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
import { useAuth } from "@/lib/auth";
import { players as seedPlayers } from "@/lib/mock-data";
import type { Player } from "@/lib/types";
import {
  buildPlayer,
  type PlayerProfileInput,
} from "@/lib/player-profile";

/** A player profile created by a real sign-up (vs. the seed roster). */
export interface CreatedPlayer extends Player {
  spinId?: string;
  phone?: string | null;
  skillLevel?: string | null;
  profileComplete: boolean;
}

const STORAGE_KEY = "tt-demo-players";

interface PlayersContextValue {
  createdPlayers: CreatedPlayer[];
  isLoading: boolean;
  /** Merge a just-created / just-updated profile into state without a refetch. */
  upsertCreatedPlayer: (player: CreatedPlayer) => void;
  /** localStorage-mode profile creation (DB mode does this server-side on register). */
  createLocalPlayer: (args: { spinId: string; name: string; input?: PlayerProfileInput }) => CreatedPlayer;
  /** Patch a profile — persists (PATCH /api/players in DB mode, localStorage otherwise). */
  updateProfile: (id: string, patch: PlayerProfileInput & { name?: string }) => Promise<void>;
  refetch: () => void;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);

function readStorage(): CreatedPlayer[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(list: CreatedPlayer[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* private mode / quota — in-memory state still works for this session */
  }
}

function mergeById(list: CreatedPlayer[], next: CreatedPlayer): CreatedPlayer[] {
  const i = list.findIndex((p) => p.id === next.id);
  if (i === -1) return [...list, next];
  const copy = list.slice();
  copy[i] = { ...copy[i], ...next };
  return copy;
}

export function PlayersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [createdPlayers, setCreatedPlayers] = useState<CreatedPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    // Both branches settle state asynchronously so this stays safe to call
    // straight from an effect (no synchronous cascading render).
    if (USE_DB) {
      apiGet<CreatedPlayer[]>("/api/players")
        .then(setCreatedPlayers)
        .catch((e) => console.error("players load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    Promise.resolve().then(() => {
      setCreatedPlayers(readStorage());
      setIsLoading(false);
    });
  }, []);

  // Load once, and again whenever the signed-in account changes — a fresh
  // registration/sign-in needs its new profile row visible immediately.
  useEffect(() => {
    load();
  }, [load, user?.id]);

  // Keep other tabs in sync in localStorage mode.
  useEffect(() => {
    if (USE_DB) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCreatedPlayers(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const upsertCreatedPlayer = useCallback((player: CreatedPlayer) => {
    setCreatedPlayers((cur) => {
      const next = mergeById(cur, player);
      if (!USE_DB) writeStorage(next);
      return next;
    });
  }, []);

  const createLocalPlayer = useCallback<PlayersContextValue["createLocalPlayer"]>(
    ({ spinId, name, input }) => {
      const built = buildPlayer({ id: `p-usr-${spinId.toLowerCase()}`, name, input });
      const player: CreatedPlayer = { ...built };
      setCreatedPlayers((cur) => {
        const next = mergeById(cur, player);
        writeStorage(next);
        return next;
      });
      return player;
    },
    [],
  );

  const updateProfile = useCallback<PlayersContextValue["updateProfile"]>(
    async (id, patch) => {
      if (USE_DB) {
        const updated = await apiSend<CreatedPlayer>("/api/players", "PATCH", { id, patch });
        if (updated) upsertCreatedPlayer(updated);
        return;
      }
      setCreatedPlayers((cur) => {
        const existing = cur.find((p) => p.id === id);
        if (!existing) return cur;
        const rebuilt = buildPlayer({
          id,
          name: patch.name?.trim() || existing.name,
          input: {
            dateOfBirth: patch.dateOfBirth ?? existing.dateOfBirth,
            gender: patch.gender || existing.gender,
            state: patch.state ?? existing.state,
            phone: patch.phone ?? existing.phone ?? undefined,
            skillLevel: patch.skillLevel || existing.skillLevel || undefined,
          },
        });
        const next = mergeById(cur, { ...existing, ...rebuilt });
        writeStorage(next);
        return next;
      });
    },
    [upsertCreatedPlayer],
  );

  const value = useMemo<PlayersContextValue>(
    () => ({
      createdPlayers,
      isLoading,
      upsertCreatedPlayer,
      createLocalPlayer,
      updateProfile,
      refetch: load,
    }),
    [createdPlayers, isLoading, upsertCreatedPlayer, createLocalPlayer, updateProfile, load],
  );

  return <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>;
}

function usePlayersContext() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error("usePlayersContext must be used within PlayersProvider");
  return ctx;
}

export function useCreatedPlayers() {
  return usePlayersContext();
}

/** A roster entry: a seed player, or a real sign-up (which also carries phone). */
export type RosterPlayer = Player & { phone?: string | null };

/** The seed roster plus every real-sign-up profile, de-duped by id. */
export function usePlayerRoster(): RosterPlayer[] {
  const { createdPlayers } = usePlayersContext();
  return useMemo(() => {
    const seen = new Set(seedPlayers.map((p) => p.id));
    return [...seedPlayers, ...createdPlayers.filter((p) => !seen.has(p.id))];
  }, [createdPlayers]);
}
