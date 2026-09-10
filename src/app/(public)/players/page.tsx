"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUp, Search, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { arenaFontVariables } from "@/lib/fonts";
import { clubs, getWeeklyDelta, playerSrId } from "@/lib/mock-data";
import { usePlayerRoster } from "@/lib/players-store";
import { usePlayerRatings } from "@/lib/player-ratings";
import { initials } from "@/lib/format";
import type { Gender, Player } from "@/lib/types";

export default function PlayersPage({ basePath = "/players" }: { basePath?: string }) {
  const [search, setSearch] = useState("");
  const [club, setClub] = useState("all");
  const [state, setState] = useState("all");
  const [gender, setGender] = useState("all");
  const ratings = usePlayerRatings();
  const roster = usePlayerRoster();

  // Created players have no rating override yet — fall back to their profile rating.
  const ratingOf = (p: Player) => ratings.getRating(p.id) || p.rating;

  const states = useMemo(
    () => Array.from(new Set(roster.map((p) => p.state).filter(Boolean))).sort(),
    [roster],
  );

  const filtered = useMemo(() => {
    const result = roster.filter((p) => {
      if (search) {
        const q = search.toLowerCase().trim();
        if (
          !p.name.toLowerCase().includes(q) &&
          !playerSrId(p.id).toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (club !== "all" && p.clubId !== club) return false;
      if (state !== "all" && p.state !== state) return false;
      if (gender !== "all" && p.gender !== (gender as Gender)) return false;
      return true;
    });
    return [...result].sort((a, b) => ratingOf(b) - ratingOf(a));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, club, state, gender, ratings, roster]);

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Hero */}
      <section className="relative mx-auto flex min-h-[340px] w-full max-w-[1280px] flex-col justify-center overflow-hidden px-4 pb-12 pt-12 sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "radial-gradient(circle at 30% 50%, rgba(255,36,72,0.1) 0%, transparent 60%)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-[700px]">
          <h1
            className="font-extrabold uppercase leading-tight tracking-tighter text-[#e2e2e8]"
            style={{ fontFamily: "var(--font-home-display)", fontSize: "clamp(48px, 6vw, 88px)" }}
          >
            The <span className="text-[#ff8f86]">Players</span>
          </h1>
          <p
            className="mt-4 text-[#e2e2e8]/70"
            style={{ fontFamily: "var(--font-home-display)", fontSize: "clamp(12px, 1.5vw, 22px)" }}
          >
            Every match tells a story.
          </p>
        </div>
      </section>

      {/* Search & filters */}
      <section className="mx-auto mb-8 w-full max-w-[1280px] px-4 sm:px-12">
        <div className="flex flex-col gap-4 rounded-[8px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:p-6">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d7]" />
            <input
              type="text"
              placeholder="Search players by name or SPINID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] py-3 pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#c2c6d7]/50 focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-4 sm:grid-cols-3">
            <Select value={club} onValueChange={(v) => setClub(v ?? "all")}>
              <SelectTrigger className="w-full border-white/10 bg-[#1a1c20] text-[#e2e2e8]">
                <SelectValue>
                  {(value: string) => (value === "all" ? "Club" : (clubs.find((c) => c.id === value)?.name ?? "Club"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Club</SelectItem>
                {clubs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={state} onValueChange={(v) => setState(v ?? "all")}>
              <SelectTrigger className="w-full border-white/10 bg-[#1a1c20] text-[#e2e2e8]">
                <SelectValue>{(value: string) => (value === "all" ? "State" : value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">State</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gender} onValueChange={(v) => setGender(v ?? "all")}>
              <SelectTrigger className="w-full border-white/10 bg-[#1a1c20] text-[#e2e2e8]">
                <SelectValue>
                  {(value: string) => (value === "all" ? "Gender" : value === "MALE" ? "Male" : "Female")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Gender</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-24 sm:px-12">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No players match your filters"
            description="Try adjusting your search or clearing a filter."
          />
        ) : (
          <>
            {/* Desktop: ranked table */}
            <div className="hidden overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] backdrop-blur-xl md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th
                      className="w-20 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Rank
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Player
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      SPINID
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Club
                    </th>
                    <th
                      className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Rating
                    </th>
                    <th
                      className="w-32 px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Movement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((player, i) => (
                    <tr
                      key={player.id}
                      className={`group cursor-pointer border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.04] ${
                        i % 2 === 1 ? "bg-white/[0.015]" : ""
                      }`}
                    >
                      <td className="px-6 py-5">
                        <span
                          className="text-2xl text-[#ff8f86]"
                          style={{ fontFamily: "var(--font-home-display)" }}
                        >
                          #{String(i + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Link href={`${basePath}/${player.id}`} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#333539] text-xs font-semibold text-[#e2e2e8]">
                            {initials(player.name)}
                          </div>
                          <span className="text-[18px] font-semibold text-[#e2e2e8] group-hover:text-[#ff8f86]">
                            {player.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className="rounded-full border border-[#ff2448]/30 bg-[#ff2448]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#ff8f86]"
                          style={{ fontFamily: "var(--font-home-mono)" }}
                        >
                          {playerSrId(player.id)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[#c2c6d7]">{player.clubName ?? "Unaffiliated"}</td>
                      <td
                        className="px-6 py-5 text-right text-base font-bold text-[#e2e2e8]"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        {ratingOf(player)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span
                          className="inline-flex items-center gap-1 rounded-[2px] bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-400"
                          style={{ fontFamily: "var(--font-home-mono)" }}
                        >
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {getWeeklyDelta(player)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card grid */}
            <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
              {filtered.map((player, i) => (
                <RevealItem key={player.id}>
                  <Link
                    href={`${basePath}/${player.id}`}
                    className="relative flex flex-col gap-4 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
                  >
                    <span
                      className="absolute right-4 top-4 text-3xl leading-none text-[#e2e2e8]/10"
                      style={{ fontFamily: "var(--font-home-display)" }}
                    >
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] border border-white/10 bg-[#333539] font-semibold text-[#c2c6d7]">
                        {initials(player.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-[18px] font-semibold leading-tight text-[#e2e2e8]">
                          {player.name}
                        </h3>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#c2c6d7]">
                          <span
                            className="rounded-full border border-[#ff2448]/30 bg-[#ff2448]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#ff8f86]"
                            style={{ fontFamily: "var(--font-home-mono)" }}
                          >
                            {playerSrId(player.id)}
                          </span>
                          <span className="truncate">{player.clubName ?? "Unaffiliated"}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between border-t border-white/10 pt-3">
                      <div className="flex flex-col">
                        <span
                          className="mb-1 text-[10px] uppercase tracking-wide text-[#c2c6d7]"
                          style={{ fontFamily: "var(--font-home-mono)" }}
                        >
                          Rating
                        </span>
                        <span className="text-lg font-bold text-[#ff8f86]" style={{ fontFamily: "var(--font-home-mono)" }}>
                          {ratingOf(player)}
                        </span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-[2px] bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-400"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {getWeeklyDelta(player)}
                      </span>
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        )}
      </section>
    </div>
  );
}
