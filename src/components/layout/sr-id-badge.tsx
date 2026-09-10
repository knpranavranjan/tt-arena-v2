"use client";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * The account's system-issued SPINID (e.g. SRP01). Shown in the portal chrome
 * and every dashboard hero — it's the handle players use to sign in alongside
 * their email.
 */
export function SrIdBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  if (!user?.uniqueId) return null;
  return (
    <span
      title="Your SPINID — sign in with this or your email"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#ff2448]/30 bg-[#ff2448]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#ff8f86]",
        className,
      )}
    >
      <span className="text-[#ff8f86]/60">SPINID</span>
      {user.uniqueId}
    </span>
  );
}
