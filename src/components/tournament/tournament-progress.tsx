"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { TournamentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

const stages: { status: TournamentStatus; label: string }[] = [
  { status: "REGISTRATION_OPEN", label: "Registration" },
  { status: "SEEDING", label: "Seeding" },
  { status: "POOLS", label: "Pools" },
  { status: "KNOCKOUT", label: "Knockout" },
  { status: "COMPLETED", label: "Champion" },
];

const statusOrder: TournamentStatus[] = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "SEEDING",
  "POOLS",
  "KNOCKOUT",
  "COMPLETED",
];

export function TournamentProgress({ status, className }: { status: TournamentStatus; className?: string }) {
  const effectiveStatus = status === "REGISTRATION_CLOSED" ? "REGISTRATION_OPEN" : status;
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className={cn("flex items-center", className)}>
      {stages.map((stage, i) => {
        const stageIndex = statusOrder.indexOf(stage.status);
        const isCompleted = stageIndex < currentIndex || status === "COMPLETED";
        const isCurrent = stage.status === effectiveStatus && status !== "COMPLETED";
        const isFinalCompleted = stage.status === "COMPLETED" && status === "COMPLETED";
        const isDone = isCompleted && !isFinalCompleted;

        return (
          <div key={stage.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ scale: isCurrent || isFinalCompleted ? 1 : 0.9 }}
                transition={{ duration: duration.standard, ease: ease.out }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                  isFinalCompleted && "border-champion bg-champion text-champion-foreground",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  isDone && !isCurrent && !isFinalCompleted && "border-primary/50 bg-primary/10 text-primary",
                  !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground",
                )}
              >
                {isDone || isFinalCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : i + 1}
              </motion.div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent || isFinalCompleted ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px flex-1 transition-colors",
                  stageIndex < currentIndex || status === "COMPLETED" ? "bg-primary/50" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
