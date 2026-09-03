"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp } from "@/lib/motion";

export function HostArenaCta() {
  return (
    <section className="relative overflow-hidden bg-[#111318] py-16">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Image
          src="/hero/hero.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/80 to-[#111318]" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        <span
          className="mb-3 block text-xs font-semibold uppercase tracking-[0.15em] text-[#ff8f86]"
          style={{ fontFamily: "var(--font-home-mono)" }}
        >
          Host a Tournament
        </span>
        <h2
          className="mb-4 text-balance text-3xl font-extrabold uppercase tracking-[-0.03em] text-[#e2e2e8] sm:text-5xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Your Arena. <span className="text-[#ff8f86]">Your Tournament.</span>
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-balance text-base text-[#c2c6d7]">
          Run competitions from registration to results — all under one roof. For clubs,
          academies and tournament organizers.
        </p>
        <Link
          href="/host-tournament"
          className="group inline-flex items-center gap-2 rounded-[2px] bg-[#ff2448] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#ffd2cd] transition-all hover:scale-[1.03] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
          style={{ fontFamily: "var(--font-home-mono)" }}
        >
          Host a Tournament
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
        </Link>
      </motion.div>
    </section>
  );
}
