"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, Trophy, Users, Zap, type LucideIcon } from "lucide-react";
import { arenaFontVariables } from "@/lib/fonts";
import { SrIdBadge } from "@/components/layout/sr-id-badge";
import { useAuth } from "@/lib/auth";
import { ownsTournament } from "@/lib/tournament-owner";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { buildEventGroups, categoryCountLabel, mostActiveStatus, type EventGroup } from "@/lib/event-groups";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { formatDate } from "@/lib/format";
import type { TournamentStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

function tournamentStatusMeta(status: TournamentStatus): { label: string; textClass: string; accent: string } {
  switch (status) {
    case "REGISTRATION_OPEN":
      return { label: "Registration Open", textClass: "text-[#ff8f86]", accent: "#ff2448" };
    case "POOLS":
      return { label: "Pools In Progress", textClass: "text-[#ff8f86]", accent: "#ff2448" };
    case "KNOCKOUT":
      return { label: "Knockout In Progress", textClass: "text-[#ff8f86]", accent: "#ff2448" };
    case "SEEDING":
      return { label: "Seeding", textClass: "text-amber-300", accent: "#fbbf24" };
    case "REGISTRATION_CLOSED":
      return { label: "Registration Closed", textClass: "text-amber-300", accent: "#fbbf24" };
    case "DRAFT":
      return { label: "Draft", textClass: "text-[#8b8b93]", accent: "rgba(255,255,255,0.25)" };
    case "COMPLETED":
      return { label: "Completed", textClass: "text-[#8b8b93]", accent: "rgba(255,255,255,0.25)" };
  }
}

function TournamentHostingCard({ group }: { group: EventGroup & { status: TournamentStatus } }) {
  const meta = tournamentStatusMeta(group.status);
  return (
    <Link
      href={`/host/tournaments/${group.primary.id}`}
      className="block rounded-[6px] border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:border-white/20"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.accent }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-[10px] font-bold uppercase tracking-wide ${meta.textClass}`} style={mono}>
          {meta.label}
        </p>
        <span
          className="rounded-[2px] border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#c2c6d7]"
          style={mono}
        >
          {categoryCountLabel(group)}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-[#e2e2e8]">{group.name}</p>
      <p className="mt-1 text-xs text-[#8b8b93]">
        {formatDate(group.date)} &middot; {group.venue}
      </p>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
          {label}
        </p>
        <Icon className={`h-4 w-4 ${accent ? "text-[#ff8f86]" : "text-[#5a5a60]"}`} strokeWidth={1.75} />
      </div>
      <p className={`text-2xl font-extrabold ${accent ? "text-[#ff8f86]" : "text-[#e2e2e8]"}`} style={display}>
        {value}
      </p>
    </div>
  );
}

export default function HostDashboardPage() {
  const { user } = useAuth();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { overrides } = useTournamentStatus();

  // Only tournaments THIS account created through "Host a Tournament", matched
  // by the creator's SPINID (`organizerId`) — never the display name. One card
  // per event: the categories a host adds are folded into their event, so a
  // 2-category submission is a single row, not two. Admin approval is a status
  // override, so an approved event shows up the moment it goes live.
  const groups = useMemo(() => {
    if (!user) return [];
    const mine = allTournaments.filter((t) => ownsTournament(t, user));
    return buildEventGroups(mine, allEvents).map((g) => ({
      ...g,
      status: mostActiveStatus(g.categories.map((c) => effectiveStatus(c, overrides))),
    }));
  }, [user, allTournaments, allEvents, overrides]);

  const activeTournaments = [...groups]
    .filter((g) => g.status !== "DRAFT" && g.status !== "COMPLETED")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completedTournaments = groups.filter((g) => g.status === "COMPLETED");
  const totalRegistrations = groups.reduce((sum, g) => sum + g.registeredCount, 0);

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
            Host Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#8b8b93]">The tournaments you&apos;re hosting.</p>
          <SrIdBadge className="mt-3" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/host-tournament"
            className="flex items-center gap-1.5 rounded-[2px] border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
            style={mono}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Create Tournament
          </Link>
          <Link
            href="/host/tournaments"
            className="flex items-center gap-1.5 rounded-[2px] bg-[#ff2448] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_-4px_#ff2448] active:scale-95"
            style={mono}
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
            Manage Tournaments
          </Link>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Trophy} label="Total Tournaments" value={String(groups.length)} />
        <StatCard icon={Zap} label="Active Tournaments" value={String(activeTournaments.length)} accent />
        <StatCard icon={Users} label="Total Registered Players" value={String(totalRegistrations)} />
        <StatCard icon={CheckCircle2} label="Completed" value={String(completedTournaments.length)} />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
          Tournaments You&apos;re Hosting
        </h2>
        {activeTournaments.length === 0 ? (
          <p className="text-sm text-[#8b8b93]">
            No active tournaments right now. Get started from{" "}
            <Link href="/host-tournament" className="text-[#ff8f86] hover:text-[#ff2448]">
              Create Tournament
            </Link>
            .
          </p>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {activeTournaments.map((g) => (
              <TournamentHostingCard key={g.eventId} group={g} />
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/host/tournaments"
            className="flex flex-1 items-center justify-center rounded-[2px] bg-[#ff2448] py-3 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_-4px_#ff2448] active:scale-95"
            style={mono}
          >
            Manage Tournaments
          </Link>
          <Link
            href="/host/events"
            className="flex flex-1 items-center justify-center rounded-[2px] border border-[#ff2448]/40 bg-[#ff2448]/10 py-3 text-xs font-semibold uppercase tracking-wide text-[#ff8f86] transition-colors hover:border-[#ff2448] hover:bg-[#ff2448]/15"
            style={mono}
          >
            View All Events
          </Link>
        </div>
      </section>
    </div>
  );
}
