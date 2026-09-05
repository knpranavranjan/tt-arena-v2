import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  Bath,
  Calendar,
  CheckCircle2,
  Droplet,
  Info,
  LayoutGrid,
  Lightbulb,
  Mail,
  Map as MapIcon,
  MapPin,
  Navigation,
  ParkingCircle,
  Phone,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Table2,
  Users,
} from "lucide-react";
import { arenaFontVariables } from "@/lib/fonts";
import { getClub, getClubPlayers, events, tournaments } from "@/lib/mock-data";
import { formatDate, initials } from "@/lib/format";
import { JoinClubButton } from "@/components/club/join-club-button";
import { LiveRating } from "@/components/players/live-rating";
import type { Player, TTEvent } from "@/lib/types";

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = getClub(clubId);
  if (!club) notFound();

  const clubPlayers = getClubPlayers(club.id).sort((a, b) => b.rating - a.rating);
  const clubEvents = [...events]
    .filter((e) => e.participatingClubIds.includes(club.id))
    .sort((a, b) => (a.status === "LIVE" ? -1 : b.status === "LIVE" ? 1 : 0));
  // The club chose its map spot at sign-up: an exact "current location" pin, or
  // (the default) the address itself. Either way it feeds the same map query.
  const mapQuery = club.coordinates
    ? `${club.coordinates.lat},${club.coordinates.lng}`
    : encodeURIComponent(club.address);
  const f = club.facilities;

  const facilityCards: { icon: ReactNode; title: string; detail: string }[] = [
    { icon: <Table2 className="h-5 w-5" strokeWidth={1.5} />, title: `${f.tableCount} Tables`, detail: f.tableVarieties },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, title: f.floorType, detail: f.floorGrade },
    { icon: <Lightbulb className="h-5 w-5" strokeWidth={1.5} />, title: "LED Lighting", detail: f.lighting },
    {
      icon: <Snowflake className="h-5 w-5" strokeWidth={1.5} />,
      title: f.isAirConditioned ? "Fully AC" : "Non-AC",
      detail: f.isAirConditioned ? "Climate Controlled" : "Natural Ventilation",
    },
    {
      icon: <Bath className="h-5 w-5" strokeWidth={1.5} />,
      title: "Washrooms",
      detail: f.hasWashroom ? "Available" : "Not Available",
    },
    {
      icon: <ParkingCircle className="h-5 w-5" strokeWidth={1.5} />,
      title: "Parking",
      detail: f.hasParking ? "Ample Space" : "Not Available",
    },
    {
      icon: <Droplet className="h-5 w-5" strokeWidth={1.5} />,
      title: "RO Water",
      detail: f.hasROWater ? "Purified" : "Not Available",
    },
    { icon: <Armchair className="h-5 w-5" strokeWidth={1.5} />, title: `Seating (${f.seatingCapacity}+)`, detail: "Spectator Area" },
  ];

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Banner */}
      <div className="relative h-[200px] w-full overflow-hidden sm:h-[240px]">
        <Image
          src="/clubhero/club.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-[#050a12]/50 to-[#050a12]/10" />
      </div>

      {/* Club header */}
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-12">
        <div className="relative z-10 -mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {club.verified && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2448]/40 bg-[#111318]/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ff8f86] backdrop-blur"
                  style={{ fontFamily: "var(--font-home-mono)" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Verified Club
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-[#c2c6d7]">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                {club.location}, {club.state}
              </span>
            </div>
            <h1
              className="mb-4 text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight text-[#e2e2e8] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-[46px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              {club.name}
            </h1>
            <p className="max-w-xl text-sm text-[#c2c6d7] sm:text-base">{club.description}</p>
          </div>

          <div className="w-full shrink-0 lg:w-[320px]">
            <div className="flex divide-x divide-white/10 rounded-[4px] border border-white/10 bg-white/[0.04] backdrop-blur-xl">
              <StatCell value={clubPlayers.length} label="Players" />
              <StatCell value={clubEvents.length} label="Events" />
            </div>
            <JoinClubButton clubId={club.id} clubName={club.name} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto mt-10 grid w-full max-w-[1280px] gap-10 px-4 pb-24 sm:px-12 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="min-w-0 space-y-12">
          <section>
            <SectionHeading icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />} title="Facilities" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facilityCards.map((card) => (
                <FacilityCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading icon={<Info className="h-5 w-5" strokeWidth={1.75} />} title="About Club" />
            <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm leading-relaxed text-[#c2c6d7]">{club.description}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {club.aboutHighlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2 text-sm text-[#c2c6d7]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff2448]" strokeWidth={2} />
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-10">
          <section>
            <SectionHeading icon={<MapIcon className="h-5 w-5" strokeWidth={1.75} />} title="Location" />
            <div className="overflow-hidden rounded-[8px] border border-white/10">
              <iframe
                title={`Map showing ${club.name}`}
                src={`https://www.google.com/maps?q=${mapQuery}&z=16&output=embed`}
                className="h-40 w-full grayscale invert-[0.9] contrast-[0.85]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 space-y-4 rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
              <ContactRow icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />} label="Address" value={club.address} />
              <ContactRow
                icon={<Phone className="h-4 w-4" strokeWidth={1.5} />}
                label="Phone"
                value={club.phone}
                href={`tel:${club.phone.replace(/\s+/g, "")}`}
              />
              <ContactRow
                icon={<Mail className="h-4 w-4" strokeWidth={1.5} />}
                label="Email"
                value={club.email}
                href={`mailto:${club.email}`}
                accent
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              <Navigation className="h-3.5 w-3.5" strokeWidth={1.75} />
              Get Directions
            </a>
          </section>

          <section>
            <SectionHeading icon={<Users className="h-5 w-5" strokeWidth={1.75} />} title={`Club Players (${clubPlayers.length})`} noMargin />
            {clubPlayers.length === 0 ? (
              <p className="mt-3 text-sm text-[#8b8b93]">No players yet.</p>
            ) : (
              <div
                className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.18) transparent" }}
              >
                {clubPlayers.map((p) => (
                  <PlayerRow key={p.id} player={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />} title={`Club Events (${clubEvents.length})`} noMargin />
            {clubEvents.length === 0 ? (
              <p className="mt-3 text-sm text-[#8b8b93]">No events yet.</p>
            ) : (
              <div
                className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.18) transparent" }}
              >
                {clubEvents.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCell({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex-1 px-3 py-4 text-center">
      <p className="text-2xl font-extrabold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-[#8b8b93]" style={{ fontFamily: "var(--font-home-mono)" }}>
        {label}
      </p>
    </div>
  );
}

function SectionHeading({ icon, title, noMargin }: { icon: ReactNode; title: string; noMargin?: boolean }) {
  return (
    <h2
      className={`flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-xl ${noMargin ? "" : "mb-4"}`}
      style={{ fontFamily: "var(--font-home-display)" }}
    >
      <span className="text-[#ff2448]">{icon}</span>
      {title}
    </h2>
  );
}

function FacilityCard({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.03] p-4 text-center transition-colors hover:border-white/20">
      <span className="text-[#ff8f86]">{icon}</span>
      <p className="text-sm font-semibold text-[#e2e2e8]">{title}</p>
      <p className="text-[11px] leading-snug text-[#8b8b93]">{detail}</p>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#ff8f86]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-[#8b8b93]" style={{ fontFamily: "var(--font-home-mono)" }}>
          {label}
        </p>
        <p className={`break-words text-sm ${accent ? "text-[#ff8f86]" : "text-[#e2e2e8]"}`}>{value}</p>
      </div>
    </div>
  );
  if (!href) return content;
  return (
    <a href={href} className="block transition-opacity hover:opacity-80">
      {content}
    </a>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 rounded-[4px] border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#333539] text-xs font-semibold text-[#c2c6d7]">
        {initials(player.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#e2e2e8]">{player.name}</p>
        <p className="truncate text-xs uppercase tracking-wide text-[#8b8b93]">{player.playStyle}</p>
      </div>
      <LiveRating
        playerId={player.id}
        className="shrink-0 rounded-[2px] bg-[#ff2448]/15 px-2 py-1 text-xs font-bold text-[#ff8f86]"
        style={{ fontFamily: "var(--font-home-mono)" }}
      />
    </Link>
  );
}

function EventRow({ event }: { event: TTEvent }) {
  const statusClass =
    event.status === "LIVE"
      ? "bg-[#ff2448] text-white"
      : event.status === "UPCOMING"
        ? "border border-white/20 text-[#e2e2e8]"
        : "bg-white/10 text-[#8b8b93]";
  const statusLabel = event.status === "LIVE" ? "Live Now" : event.status === "UPCOMING" ? "Upcoming" : "Completed";

  // Send visitors straight to the tournament page (registration, format, results) —
  // prefer the category currently open for registration, else just the first one.
  const eventTournaments = tournaments.filter((t) => event.tournamentIds.includes(t.id));
  const targetTournament = eventTournaments.find((t) => t.status === "REGISTRATION_OPEN") ?? eventTournaments[0];
  const href = targetTournament ? `/tournaments/${targetTournament.id}` : `/events/${event.id}`;

  return (
    <Link
      href={href}
      className="block rounded-[4px] border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`inline-block rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase ${statusClass}`}
          style={{ fontFamily: "var(--font-home-mono)" }}
        >
          {statusLabel}
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#8b8b93]">{formatDate(event.date)}</span>
      </div>
      <p className="text-sm font-semibold text-[#e2e2e8]">{event.name}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-[#8b8b93]">
        <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
        {event.venue}
      </p>
    </Link>
  );
}
