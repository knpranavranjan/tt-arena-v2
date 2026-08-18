import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { arenaFontVariables } from "@/lib/fonts";
import { getPlayer, tournaments } from "@/lib/mock-data";
import { formatDate, initials } from "@/lib/format";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const player = getPlayer(playerId);
  if (!player) notFound();

  const history = tournaments.filter((t) => t.registeredPlayerIds.includes(player.id));
  const winPct = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  const resultFor = (tournamentId: string) => {
    const t = tournaments.find((x) => x.id === tournamentId);
    if (!t || t.status !== "COMPLETED") return "—";
    if (t.champion === player.id) return "Champion";
    if (t.runnerUp === player.id) return "Runner-up";
    if (t.semiFinalists?.includes(player.id)) return "Semifinalist";
    return "Participated";
  };

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-12 sm:py-16">
        {/* Hero */}
        <div className="flex flex-col gap-6 rounded-[8px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:flex-row sm:items-center">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#333539] text-2xl font-semibold text-[#e2e2e8]"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            {initials(player.name)}
          </div>
          <div className="flex-1">
            <h1
              className="text-3xl font-bold text-[#e2e2e8]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              {player.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#c2c6d7]">
              {player.clubId ? (
                <Link href={`/clubs/${player.clubId}`} className="flex items-center gap-1.5 hover:text-[#ff8f86]">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {player.clubName}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Unaffiliated
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                {player.state}
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} />
                {player.category} · {player.gender === "MALE" ? "Men's" : "Women's"}
              </span>
            </div>
          </div>
          <div className="rounded-[8px] border border-[#0ea5ff]/40 bg-[#0ea5ff]/10 px-6 py-3 text-center">
            <p
              className="text-xs font-semibold uppercase tracking-widest text-[#0ea5ff]/80"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Rating
            </p>
            <p
              className="text-3xl font-bold tabular-nums text-[#0ea5ff]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              {player.rating}
            </p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <StatBlock label="Matches Played" value={player.wins + player.losses} />
          <StatBlock label="Wins" value={player.wins} />
          <StatBlock label="Losses" value={player.losses} />
          <StatBlock label="Win Rate" value={`${winPct}%`} />
        </div>

        {/* Recent form */}
        <div className="mt-6 rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
            style={{ fontFamily: "var(--font-home-mono)" }}
          >
            Recent Form
          </p>
          <div className="mt-3 flex gap-1.5">
            {player.recentForm.map((r, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  r === "W" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#ff2448]/15 text-[#ff2448]"
                }`}
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Player information */}
        <div className="mt-10">
          <h2
            className="mb-4 text-xl font-bold uppercase tracking-wide text-[#e2e2e8]"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Player Information
          </h2>
          <div className="grid gap-5 rounded-[8px] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2">
            <InfoRow label="Date of Birth" value={formatDate(player.dateOfBirth)} />
            <InfoRow label="Club" value={player.clubName ?? "Unaffiliated"} />
            <InfoRow label="State" value={player.state} />
            <InfoRow label="Category" value={player.category} />
          </div>
        </div>

        {/* Tournament history */}
        <div className="mt-10">
          <h2
            className="mb-4 text-xl font-bold uppercase tracking-wide text-[#e2e2e8]"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Tournament History
          </h2>
          {history.length === 0 ? (
            <EmptyState
              icon={<Calendar />}
              title="No tournament history yet"
              description="This player hasn't participated in any tournaments recorded on the platform."
            />
          ) : (
            <div className="overflow-x-auto rounded-[8px] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Tournament
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Date
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Format
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Result
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.04] ${
                        i % 2 === 1 ? "bg-white/[0.015]" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/tournaments/${t.id}`} className="font-semibold text-[#e2e2e8] hover:text-[#ff8f86]">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#c2c6d7]">{formatDate(t.date)}</td>
                      <td
                        className="px-6 py-4 text-sm uppercase text-[#c2c6d7]"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        {t.format.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#c2c6d7]">{resultFor(t.id)}</td>
                      <td
                        className="px-6 py-4 text-sm uppercase text-[#c2c6d7]"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        {t.status.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4 text-center">
      <p
        className="text-2xl font-bold tabular-nums text-[#e2e2e8]"
        style={{ fontFamily: "var(--font-home-display)" }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-xs uppercase tracking-wide text-[#c2c6d7]"
        style={{ fontFamily: "var(--font-home-mono)" }}
      >
        {label}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]"
        style={{ fontFamily: "var(--font-home-mono)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#e2e2e8]">{value}</p>
    </div>
  );
}
