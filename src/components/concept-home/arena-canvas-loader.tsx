"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";

const ArenaCanvas = dynamic(() => import("./arena-canvas").then((m) => m.ArenaCanvas), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0a0a0f]" />,
});

/** Swaps the live 3D scene for a static poster when the visitor prefers reduced motion. */
export function ArenaCanvasLoader() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <Image
        src="/hero/hero.png"
        alt="A table tennis player silhouetted mid-jump, racket raised to strike, beside an empty tournament table in a dark arena lit by rows of blue overhead lights."
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    );
  }

  return <ArenaCanvas />;
}
