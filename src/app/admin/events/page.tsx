"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { events } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

function eventStatusMeta(status: EventStatus): { label: string; className: string; live: boolean } {
  switch (status) {
    case "LIVE":
      return { label: "Live", className: "bg-[#ff2448] text-white", live: true };
    case "UPCOMING":
      return { label: "Upcoming", className: "border border-amber-400/40 bg-amber-400/10 text-amber-300", live: false };
    case "COMPLETED":
      return { label: "Completed", className: "border border-white/20 bg-[#111318]/80 text-[#e2e2e8]", live: false };
  }
}

export default function AdminEventsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      events
        .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [search],
  );

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Events
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">Every event hosted on the platform.</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b93]" />
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] py-3 pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <p className="text-sm font-semibold text-[#e2e2e8]">No events found</p>
          <p className="mt-1 text-xs text-[#8b8b93]">Try a different search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-white/10">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Organizer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 text-right font-semibold">Tournaments</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const meta = eventStatusMeta(e.status);
                return (
                  <tr key={e.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3.5">
                      <Link href={`/events/${e.id}`} className="font-medium text-[#e2e2e8] hover:text-[#ff8f86]">
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[#8b8b93]">{e.organizer}</td>
                    <td className="px-4 py-3.5 text-[#8b8b93]">{formatDate(e.date)}</td>
                    <td className="px-4 py-3.5 text-[#8b8b93]">{e.location}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-[#8b8b93]">{e.tournamentIds.length}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
                        style={mono}
                      >
                        {meta.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
