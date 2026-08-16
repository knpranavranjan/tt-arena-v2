import type { Transition, Variants } from "framer-motion";

export const duration = {
  micro: 0.15,
  standard: 0.25,
  complex: 0.4,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  spring: { type: "spring", damping: 22, stiffness: 210 } as Transition,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.standard, ease: ease.out },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.standard, ease: ease.out },
  },
};

export const staggerChildren = (staggerMs = 40): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerMs / 1000 },
  },
});

export const pressable = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: { duration: duration.micro, ease: ease.out },
};

export const liveDotPulse: Variants = {
  animate: {
    opacity: [1, 0.35, 1],
    transition: { duration: 1.4, repeat: Infinity, ease: ease.inOut },
  },
};
