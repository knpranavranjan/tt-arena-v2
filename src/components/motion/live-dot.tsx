"use client";

import { motion } from "framer-motion";
import { liveDotPulse } from "@/lib/motion";

export function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
      <motion.span
        variants={liveDotPulse}
        animate="animate"
        className="absolute inset-0 rounded-full bg-live"
      />
    </span>
  );
}
