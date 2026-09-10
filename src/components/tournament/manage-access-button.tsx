"use client";

import { useMemo, useState } from "react";
import { Check, KeyRound, Search, Trash2, UserCog } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { ownsTournament } from "@/lib/tournament-owner";
import { usePlatformAccounts } from "@/lib/platform-directory";
import { useTournamentAssistants } from "@/lib/tournament-assistants";
import { eventTitle } from "@/lib/tournament-manage";
import type { Tournament } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };

const roleLabel: Record<string, string> = {
  PLAYER: "Player",
  CLUB: "Club",
  HOST: "Host",
  ADMIN: "Admin",
};

/**
 * Control on the manage-tournament header. Grants any platform login
 * (player / club / host) full access to *this* tournament's Matches console
 * via /assist, and revokes it. Shown to a HOST account, and to whoever created
 * this tournament through "Host a Tournament" — ownership is the creator's
 * SPINID (`organizerId`), never the display name, matching the rest of the
 * manage view.
 */
export function ManageAccessButton({ tournament }: { tournament: Tournament }) {
  const { user } = useAuth();
  const { assistantsFor, grant, revoke } = useTournamentAssistants();
  const { all, search } = usePlatformAccounts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const assistants = assistantsFor(tournament.id);

  const excluded = useMemo(
    () =>
      new Set(
        [...assistants.map((a) => a.uniqueId), ...(user ? [user.uniqueId] : [])].map((h) =>
          h.toLowerCase(),
        ),
      ),
    [assistants, user],
  );

  // With a query, filter by SPINID. Empty query browses every platform login,
  // so the host can pick anyone whose SPINID is in the system.
  const results = useMemo(() => {
    if (query.trim()) return search(query, excluded);
    return [...all]
      .filter((a) => !excluded.has(a.uniqueId.toLowerCase()))
      .sort((a, b) => a.uniqueId.localeCompare(b.uniqueId));
  }, [all, search, query, excluded]);

  if (user?.role !== "HOST" && !ownsTournament(tournament, user)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        className="flex shrink-0 items-center gap-2 rounded-[2px] border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
        style={mono}
      >
        <UserCog className="h-3.5 w-3.5" strokeWidth={2} />
        Match Console Access
        {assistants.length > 0 && (
          <span className="ml-0.5 rounded-full bg-[#ff2448] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {assistants.length}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Match console access</DialogTitle>
            <DialogDescription>
              Assistants can open and run the Matches workspace for{" "}
              <span className="text-foreground">{eventTitle(tournament)}</span> — every step from
              players to the champion. They can&apos;t see the overview, registrations or exports.
              Pick anyone below, or type their <span className="text-foreground">SPINID</span> to jump
              to them.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-muted/30 p-1">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Search by SPINID — e.g. SRP07"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto">
              {results.length === 0 && (
                <li className="px-3 py-3 text-xs text-muted-foreground">
                  {query.trim()
                    ? `No account has the SPINID “${query.trim()}”. Check the SPINID and try again.`
                    : "No other accounts on the platform yet."}
                </li>
              )}
              {results.map((acc) => (
                <li key={acc.uniqueId}>
                  <button
                    type="button"
                    onClick={() => {
                      grant(tournament.id, {
                        uniqueId: acc.uniqueId,
                        name: acc.name,
                        role: acc.role,
                        personId: acc.personId,
                      });
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {acc.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{acc.uniqueId} · {roleLabel[acc.role] ?? acc.role} login
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#ff2448]">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Add
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p
              className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
              style={mono}
            >
              <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
              With access ({assistants.length})
            </p>
            {assistants.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No assistants yet. Only you can run the Matches console.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {assistants.map((a) => (
                  <li
                    key={a.uniqueId}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{a.uniqueId} · {roleLabel[a.role] ?? a.role} login
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => revoke(tournament.id, a.uniqueId)}
                      className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
