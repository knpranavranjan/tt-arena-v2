"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentPlayer } from "@/lib/session-data";
import { useRegistrations, type RegistrationStatus } from "@/lib/registrations";
import { formatCurrency, formatDate } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Tournament } from "@/lib/types";

const baseButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-[2px] py-3.5 text-sm font-semibold uppercase tracking-wide";
const mono = { fontFamily: "var(--font-home-mono)" };

/**
 * `useRegistrations().statusFor` only knows about the live registrations
 * store, so a player seeded straight into a category's roster (mock data,
 * not an actual checkout) would otherwise still see "Register Now". Treat
 * seeded membership as an implicit REGISTERED so the button and dialog agree
 * with the "Registered Players" table below, which does read the seed data.
 */
function effectiveStatus(
  category: Tournament,
  playerId: string,
  statusFor: (tournamentId: string, playerId: string) => RegistrationStatus | undefined,
): RegistrationStatus | undefined {
  return statusFor(category.id, playerId) ?? (category.registeredPlayerIds.includes(playerId) ? "REGISTERED" : undefined);
}

/**
 * Registers a player for one or more categories of the same event in a
 * single checkout. `tournament` is the category currently being viewed;
 * `categories` is every sibling category (same eventId, tournament itself
 * included) the player can also opt into from the same dialog.
 */
export function TournamentRegisterButton({
  tournament,
  categories,
}: {
  tournament: Tournament;
  categories: Tournament[];
}) {
  const { user, isLoading: authLoading } = useAuth();
  const player = useCurrentPlayer();
  const registrations = useRegistrations();
  const { statusFor, isLoading: registrationsLoading } = registrations;
  const [open, setOpen] = useState(false);

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

  const status = effectiveStatus(tournament, player.id, statusFor);
  const unregisteredCount = categories.filter((c) => !effectiveStatus(c, player.id, statusFor)).length;

  if (status === "REGISTERED") {
    return (
      <div className="rounded-[8px] border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
        <div className={`${baseButtonClass} text-emerald-400`} style={mono}>
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Registered
        </div>
        <p className="mt-2 text-xs text-emerald-400/70">You&apos;re confirmed for this category.</p>
        {unregisteredCount > 0 && (
          <CheckoutDialog
            tournament={tournament}
            categories={categories}
            player={player}
            open={open}
            onOpenChange={setOpen}
            triggerClassName="mt-3 text-xs font-semibold uppercase tracking-wide text-[#ff8f86] hover:text-[#ff2448]"
          >
            Register for other categories
          </CheckoutDialog>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
      <CheckoutDialog
        tournament={tournament}
        categories={categories}
        player={player}
        open={open}
        onOpenChange={setOpen}
        triggerClassName={`${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95`}
      >
        {status === "PENDING_PAYMENT" ? "Complete Payment" : "Register Now"}
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </CheckoutDialog>
      <p className="mt-3 text-center text-xs text-[#8b8b93]">
        {tournament.registeredPlayerIds.length} registered &middot; closes {formatDate(tournament.registrationDeadline)}
      </p>
    </div>
  );
}

function CheckoutDialog({
  tournament,
  categories,
  player,
  open,
  onOpenChange,
  triggerClassName,
  children,
}: {
  tournament: Tournament;
  categories: Tournament[];
  player: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerClassName: string;
  children: ReactNode;
}) {
  const { register, confirmPayment, statusFor } = useRegistrations();

  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>([tournament.id]);
    for (const c of categories) {
      if (effectiveStatus(c, player.id, statusFor) === "PENDING_PAYMENT") initial.add(c.id);
    }
    return initial;
  });
  const [paying, setPaying] = useState(false);

  const rows = useMemo(
    () =>
      categories.map((c) => ({
        category: c,
        status: effectiveStatus(c, player.id, statusFor),
      })),
    [categories, statusFor, player.id],
  );

  const payableSelected = [...selected].filter((id) => {
    const row = rows.find((r) => r.category.id === id);
    return row && row.status !== "REGISTERED";
  });
  const total = payableSelected.reduce((sum, id) => {
    const c = categories.find((x) => x.id === id);
    return sum + (c?.entryFee ?? 0);
  }, 0);

  const toggle = (id: string, status: RegistrationStatus | undefined) => {
    if (status === "REGISTERED") return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePay = () => {
    if (payableSelected.length === 0) return;
    setPaying(true);
    // Simulated Razorpay checkout — this demo has no payment backend, so the
    // "processing" beat just gives the flow a realistic pause before the
    // registrations are marked paid.
    setTimeout(() => {
      for (const id of payableSelected) {
        const c = categories.find((x) => x.id === id)!;
        if (!statusFor(id, player.id)) {
          register(id, player.id, player.name, c.entryFee);
        }
        confirmPayment(id, player.id);
      }
      toast.success("Payment successful", {
        description: `Paid ${formatCurrency(total)} via Razorpay for ${payableSelected.length} categor${
          payableSelected.length === 1 ? "y" : "ies"
        }.`,
      });
      setPaying(false);
      onOpenChange(false);
    }, 1100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className={triggerClassName} style={mono}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-6 border border-white/10 bg-[#0c0e12] p-6 text-[#e2e2e8] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
            Choose Categories
          </DialogTitle>
          <DialogDescription className="text-sm text-[#8b8b93]">
            Pick every category you want to enter — one payment covers all of them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {rows.map(({ category: c, status }) => {
            const checked = selected.has(c.id) || status === "REGISTERED";
            const locked = status === "REGISTERED";
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 rounded-[8px] border p-3.5 transition-colors ${
                  locked
                    ? "cursor-default border-emerald-500/30 bg-emerald-500/[0.06]"
                    : "cursor-pointer border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <Checkbox checked={checked} disabled={locked} onCheckedChange={() => toggle(c.id, status)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#e2e2e8]">{c.category} Singles</p>
                  {status === "PENDING_PAYMENT" && (
                    <p className="text-xs text-amber-300">Payment pending — included below</p>
                  )}
                  {locked && <p className="text-xs text-emerald-400">Already paid</p>}
                </div>
                <span className="shrink-0 text-sm font-bold text-[#ff8f86]" style={mono}>
                  {locked ? "Paid" : formatCurrency(c.entryFee)}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
            Total
          </span>
          <span className="text-2xl font-extrabold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
            {formatCurrency(total)}
          </span>
        </div>

        <button
          type="button"
          disabled={payableSelected.length === 0 || paying}
          onClick={handlePay}
          className={`${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none`}
          style={mono}
        >
          {paying ? (
            "Processing payment…"
          ) : (
            <>
              <CreditCard className="h-4 w-4" strokeWidth={2} />
              Pay {formatCurrency(total)} with Razorpay
            </>
          )}
        </button>
        <p className="-mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#8b8b93]">
          <Clock className="h-3 w-3" strokeWidth={2} />
          Demo checkout — no real payment is processed.
        </p>
      </DialogContent>
    </Dialog>
  );
}
