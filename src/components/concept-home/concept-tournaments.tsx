"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

const active = [...tournaments]
  .filter((t) => t.status !== "COMPLETED")
  .sort((a, b) => (a.status === "REGISTRATION_OPEN" ? -1 : 1));

const [featured, ...rest] = active;
const upcoming = rest.slice(0, 2);

function ConceptBackdrop() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a2e] via-[#0a0a0f] to-[#0a1420]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
    </div>
  );
}

export function ConceptTournaments() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLAnchorElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !sectionRef.current) return;

    const cards = cardRefs.current.filter((el): el is HTMLAnchorElement => el !== null);
    const targets = [featuredRef.current, ...cards].filter(Boolean) as HTMLElement[];
    if (!targets.length) return;

    gsap.set(featuredRef.current, { opacity: 0, x: -48, rotateZ: -1.5 });
    gsap.set(cards, { opacity: 0, x: 48 });

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 78%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { duration: 0.7, ease: "power3.out" } });
        tl.to(featuredRef.current, { opacity: 1, x: 0, rotateZ: 0 }).to(
          cards,
          { opacity: 1, x: 0, stagger: 0.12 },
          "-=0.45"
        );
      },
    });

    return () => trigger.kill();
  }, []);

  if (!featured) return null;

  return (
    <section ref={sectionRef} className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[#147dff]">Tournaments</h2>
        <p
          className="mt-2 text-balance text-3xl font-normal uppercase italic text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-concept-display)" }}
        >
          What&apos;s Happening in the Arena
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Link
          ref={featuredRef}
          href={`/tournaments/${featured.id}`}
          className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden border-2 border-white/10 p-7 transition-colors hover:border-[#147dff]/60 sm:p-10"
        >
          <ConceptBackdrop />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 bg-[#147dff] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Featured
            </span>
            <h3
              className="mt-4 max-w-lg text-balance text-3xl font-normal uppercase italic leading-[1.05] text-white sm:text-4xl"
              style={{ fontFamily: "var(--font-concept-display)" }}
            >
              {featured.name}
            </h3>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[#c9c6d4]">
              <span>{formatDate(featured.date)}</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={2} /> {featured.venue}
              </span>
              <span>{featured.category}</span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" strokeWidth={2} /> {featured.registeredPlayerIds.length} players
              </span>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#147dff]">
              {featured.status === "REGISTRATION_OPEN" ? "Register Now" : "View Tournament"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-3">
          {upcoming.map((t, i) => (
            <Link
              key={t.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              href={`/tournaments/${t.id}`}
              className="group relative flex min-h-[178px] flex-col justify-end overflow-hidden border-2 border-white/10 p-6 transition-colors hover:border-[#0ea5ff]/60"
            >
              <ConceptBackdrop />
              <div className="relative">
                <span className="inline-block bg-[#0ea5ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t.status.replace("_", " ")}
                </span>
                <h3
                  className="mt-2 text-balance text-lg font-normal uppercase italic leading-tight text-white"
                  style={{ fontFamily: "var(--font-concept-display)" }}
                >
                  {t.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#c9c6d4]">
                  <span>{formatDate(t.date)}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={2} /> {t.venue}
                  </span>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#0ea5ff]">
                  View
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/tournaments"
          className="border-2 border-white/25 px-7 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60"
        >
          View All Tournaments
        </Link>
      </div>
    </section>
  );
}
