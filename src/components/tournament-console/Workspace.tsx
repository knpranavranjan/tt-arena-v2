"use client";

import React, { useMemo, useState } from "react";

import { Badge } from "@/components/tournament-console/ui";
import { cn } from "@/lib/utils";
import { useTournament, type Stage } from "@/lib/matches-store";

import PlayerSetup from "./PlayerSetup";
import PoolAllocation from "./PoolAllocation";
import GroupsStage from "./GroupsStage";
import PoolMatches from "./PoolMatches";
import KnockoutStage from "./KnockoutStage";
import Champion from "./Champion";

const STEPS: Array<{ id: Stage; label: string }> = [
  { id: "players", label: "Players" },
  { id: "pools", label: "Rules" },
  { id: "groups", label: "Groups" },
  { id: "matches", label: "Pool Matches" },
  { id: "knockout", label: "Knockout" },
  { id: "champion", label: "Champion" },
];

const PAGES: Record<Stage, React.ComponentType> = {
  players: PlayerSetup,
  pools: PoolAllocation,
  groups: GroupsStage,
  matches: PoolMatches,
  knockout: KnockoutStage,
  champion: Champion,
};

export default function Workspace() {
  const { tournament, isDoubles, players, pools, poolMatches, bracket, champion, stage, actions } =
    useTournament();
  const format = tournament.format;

  const steps = useMemo(() => {
    const visible = STEPS.filter((step) => {
      if (format === "rr_only" && step.id === "knockout") return false;
      // Direct-knockout still gets the "Rules" step (it holds the knockout game
      // rules) — the pool-match stage is dropped.
      if (format === "ko_only" && step.id === "matches") return false;
      // Group allocation only applies to Group & Knockout.
      if (format !== "pools_ko" && step.id === "groups") return false;
      return true;
    });

    const reachable: Record<Stage, boolean> = {
      players: true,
      pools: players.length >= 2,
      groups: Boolean(pools),
      matches: Boolean(pools) && poolMatches.length > 0,
      knockout: format === "ko_only" ? players.length >= 2 : Boolean(pools),
      champion: Boolean(champion) || Boolean(bracket) || (format === "rr_only" && Boolean(pools)),
    };

    const complete: Record<Stage, boolean> = {
      players: players.length >= 2,
      pools: Boolean(pools),
      groups: Boolean(pools) && poolMatches.length > 0,
      matches: poolMatches.length > 0 && poolMatches.every((m) => m.played),
      knockout: Boolean(champion),
      champion: Boolean(champion),
    };

    return visible.map((step, i) => ({
      ...step,
      n: i + 1,
      enabled: reachable[step.id],
      done: complete[step.id],
    }));
  }, [format, players.length, pools, poolMatches, bracket, champion]);

  const activeStage: Stage = steps.some((s) => s.id === stage) ? stage : "players";
  const Page = PAGES[activeStage];

  return (
    <div className="tc-scope rounded-2xl border border-line bg-canvas text-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <nav className="flex items-center gap-0.5 overflow-x-auto p-0.5">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              {i > 0 ? <span className="h-px w-3.5 shrink-0 bg-line" /> : null}
              <button
                type="button"
                disabled={!step.enabled}
                onClick={() => actions.goto(step.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
                  activeStage === step.id
                    ? "bg-brand font-medium text-white"
                    : step.done
                      ? "text-ink hover:bg-subtle"
                      : "text-ink-faint hover:bg-subtle hover:text-ink",
                  !step.enabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "grid h-[18px] w-[18px] place-items-center rounded-full text-[10.5px] font-semibold",
                    activeStage === step.id
                      ? "bg-white/20 text-white"
                      : step.done
                        ? "bg-good-soft text-good"
                        : "bg-subtle text-ink-faint",
                  )}
                >
                  {step.done && activeStage !== step.id ? "✓" : step.n}
                </span>
                {step.label}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <CategorySwitcher />
          <Badge tone="outline">
            {players.length} {isDoubles ? 'pairs' : 'players'}
          </Badge>
        </div>
      </header>

      <main className="p-4 sm:p-5">
        <Page />
      </main>
    </div>
  );
}

/**
 * Each category runs as its own draw — its own entry list, pools, fixtures and
 * bracket — so an organiser can run several divisions side by side.
 */
function CategorySwitcher() {
  const { categorySummaries, activeCategoryId, actions } = useTournament();
  const [open, setOpen] = useState(false);
  const active = categorySummaries.find((c) => c.id === activeCategoryId);

  if (categorySummaries.length === 0) return null;
  if (categorySummaries.length === 1) {
    return <Badge tone="outline">{active?.name}</Badge>;
  }

  const progress = (c: (typeof categorySummaries)[number]) => {
    if (c.championId) return "complete";
    if (c.hasBracket) return "knockout";
    if (c.matchesTotal > 0) return `${c.matchesPlayed}/${c.matchesTotal} matches`;
    if (c.poolsAllocated) return "pools set";
    return `${c.players} entries`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11.5px] font-medium text-ink transition-colors hover:bg-subtle"
      >
        {active?.name ?? "Category"}
        <span className="text-ink-faint">▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 overflow-hidden rounded-xl border border-line bg-panel shadow-xl">
          {categorySummaries.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => actions.switchCategory(c.id)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-subtle",
                c.id === activeCategoryId && "bg-subtle font-semibold",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span className="shrink-0 text-[11px] text-ink-faint">{progress(c)}</span>
              {c.championId ? <span className="shrink-0 text-gold">★</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
