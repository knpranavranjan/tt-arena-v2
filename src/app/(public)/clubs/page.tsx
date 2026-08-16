"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Search, Users, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArenaPhotoBackdrop } from "@/components/media/arena-photo-backdrop";
import { arenaFontVariables } from "@/lib/fonts";
import { clubs, players } from "@/lib/mock-data";
import type { Club } from "@/lib/types";

const states = Array.from(new Set(clubs.map((c) => c.state))).sort();

function topPlayerOf(club: Club) {
  return players
    .filter((p) => p.clubId === club.id)
    .sort((a, b) => b.rating - a.rating)[0];
}

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");

  const filtered = useMemo(() => {
    return clubs.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (state !== "all" && c.state !== state) return false;
      return true;
    });
  }, [search, state]);

  // Only spotlight a featured club when it's actually part of the current filtered results —
  // otherwise a search/state filter would still show an unrelated club up top.
  const featured = [...filtered].sort((a, b) => b.playerIds.length - a.playerIds.length)[0];
  const gridClubs = filtered.filter((c) => c.id !== featured?.id);
  const featuredTop = featured ? topPlayerOf(featured) : undefined;

  return (
    <div className={`relative ${arenaFontVariables}`} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Atmospheric background glows, fixed behind the whole page. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-10%] top-[15%] h-[40%] w-[40%] rounded-full bg-[#c40019]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] h-[45%] w-[45%] rounded-full bg-[#147dff]/8 blur-[140px]" />
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[520px] items-center overflow-hidden bg-[#111318] py-20">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src="/clubhero/club.png"
            alt="A single table tennis table lit by cool blue and red rim light in an otherwise dark arena."
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Left-to-right scrim keeps the copy legible, tapering off so the table stays visible on the right. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111318_0%,rgba(17,19,24,0.88)_35%,rgba(17,19,24,0.35)_65%,rgba(17,19,24,0.15)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-[#111318]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_50%,transparent_55%,rgba(0,0,0,0.35)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-12">
          <div className="max-w-2xl">
            <h1
              className="mb-6 text-[48px] font-extrabold uppercase leading-tight tracking-tighter text-[#e2e2e8] drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:text-[72px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              The{" "}
              <span className="text-[#ff8f86] drop-shadow-[0_0_22px_rgba(196,0,25,0.6)]">
                Clubs
              </span>
            </h1>
            <p className="max-w-xl text-lg text-[#c2c6d7] drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
              Discover and join the country&apos;s most prestigious table tennis clubs for
              competitive play.
            </p>
          </div>
        </div>
      </section>

      {/* Discovery bar */}
      <section className="relative z-20 mx-auto mb-12 w-full max-w-[1280px] px-4 sm:px-12">
        <div className="flex flex-col items-stretch gap-4 md:flex-row">
          <div className="relative flex-grow">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d7]" />
            <input
              type="text"
              placeholder="Search clubs by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] py-4 pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#c2c6d7]/50 focus:border-[#c40019] focus:outline-none focus:ring-1 focus:ring-[#c40019]"
            />
          </div>
          <Select value={state} onValueChange={(v) => setState(v ?? "all")}>
            <SelectTrigger className="w-full border-white/10 bg-[#1a1c20] py-4 text-[#e2e2e8] md:w-56">
              <SelectValue>{(value: string) => (value === "all" ? "State" : value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">State</SelectItem>
              {states.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-24 sm:px-12">
          <EmptyState
            icon={<Building2 />}
            title="No clubs match your filters"
            description="Try a different search or state."
          />
        </section>
      ) : (
        <>
          {/* Featured club */}
          {featured && (
            <section className="relative z-10 mx-auto mb-20 w-full max-w-[1280px] px-4 sm:px-12">
              <Link
                href={`/clubs/${featured.id}`}
                className="group relative flex flex-col overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-xl transition-all duration-300 hover:border-[#c40019]/50 hover:shadow-[0_0_30px_rgba(196,0,25,0.15)] md:flex-row"
              >
                <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-[2px] border border-[#c40019]/30 bg-[#111318]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff8f86] backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c40019]" />
                  Featured
                </span>
                <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-3/5">
                  <ArenaPhotoBackdrop variant="subtle" />
                </div>
                <div className="flex w-full flex-col justify-center p-8 md:w-2/5">
                  <h2 className="mb-2 text-2xl font-bold text-[#e2e2e8] sm:text-[28px]">{featured.name}</h2>
                  <p className="mb-6 flex items-center gap-1.5 text-[#c2c6d7]">
                    <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {featured.location}, {featured.state}
                  </p>
                  <div className="mb-8 flex gap-6">
                    <div>
                      <div
                        className="mb-1 text-xs uppercase tracking-wide text-[#c2c6d7]"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        Players
                      </div>
                      <div className="text-2xl font-bold text-[#e2e2e8]">{featured.playerIds.length}</div>
                    </div>
                    {featuredTop && (
                      <div>
                        <div
                          className="mb-1 text-xs uppercase tracking-wide text-[#c2c6d7]"
                          style={{ fontFamily: "var(--font-home-mono)" }}
                        >
                          Club Rating
                        </div>
                        <div className="text-2xl font-bold text-[#e2e2e8]">{featuredTop.rating}</div>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-[4px] border border-[#c40019] bg-[#c40019]/10 px-6 py-3 text-sm font-semibold text-[#ff8f86] shadow-[0_0_15px_rgba(196,0,25,0.2)] transition-all group-hover:bg-[#c40019] group-hover:text-white group-hover:shadow-[0_0_25px_rgba(196,0,25,0.6)]">
                    Enter Arena
                    <Zap className="h-4 w-4 transition-transform group-hover:scale-110" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </section>
          )}

          {/* Club grid */}
          <section className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-24 sm:px-12">
            <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gridClubs.map((club) => {
                const top = topPlayerOf(club);
                return (
                  <RevealItem key={club.id}>
                    <Link
                      href={`/clubs/${club.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#c40019]/40 hover:shadow-[0_0_25px_rgba(196,0,25,0.18)]"
                    >
                      <div className="relative h-40 overflow-hidden">
                        <ArenaPhotoBackdrop variant="subtle" />
                      </div>
                      <div className="relative flex flex-1 flex-col p-6">
                        <div
                          className="absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c40019]/50 to-transparent"
                          aria-hidden="true"
                        />
                        <h3 className="mb-1 text-lg font-bold text-[#e2e2e8]">{club.name}</h3>
                        <p className="mb-4 flex items-center gap-1 text-sm text-[#c2c6d7]">
                          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                          {club.location}, {club.state}
                        </p>
                        <p className="mb-6 line-clamp-2 text-sm text-[#c2c6d7]">{club.description}</p>
                        <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
                          <div className="flex items-center gap-1.5 text-sm text-[#e2e2e8]">
                            <Users className="h-3.5 w-3.5 text-[#c2c6d7]" strokeWidth={1.5} />
                            {club.playerIds.length} players
                          </div>
                          {top && (
                            <div className="text-right">
                              <div
                                className="mb-1 text-[10px] uppercase tracking-wide text-[#c2c6d7]"
                                style={{ fontFamily: "var(--font-home-mono)" }}
                              >
                                Club Rating
                              </div>
                              <div className="text-lg font-bold text-[#ff8f86]" style={{ fontFamily: "var(--font-home-mono)" }}>
                                {top.rating}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </section>
        </>
      )}
    </div>
  );
}
