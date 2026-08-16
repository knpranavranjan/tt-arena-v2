import Link from "next/link";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArenaPhotoBackdrop } from "@/components/media/arena-photo-backdrop";
import { tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

const active = [...tournaments]
  .filter((t) => t.status !== "COMPLETED")
  .sort((a) => (a.status === "REGISTRATION_OPEN" ? -1 : 1));

const featuredThree = active.slice(0, 3);

export function TournamentsShowcase() {
  if (!featuredThree.length) return null;

  return (
    <section className="border-t border-white/10 bg-[#0c0e12] py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-12">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#ff8f86]"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Tournaments
            </span>
            <h2
              className="text-2xl font-bold text-[#e2e2e8] sm:text-[28px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              What&apos;s happening in the arena.
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-[#ff8f86] transition-colors hover:text-[#c40019]"
          >
            View all tournaments
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
          </Link>
        </div>

        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredThree.map((t) => {
            const live = t.status === "REGISTRATION_OPEN" || t.status === "SEEDING" || t.status === "POOLS" || t.status === "KNOCKOUT";
            return (
              <RevealItem key={t.id}>
                <Link
                  href={`/tournaments/${t.id}`}
                  className="group relative flex h-full min-h-[350px] flex-col overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-colors hover:border-[#c40019]/50"
                >
                  <ArenaPhotoBackdrop />
                  <div className="mb-auto">
                    <span
                      className={`mb-4 inline-block rounded-[2px] px-2 py-1 text-[10px] font-semibold ${
                        live
                          ? "bg-[#c40019] text-[#ffd2cd]"
                          : "border border-white/20 text-[#e2e2e8]"
                      }`}
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      {live ? "Live Now" : "Upcoming"}
                    </span>
                    <h3 className="mb-4 text-xl font-bold uppercase text-[#e2e2e8]">{t.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-[#c2c6d7]">
                        {formatDate(t.date)}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-[#c2c6d7]">
                        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> {t.venue}
                      </div>
                      <div className="text-sm uppercase tracking-wide text-[#c2c6d7]">{t.category}</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="mb-4 flex items-center gap-2 text-[#e2e2e8]">
                      <Users className="h-4 w-4" strokeWidth={1.5} />
                      <span className="text-sm font-bold">{t.registeredPlayerIds.length}</span>
                      <span className="text-xs text-[#c2c6d7]">players</span>
                    </div>
                    <div
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-[2px] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all group-hover:scale-[1.02] ${
                        live
                          ? "bg-[#c40019] text-[#ffd2cd]"
                          : "border border-white/20 text-[#e2e2e8] group-hover:bg-white/5"
                      }`}
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      {live ? "View Live Scores" : "View Details"}
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
