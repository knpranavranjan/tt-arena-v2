"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { ArrowUp } from "lucide-react";
import { players, getWeeklyDelta } from "@/lib/mock-data";
import { abbreviateName } from "@/lib/format";

const ranked = [...players].sort((a, b) => b.rating - a.rating).slice(0, 8);
// Tripled so there's always a full extra set on either side of the visible window to drag into.
const loop = [...ranked, ...ranked, ...ranked];

function RankChip({ rank, player }: { rank: number; player: (typeof ranked)[number] }) {
  const [style, api] = useSpring(() => ({
    y: 0,
    scale: 1,
    config: { tension: 300, friction: 18 },
  }));

  return (
    <animated.div style={style} onPointerDown={(e) => e.stopPropagation()}>
      <Link
        href={`/players/${player.id}`}
        onMouseEnter={() => api.start({ y: -4, scale: 1.03 })}
        onMouseLeave={() => api.start({ y: 0, scale: 1 })}
        className="group flex shrink-0 items-center gap-3 border-2 border-white/10 bg-[#14121a] px-5 py-3.5 transition-colors hover:border-[#147dff]/60"
      >
        <span className="text-lg font-normal text-[#0ea5ff]" style={{ fontFamily: "var(--font-concept-display)" }}>
          {String(rank).padStart(2, "0")}
        </span>
        <span className="text-sm font-semibold text-white group-hover:text-[#147dff]">
          {abbreviateName(player.name)}
        </span>
        <span
          className="text-base font-normal tabular-nums text-white"
          style={{ fontFamily: "var(--font-concept-display)" }}
        >
          {player.rating}
        </span>
        <span className="flex items-center gap-0.5 text-xs font-bold tabular-nums text-[#00e676]">
          <ArrowUp className="h-3 w-3" strokeWidth={3} />
          {getWeeklyDelta(player)}
        </span>
      </Link>
    </animated.div>
  );
}

export function ConceptRankings() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);
  const modeRef = useRef<"auto" | "drag" | "settling">("auto");

  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  useEffect(() => {
    if (!trackRef.current) return;
    setWidthRef.current = trackRef.current.scrollWidth / 3;
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let raf: number;
    let last = performance.now();
    const pxPerSecond = 26;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (modeRef.current === "auto") {
        const w = setWidthRef.current;
        let next = x.get() - pxPerSecond * dt;
        if (w > 0 && next <= -w) next += w;
        api.set({ x: next });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, x, api]);

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx], last, memo = x.get() }) => {
      if (active) {
        modeRef.current = "drag";
        api.set({ x: memo + mx });
      } else if (last) {
        modeRef.current = "settling";
        const w = setWidthRef.current;
        api.start({
          x: memo + mx,
          config: { decay: true, velocity: vx * dx * 0.45 },
          onChange: (result) => {
            const v = typeof result.value.x === "number" ? result.value.x : 0;
            if (w > 0 && (v <= -w || v >= 0)) {
              const wrapped = ((v % w) + w) % w;
              api.set({ x: -wrapped });
            }
          },
          onRest: () => {
            modeRef.current = "auto";
          },
        });
      }
      return memo;
    },
    { axis: "x" }
  );

  return (
    <section id="rankings" className="border-y-2 border-white/10 bg-[#0e0d13] py-10">
      <div className="mx-auto mb-5 flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#ff1744] opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-[#ff1744]" />
          </span>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Live Rankings</h2>
          <span className="hidden text-[10px] font-medium uppercase tracking-wide text-white/30 sm:inline">
            — drag to browse
          </span>
        </div>
        <Link href="/players" className="text-sm font-bold uppercase tracking-wide text-[#147dff] hover:underline">
          Full leaderboard
        </Link>
      </div>

      <div className="relative touch-pan-y overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0e0d13] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0e0d13] to-transparent" />

        {reduceMotion ? (
          <div className="flex flex-wrap justify-center gap-3 px-4">
            {ranked.map((player, i) => (
              <RankChip key={player.id} rank={i + 1} player={player} />
            ))}
          </div>
        ) : (
          <animated.div
            {...bind()}
            ref={trackRef}
            className="flex w-max cursor-grab gap-3 px-4 active:cursor-grabbing"
            style={{ x, touchAction: "pan-y" }}
          >
            {loop.map((player, i) => (
              <RankChip key={`${player.id}-${i}`} rank={(i % ranked.length) + 1} player={player} />
            ))}
          </animated.div>
        )}
      </div>
    </section>
  );
}
