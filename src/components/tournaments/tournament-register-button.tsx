"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentPlayer } from "@/lib/session-data";
import { useRegistrations } from "@/lib/registrations";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Tournament } from "@/lib/types";

const baseButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-[2px] py-3.5 text-sm font-semibold uppercase tracking-wide";
const mono = { fontFamily: "var(--font-home-mono)" };

export function TournamentRegisterButton({ tournament }: { tournament: Tournament }) {
  const { user, isLoading: authLoading } = useAuth();
  const player = useCurrentPlayer();
  const { register, confirmPayment, statusFor, isLoading: registrationsLoading } = useRegistrations();

  if (authLoading || registrationsLoading) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
        <div className="h-[50px] w-full animate-pulse rounded-[2px] bg-white/5" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
        <Link
          href={`/login?next=/tournaments/${tournament.id}`}
          className={`${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95`}
          style={mono}
        >
          Register Now
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#8b8b93]">
          <Lock className="h-3 w-3" strokeWidth={2} />
          Login required to register
        </p>
      </div>
    );
  }

  if (user.role !== "PLAYER" || !player) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
        <button
          type="button"
          disabled
          className={`${baseButtonClass} cursor-not-allowed bg-white/10 text-[#8b8b93]`}
          style={mono}
        >
          Register Now
        </button>
        <p className="mt-2 text-center text-xs text-[#8b8b93]">Only players can register for tournaments.</p>
      </div>
    );
  }

  const status = statusFor(tournament.id, player.id);

  if (status === "REGISTERED") {
    return (
      <div className="rounded-[8px] border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
        <div className={`${baseButtonClass} text-emerald-400`} style={mono}>
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Registered
        </div>
        <p className="mt-2 text-xs text-emerald-400/70">You&apos;re confirmed for this event.</p>
      </div>
    );
  }

  if (status === "PENDING_PAYMENT") {
    return (
      <div className="rounded-[8px] border border-amber-400/40 bg-amber-400/10 p-5 text-center">
        <button
          type="button"
          onClick={() => {
            confirmPayment(tournament.id, player.id);
            toast.success("Payment received", { description: "You're registered for this event." });
          }}
          className={`${baseButtonClass} text-amber-300`}
          style={mono}
        >
          <Clock className="h-4 w-4" strokeWidth={2.5} />
          Payment Pending
        </button>
        <p className="mt-2 text-xs text-amber-300/70">
          Entry fee {formatCurrency(tournament.entryFee)} due &middot; tap to simulate payment
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
      <button
        type="button"
        onClick={() => {
          register(tournament.id, player.id, player.name, tournament.entryFee);
          if (tournament.entryFee > 0) {
            toast.success("Registration started", { description: `Entry fee ${formatCurrency(tournament.entryFee)} due.` });
          } else {
            toast.success("You're registered!", { description: "See you on the table." });
          }
        }}
        className={`${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95`}
        style={mono}
      >
        Register Now
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </button>
      <p className="mt-3 text-center text-xs text-[#8b8b93]">
        {tournament.registeredPlayerIds.length}/{tournament.maxPlayers} registered &middot; closes{" "}
        {formatDate(tournament.registrationDeadline)}
      </p>
    </div>
  );
}
