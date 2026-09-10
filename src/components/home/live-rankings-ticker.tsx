"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUp } from "lucide-react";
import { getWeeklyDelta } from "@/lib/mock-data";
import { usePlayerRoster } from "@/lib/players-store";
import type { Player } from "@/lib/types";
import { abbreviateName, initials } from "@/lib/format";

function RankCard({ rank, player }: { rank: number; player: Player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex w-64 shrink-0 items-center gap-3 rounded-[4px] border border-white/10 bg-white/[0.04] px-4 py-2.5 backdrop-blur-xl transition-colors hover:border-white/20"
    >
      <span
        className="text-lg text-[#ff8f86]"
        style={{ fontFamily: "var(--font-home-mono)" }}
      >
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#333539] text-xs font-semibold text-[#c2c6d7]">
        {initials(player.name)}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-[#e2e2e8]">{abbreviateName(player.name)}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-mono)" }}>
            {player.rating}
          </span>
          <span className="flex items-center text-xs text-emerald-400">
            <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
            {getWeeklyDelta(player)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function LiveRankingsTicker() {
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const roster = usePlayerRoster();
  const ranked = useMemo(
    () => [...roster].sort((a, b) => b.rating - a.rating).slice(0, 8),
    [roster],
  );

  return (
    <section
      id="rankings"
      className="relative z-30 -mt-10 overflow-hidden border-y border-white/10 bg-[#0c0e12]/80 py-4 backdrop-blur-md"
    >
      <div className="flex w-full items-center px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="z-10 mr-8 flex shrink-0 items-center gap-2 bg-[#0c0e12]/90 py-2 pr-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#ff2448] opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-[#ff2448]" />
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-[0.15em] text-[#e2e2e8]"
            style={{ fontFamily: "var(--font-home-mono)" }}
          >
            Live Rankings
          </span>
        </div>

        <div
          className="relative flex-grow overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {reduceMotion ? (
            <div className="flex flex-wrap gap-4 py-2">
              {ranked.map((player, i) => (
                <RankCard key={player.id} rank={i + 1} player={player} />
              ))}
            </div>
          ) : (
            <motion.div
              className="flex w-max gap-4 py-2"
              animate={paused ? undefined : { x: ["0%", "-50%"] }}
              transition={{ duration: 32, ease: "linear", repeat: Infinity }}
            >
              {[...ranked, ...ranked].map((player, i) => (
                <RankCard key={`${player.id}-${i}`} rank={(i % ranked.length) + 1} player={player} />
              ))}
            </motion.div>
          )}
        </div>

        <Link
          href="/players"
          className="z-10 ml-8 hidden shrink-0 items-center gap-1 whitespace-nowrap bg-[#0c0e12]/90 py-2 pl-4 text-sm text-[#ff8f86] transition-colors hover:text-[#ff2448] md:flex"
        >
          Full leaderboard
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
