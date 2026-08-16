"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { animate } from "animejs";
import { fadeUp } from "@/lib/motion";

export function ConceptCta() {
  const btnRef = useRef<HTMLAnchorElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = btnRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    animate(el, {
      translateX: relX * 0.25,
      translateY: relY * 0.35,
      duration: 300,
      easing: "easeOutQuad",
    });
  }

  function handleMouseLeave() {
    const el = btnRef.current;
    if (!el) return;
    animate(el, {
      translateX: 0,
      translateY: 0,
      duration: 400,
      easing: "easeOutElastic(1, 0.6)",
    });
  }

  return (
    <section className="relative overflow-hidden border-y-2 border-white/10 bg-[#0a0a0f] py-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, transparent 0%, transparent 45%, #147dff 45%, #147dff 55%, transparent 55%, transparent 100%)",
          opacity: 0.06,
        }}
        aria-hidden="true"
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative mx-auto flex max-w-4xl flex-col items-center gap-4 border-2 border-white/10 bg-[#14121a] px-6 py-16 text-center sm:px-16"
      >
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#147dff]">Host a Tournament</span>
        <h2
          className="text-balance text-4xl font-normal uppercase italic leading-[1.05] text-white sm:text-6xl"
          style={{ fontFamily: "var(--font-concept-display)" }}
        >
          Your Arena.
          <br />
          Your Tournament.
        </h2>
        <p className="max-w-md text-balance text-base font-medium text-[#c9c6d4]">
          Run competitions from registration to results — all under one roof.
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9a97a6]">
          For clubs, academies and tournament organizers.
        </p>
        <Link
          ref={btnRef}
          href="/register"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group mt-4 inline-flex items-center gap-2 bg-[#147dff] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#147dff]/85"
        >
          Host a Tournament
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </Link>
      </motion.div>
    </section>
  );
}
