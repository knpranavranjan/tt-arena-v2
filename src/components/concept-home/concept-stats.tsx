"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate, createScope, type Scope } from "animejs";
import { clubs, events, players, tournaments } from "@/lib/mock-data";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: "Tournaments", value: tournaments.length, accent: "#147dff" },
  { label: "Players", value: players.length, accent: "#0ea5ff" },
  { label: "Events", value: events.length, accent: "#147dff" },
  { label: "Clubs", value: clubs.length, accent: "#0ea5ff" },
];

export function ConceptStats() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const scopeRef = useRef<Scope | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !sectionRef.current) return;

    const tiles = tileRefs.current.filter((el): el is HTMLDivElement => el !== null);
    gsap.set(tiles, { opacity: 0, y: 28, scale: 0.94 });

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(tiles, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
        });

        scopeRef.current = createScope().add(() => {
          numberRefs.current.forEach((el, i) => {
            if (!el) return;
            const counter = { value: 0 };
            animate(counter, {
              value: stats[i].value,
              duration: 900 + i * 120,
              easing: "easeOutExpo",
              round: 1,
              onUpdate: () => {
                el.textContent = String(counter.value);
              },
            });
          });
        });
      },
    });

    return () => {
      trigger.kill();
      scopeRef.current?.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0a0a0f] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[#147dff]">The Arena</h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-lg font-semibold text-[#c9c6d4]">
            Where players compete, rankings move and tournaments come alive.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              className="flex flex-col items-center gap-1 border-2 border-white/10 bg-[#14121a] px-4 py-10 transition-colors hover:border-[color:var(--accent)]"
              style={{ ["--accent" as string]: stat.accent }}
            >
              <span
                ref={(el) => {
                  numberRefs.current[i] = el;
                }}
                className="text-5xl font-normal tabular-nums text-white sm:text-6xl"
                style={{ fontFamily: "var(--font-concept-display)" }}
              >
                {stat.value}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#9a97a6]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
