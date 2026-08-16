"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Mouse } from "lucide-react";
import { fadeUp, staggerChildren } from "@/lib/motion";

export function ArenaHero() {
  const reduceMotion = useReducedMotion();

  function scrollToRankings() {
    document.getElementById("rankings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-[#111318] pb-32 pt-20">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Image
          src="/hero/hero.png"
          alt="A table tennis player silhouetted mid-jump, racket raised to strike, beside an empty tournament table in a dark arena lit by rows of blue overhead lights."
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(17,19,24,0.15)_0%,rgba(17,19,24,0.45)_60%,#111318_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111318_0%,rgba(17,19,24,0.75)_40%,transparent_75%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-12">
        <motion.div initial="hidden" animate="show" variants={staggerChildren(90)} className="max-w-2xl">
          <motion.span
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#1e2024]/50 px-3 py-1 backdrop-blur-md"
          >
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#ff8f86]"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Competitive Rating Platform
            </span>
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mb-2 text-[44px] font-extrabold uppercase leading-[1.1] tracking-[-0.03em] text-[#e2e2e8] sm:text-[64px] lg:text-[72px] lg:tracking-[-0.04em]"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Spin
            <br />
            <span className="bg-gradient-to-r from-[#ffb3ac] to-[#c40019] bg-clip-text text-transparent">
              Redefined.
            </span>
          </motion.h1>

          <motion.h2
            variants={fadeUp}
            className="mb-4 mt-6 text-2xl font-bold leading-tight text-[#e2e2e8] sm:text-[32px]"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Rated on talent.
            <br />
            Not age or gender.
          </motion.h2>

          <motion.p variants={fadeUp} className="mb-10 max-w-lg text-lg leading-relaxed text-[#c2c6d7]">
            A live competitive rating for every player — built on real match performance, not
            seniority or category.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-[2px] bg-[#c40019] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#ffd2cd] transition-all hover:scale-[1.03] hover:shadow-[0_0_20px_-5px_#c40019] active:scale-95"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Get Rated
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </Link>
            <Link
              href="/tournaments"
              className="inline-flex items-center justify-center rounded-[2px] border border-white/20 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] transition-all hover:border-white/40 hover:bg-white/5"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Explore Arena
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={scrollToRankings}
        className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 text-[#c2c6d7] opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#c40019]/50"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-home-mono)" }}>
          Scroll
        </span>
        <motion.span animate={reduceMotion ? undefined : { y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <Mouse className="h-4 w-4 text-[#ff8f86]" strokeWidth={1.75} />
        </motion.span>
      </button>
    </section>
  );
}
