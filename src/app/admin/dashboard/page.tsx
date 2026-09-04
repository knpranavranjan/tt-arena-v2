"use client";

import Link from "next/link";
import {
  Activity,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { arenaFontVariables } from "@/lib/fonts";
import { appUsers, clubs, events, players, tournaments, tournamentCode } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import type { TournamentStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

const activityFeed = [
  { time: "2 min ago", text: "Player Sneha Iyer registered for TT Open 2026 — Senior Singles" },
  { time: "18 min ago", text: "Host Karnataka TTA Ops closed registration for Monsoon Cup — Open Singles" },
  { time: "1 hr ago", text: "Rating export sent for Eastern Regional Championship" },
  { time: "3 hrs ago", text: "New club SpinForge Academy verified" },
];

function statusMeta(status: TournamentStatus): { label: string; className: string; live: boolean } {
  switch (status) {
    case "REGISTRATION_OPEN":
      return { label: "Registration Open", className: "bg-[#ff2448] text-white", live: false };
    case "POOLS":
      return { label: "Pools In Progress", className: "bg-[#ff2448] text-white", live: true };
    case "KNOCKOUT":
      return { label: "Live", className: "bg-[#ff2448] text-white", live: true };
    case "SEEDING":
      return { label: "Seeding", className: "border border-amber-400/40 bg-amber-400/10 text-amber-300", live: false };
    case "REGISTRATION_CLOSED":
      return { label: "Registration Closed", className: "border border-amber-400/40 bg-amber-400/10 text-amber-300", live: false };
    case "DRAFT":
      return { label: "Draft", className: "border border-white/20 bg-[#111318]/80 text-[#8b8b93]", live: false };
    case "COMPLETED":
      return { label: "Completed", className: "border border-white/20 bg-[#111318]/80 text-[#e2e2e8]", live: false };
  }
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

export default function AdminDashboardPage() {
  const { overrides, approve } = useTournamentStatus();
  const withStatus = tournaments.map((t) => ({ t, status: effectiveStatus(t, overrides) }));
  const pendingApproval = withStatus.filter((r) => r.status === "DRAFT");
  const activeTournaments = withStatus.filter((r) => !["DRAFT", "COMPLETED"].includes(r.status));
  const completedTournaments = withStatus.filter((r) => r.status === "COMPLETED");
  const liveEvents = events.filter((e) => e.status === "LIVE");
  const recentTournaments = [...tournaments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">
          Platform-wide oversight across every player, club, and tournament.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Players" value={String(players.length)} />
        <StatCard icon={Building2} label="Total Clubs" value={String(clubs.length)} />
        <StatCard icon={Trophy} label="Total Tournaments" value={String(tournaments.length)} accent />
        <StatCard icon={ShieldCheck} label="Platform Users" value={String(appUsers.length)} />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Trophy} label="Active Tournaments" value={String(activeTournaments.length)} accent />
        <StatCard icon={Trophy} label="Completed Tournaments" value={String(completedTournaments.length)} />
        <StatCard icon={Calendar} label="Total Events" value={String(events.length)} />
        <StatCard icon={Calendar} label="Live Events" value={String(liveEvents.length)} accent />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link
          href="/players"
          className="flex items-center justify-center gap-1.5 rounded-[2px] bg-[#ff2448] py-3 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_-4px_#ff2448] active:scale-95"
          style={mono}
        >
          <Users className="h-3.5 w-3.5" strokeWidth={2} />
          View All Players
        </Link>
        <Link
          href="/clubs"
          className="flex items-center justify-center gap-1.5 rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
          style={mono}
        >
          <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
          View All Clubs
        </Link>
        <Link
          href="/events"
          className="flex items-center justify-center gap-1.5 rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
          style={mono}
        >
          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
          View All Events
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          Pending Approval
          {pendingApproval.length > 0 && (
            <span className="rounded-full bg-[#ff2448]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff8f86]">
              {pendingApproval.length}
            </span>
          )}
        </h2>
        {pendingApproval.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-white/15 p-6 text-center text-xs text-[#8b8b93]">
            No tournaments waiting for review.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingApproval.map(({ t }) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-white/10 bg-white/[0.03] p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#e2e2e8]">{t.name}</p>
                  <p className="mt-0.5 text-xs text-[#8b8b93]">
                    #{tournamentCode(t)} &middot; Hosted by {t.organizer} &middot; {formatDate(t.date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    approve(t.id);
                    toast.success("Tournament approved", {
                      description: `${t.name} is live — its Matches workspace is now open.`,
                    });
                  }}
                  className="shrink-0 rounded-[2px] bg-[#ff2448] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] active:scale-95"
                  style={mono}
                >
                  Approve &amp; Go Live
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
            Tournament Oversight
          </h2>
          <div className="space-y-2">
            {recentTournaments.map((t) => {
              const meta = statusMeta(t.status);
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="flex items-center justify-between gap-3 rounded-[6px] border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:border-white/20"
                >
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
                        style={mono}
                      >
                        {meta.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
                        {meta.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-[#5a5a60]" style={mono}>
                        #{tournamentCode(t)}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold text-[#e2e2e8]">{t.name}</p>
                    <p className="mt-0.5 text-xs text-[#8b8b93]">
                      Hosted by {t.organizer} &middot; {formatDate(t.date)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#5a5a60]" strokeWidth={2} />
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
            <Activity className="h-3.5 w-3.5" strokeWidth={2} />
            System Activity
          </h2>
          <div className="flex flex-col gap-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
            {activityFeed.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2448]" />
                <div>
                  <p className="text-[#e2e2e8]">{a.text}</p>
                  <p className="mt-0.5 text-xs text-[#8b8b93]">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#5a5a60]">Last synced {formatDate(new Date().toISOString())}</p>
        </section>
      </div>
    </div>
  );
}
