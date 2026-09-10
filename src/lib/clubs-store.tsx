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
import { clubs as seedClubs } from "@/lib/mock-data";
import type { Club } from "@/lib/types";
import { buildClub, type ClubProfileInput } from "@/lib/club-profile";

export interface CreatedClub extends Club {
  spinId?: string;
  profileComplete: boolean;
}

const STORAGE_KEY = "tt-demo-clubs";

interface ClubsContextValue {
  createdClubs: CreatedClub[];
  isLoading: boolean;
  upsertCreatedClub: (club: CreatedClub) => void;
  createLocalClub: (args: { spinId: string; name: string; input?: ClubProfileInput }) => CreatedClub;
  updateProfile: (id: string, patch: ClubProfileInput & { name?: string }) => Promise<void>;
  refetch: () => void;
}

const ClubsContext = createContext<ClubsContextValue | null>(null);

function readStorage(): CreatedClub[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(list: CreatedClub[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* private mode / quota */
  }
}

function mergeById(list: CreatedClub[], next: CreatedClub): CreatedClub[] {
  const i = list.findIndex((c) => c.id === next.id);
  if (i === -1) return [...list, next];
  const copy = list.slice();
  copy[i] = { ...copy[i], ...next };
  return copy;
}

export function ClubsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [createdClubs, setCreatedClubs] = useState<CreatedClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    if (USE_DB) {
      apiGet<CreatedClub[]>("/api/clubs")
        .then(setCreatedClubs)
        .catch((e) => console.error("clubs load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    Promise.resolve().then(() => {
      setCreatedClubs(readStorage());
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  useEffect(() => {
    if (USE_DB) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCreatedClubs(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const upsertCreatedClub = useCallback((club: CreatedClub) => {
    setCreatedClubs((cur) => {
      const next = mergeById(cur, club);
      if (!USE_DB) writeStorage(next);
      return next;
    });
  }, []);

  const createLocalClub = useCallback<ClubsContextValue["createLocalClub"]>(
    ({ spinId, name, input }) => {
      const built = buildClub({ id: `club-usr-${spinId.toLowerCase()}`, name, input });
      const club: CreatedClub = { ...built };
      setCreatedClubs((cur) => {
        const next = mergeById(cur, club);
        writeStorage(next);
        return next;
      });
      return club;
    },
    [],
  );

  const updateProfile = useCallback<ClubsContextValue["updateProfile"]>(
    async (id, patch) => {
      if (USE_DB) {
        const updated = await apiSend<CreatedClub>("/api/clubs", "PATCH", { id, patch });
        if (updated) upsertCreatedClub(updated);
        return;
      }
      setCreatedClubs((cur) => {
        const existing = cur.find((c) => c.id === id);
        if (!existing) return cur;
        const rebuilt = buildClub({
          id,
          name: patch.name?.trim() || existing.name,
          input: {
            location: patch.location ?? existing.location,
            address: patch.address ?? existing.address,
            state: patch.state ?? existing.state,
            description: patch.description ?? existing.description,
            founded: patch.founded ?? existing.founded,
            phone: patch.phone ?? existing.phone,
            email: patch.email ?? existing.email,
            coordinates: patch.coordinates ?? existing.coordinates ?? null,
            facilities: { ...existing.facilities, ...(patch.facilities ?? {}) },
            aboutHighlights: patch.aboutHighlights ?? existing.aboutHighlights ?? [],
          },
        });
        const next = mergeById(cur, { ...existing, ...rebuilt });
        writeStorage(next);
        return next;
      });
    },
    [upsertCreatedClub],
  );

  const value = useMemo<ClubsContextValue>(
    () => ({
      createdClubs,
      isLoading,
      upsertCreatedClub,
      createLocalClub,
      updateProfile,
      refetch: load,
    }),
    [createdClubs, isLoading, upsertCreatedClub, createLocalClub, updateProfile, load],
  );

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>;
}

function useClubsContext() {
  const ctx = useContext(ClubsContext);
  if (!ctx) throw new Error("useClubsContext must be used within ClubsProvider");
  return ctx;
}

export function useCreatedClubs() {
  return useClubsContext();
}

/** The seed club catalogue plus every real CLUB sign-up, de-duped by id. */
export function useClubRoster(): Club[] {
  const { createdClubs } = useClubsContext();
  return useMemo(() => {
    const seen = new Set(seedClubs.map((c) => c.id));
    return [...seedClubs, ...createdClubs.filter((c) => !seen.has(c.id))];
  }, [createdClubs]);
}
