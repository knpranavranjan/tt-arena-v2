"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, pressable, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function RevealGroup({
  children,
  className,
  staggerMs = 40,
}: {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={staggerChildren(staggerMs)}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={pressable.whileHover}
      transition={pressable.transition}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
