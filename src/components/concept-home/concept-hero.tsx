"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Zap } from "lucide-react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { fadeUp, staggerChildren } from "@/lib/motion";
import { ArenaCanvasLoader } from "@/components/concept-home/arena-canvas-loader";

gsap.registerPlugin(SplitText);

export function ConceptHero() {
  const reduceMotion = useReducedMotion();
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (reduceMotion || !headlineRef.current) return;

    const split = SplitText.create(headlineRef.current, { type: "lines,words" });
    gsap.set(split.words, { willChange: "transform, opacity" });

    const tl = gsap.timeline({ delay: 0.15 });
    tl.from(split.words, {
      yPercent: 130,
      rotate: 6,
      opacity: 0,
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.06,
    });

    return () => {
      tl.kill();
      split.revert();
    };
  }, [reduceMotion]);

  return (
    <section className="relative flex min-h-[680px] flex-col overflow-hidden bg-[#0a0a0f] sm:min-h-[820px]">
      <div className="absolute inset-0" aria-hidden="true">
        <ArenaCanvasLoader />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/50" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        <motion.div initial="hidden" animate="show" variants={staggerChildren(90)} className="max-w-2xl">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 bg-[#147dff] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white"
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            Competitive Rating Platform
          </motion.span>

          <h1
            ref={headlineRef}
            className="mt-6 overflow-hidden text-balance text-6xl font-normal uppercase italic leading-[0.92] tracking-tight text-white sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-concept-display)" }}
          >
            Spin
            <br />
            <span className="text-[#147dff]">Redefined.</span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md text-balance text-lg font-semibold uppercase tracking-wide text-[#c9c6d4]"
          >
            Rated on talent. Not age or gender.
          </motion.p>

          <motion.p variants={fadeUp} className="mt-4 max-w-md text-balance text-sm text-[#9a97a6]">
            A live competitive rating for every player — built on real match performance, not
            seniority or category.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-[#147dff] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#147dff]/85"
            >
              Get Rated
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 border-2 border-white/25 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60"
            >
              Explore Arena
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-10 flex justify-center pb-8">
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          className="flex flex-col items-center gap-1 text-white/60"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Scroll the arena</span>
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </motion.div>
      </div>

      {!reduceMotion && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#147dff] via-[#0ea5ff] to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          style={{ transformOrigin: "left" }}
        />
      )}
    </section>
  );
}
