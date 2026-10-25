"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Ban, Check, Clock, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { usePortalScope } from "@/lib/portal-scope";
import { useCurrentPlayer } from "@/lib/session-data";
import {
  useRegistrations,
  type RegistrationAnswer,
  type RegistrationStatus,
} from "@/lib/registrations";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryTypeTag } from "@/components/tournaments/category-type-tag";
import { categoryEligibility, type Eligibility } from "@/lib/category-eligibility";
import { usePlayerRatings } from "@/lib/player-ratings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RegistrationQuestion, Tournament } from "@/lib/types";

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
 * The event's single Register action: one checkout lists every category still
 * open for entries and takes one payment for whichever the player picks.
 * `tournament` is the category record the page was opened on (its
 * registration questions apply event-wide); `categories` is every open
 * category of the same event.
 */
export function TournamentRegisterButton({
  tournament,
  categories,
  registeredCount,
}: {
  tournament: Tournament;
  categories: Tournament[];
  /** Unique players entered across the event. */
  registeredCount?: number;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const player = useCurrentPlayer();
  const registrations = useRegistrations();
  const { statusFor, isLoading: registrationsLoading } = registrations;
  const { getRating } = usePlayerRatings();
  const [open, setOpen] = useState(false);
  // Public site: always the sign-in CTA — the action itself only happens inside a portal.
  const inPortal = usePortalScope() !== null;

  if (inPortal && (authLoading || registrationsLoading)) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
        <div className="h-[50px] w-full animate-pulse rounded-[2px] bg-white/5" />
      </div>
    );
  }

  if (!inPortal || !user) {
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

  // Who can enter what: the host's age / rating limit per category, checked
  // against this player's current rating and their age on the first day.
  const rating = getRating(player.id) || player.rating;
  const eligibility = new Map<string, Eligibility>(
    categories.map((c) => [c.id, categoryEligibility(c, { rating, dateOfBirth: player.dateOfBirth })]),
  );

  // Event-wide: where the player stands across every open category.
  const statuses = categories.map((c) => effectiveStatus(c, player.id, statusFor));
  const paidCount = statuses.filter((st) => st === "REGISTERED").length;
  const pendingPayment = statuses.includes("PENDING_PAYMENT");
  // Categories this player could still enter (already-registered ones count as theirs).
  const enterable = categories.filter((c, i) => statuses[i] === "REGISTERED" || eligibility.get(c.id)?.ok);

  if (enterable.length === 0) {
    const reasons = [...new Set([...eligibility.values()].flatMap((e) => (e.ok ? [] : [e.reason])))];
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className={`${baseButtonClass} cursor-not-allowed bg-white/10 text-[#8b8b93]`} style={mono}>
          <Ban className="h-4 w-4" strokeWidth={2} />
          Not Eligible
        </div>
        <p className="mt-2 text-xs text-[#8b8b93]">
          {categories.length === 1 ? "This category" : "None of the open categories"} match{categories.length === 1 ? "es" : ""} your
          profile.
        </p>
        {reasons.map((r) => (
          <p key={r} className="mt-1 text-xs text-amber-300">
            {r}
          </p>
        ))}
      </div>
    );
  }
  const entered = registeredCount ?? new Set(categories.flatMap((c) => c.registeredPlayerIds)).size;
  const closes = categories.map((c) => c.registrationDeadline).filter(Boolean).sort()[0];

  if (paidCount === enterable.length) {
    return (
      <div className="rounded-[8px] border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
        <div className={`${baseButtonClass} text-emerald-400`} style={mono}>
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Registered
        </div>
        <p className="mt-2 text-xs text-emerald-400/70">
          You&apos;re confirmed for {enterable.length === 1 ? "your category" : `all ${enterable.length} of your categories`}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
      {paidCount > 0 && (
        <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Registered for {paidCount} of {enterable.length} categories you can enter
        </p>
      )}
      <CheckoutDialog
        tournament={tournament}
        categories={categories}
        eligibility={eligibility}
        player={player}
        open={open}
        onOpenChange={setOpen}
        triggerClassName={`${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95`}
      >
        {pendingPayment ? "Complete Payment" : paidCount > 0 ? "Register for More" : "Register Now"}
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </CheckoutDialog>
      <p className="mt-3 text-center text-xs text-[#8b8b93]">
        {entered} registered{closes ? <> &middot; closes {formatDate(closes)}</> : null}
      </p>
    </div>
  );
}

function CheckoutDialog({
  tournament,
  categories,
  eligibility,
  player,
  open,
  onOpenChange,
  triggerClassName,
  children,
}: {
  tournament: Tournament;
  categories: Tournament[];
  /** Per-category entry check (age / rating limit). */
  eligibility: Map<string, Eligibility>;
  player: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerClassName: string;
  children: ReactNode;
}) {
  const { register, confirmPayment, statusFor } = useRegistrations();

  const questions = tournament.registrationQuestions ?? [];

  const [step, setStep] = useState<"questions" | "checkout">(
    questions.length > 0 ? "questions" : "checkout",
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // Nothing pre-picked — the player chooses — except unpaid entries, or the
  // event's only category.
  const canEnter = (id: string) => eligibility.get(id)?.ok !== false;
  const initialSelection = () => {
    const initial = new Set<string>();
    for (const c of categories) {
      if (canEnter(c.id) && effectiveStatus(c, player.id, statusFor) === "PENDING_PAYMENT") initial.add(c.id);
    }
    const enterable = categories.filter((c) => canEnter(c.id));
    if (enterable.length === 1) initial.add(enterable[0].id);
    return initial;
  };
  const [selected, setSelected] = useState<Set<string>>(initialSelection);
  const [paying, setPaying] = useState(false);

  const allAnswered = questions.every((_, i) => (answers[i] ?? "").trim().length > 0);
  const answerList: RegistrationAnswer[] = questions.map((q, i) => ({
    question: q.question,
    answer: answers[i] ?? "",
  }));

  // Fresh dialog each time it opens.
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setStep(questions.length > 0 ? "questions" : "checkout");
      setAnswers({});
      setSelected(initialSelection());
    }
    onOpenChange(v);
  };

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
    return row && row.status !== "REGISTERED" && canEnter(id);
  });
  const total = payableSelected.reduce((sum, id) => {
    const c = categories.find((x) => x.id === id);
    return sum + (c?.entryFee ?? 0);
  }, 0);

  const toggle = (id: string, status: RegistrationStatus | undefined) => {
    if (status === "REGISTERED" || !canEnter(id)) return;
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
          register(id, player.id, player.name, c.entryFee, answerList);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className={triggerClassName} style={mono}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-[calc(100%-2rem)] gap-6 overflow-y-auto border border-white/10 bg-[#0c0e12] p-6 text-[#e2e2e8] sm:max-w-md" showCloseButton>
        {step === "questions" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
                Registration Questions
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8b8b93]">
                The host asks every entrant to answer these before checkout.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              {questions.map((q, i) => (
                <QuestionField
                  key={i}
                  index={i}
                  question={q}
                  value={answers[i] ?? ""}
                  onChange={(v) => setAnswers((a) => ({ ...a, [i]: v }))}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => setStep("checkout")}
              className={`${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100`}
              style={mono}
            >
              Continue to Categories
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
            {!allAnswered && (
              <p className="-mt-3 text-center text-[11px] text-[#8b8b93]">
                Answer every question to continue.
              </p>
            )}
          </>
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
            Choose Categories
          </DialogTitle>
          <DialogDescription className="text-sm text-[#8b8b93]">
            Pick every category you want to enter — one payment covers all of them.
          </DialogDescription>
        </DialogHeader>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={() => setStep("questions")}
            className="-mt-3 flex items-center gap-1.5 self-start text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93] transition-colors hover:text-[#e2e2e8]"
            style={mono}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to questions
          </button>
        )}

        <div className="flex flex-col gap-2">
          {rows.map(({ category: c, status }) => {
            const locked = status === "REGISTERED";
            const elig = eligibility.get(c.id);
            const blocked = !locked && elig?.ok === false;
            const checked = !blocked && (selected.has(c.id) || locked);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 rounded-[8px] border p-3.5 transition-colors ${
                  locked
                    ? "cursor-default border-emerald-500/30 bg-emerald-500/[0.06]"
                    : blocked
                      ? "cursor-not-allowed border-white/5 bg-white/[0.015] opacity-70"
                      : "cursor-pointer border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <Checkbox checked={checked} disabled={locked || blocked} onCheckedChange={() => toggle(c.id, status)} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#e2e2e8]">
                    <CategoryTypeTag category={c} />
                    {c.category} Singles
                  </p>
                  {status === "PENDING_PAYMENT" && (
                    <p className="text-xs text-amber-300">Payment pending — included below</p>
                  )}
                  {locked && <p className="text-xs text-emerald-400">Already paid</p>}
                  {blocked && elig && !elig.ok && <p className="text-xs text-amber-300">Not eligible — {elig.reason}</p>}
                </div>
                <span className="shrink-0 text-sm font-bold text-[#ff8f86]" style={mono}>
                  {locked ? "Paid" : blocked ? "—" : formatCurrency(c.entryFee)}
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
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuestionField({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: RegistrationQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClass =
    "w-full rounded-[6px] border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-[#5a5a60] focus:border-[#ff2448]";
  const options = (question.options ?? []).map((o) => o.trim()).filter(Boolean);
  const isMcqNoOptions = question.responseType === "Multiple Choice" && options.length === 0;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#e2e2e8]">
        {index + 1}. {question.question.trim() || "Question"}
        <span className="text-[#ff2448]"> *</span>
      </p>

      {(question.responseType === "Short Answer" || isMcqNoOptions) && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          className={inputClass}
        />
      )}

      {question.responseType === "Yes / No" && (
        <div className="flex gap-2">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex-1 rounded-[6px] border px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
                value === opt
                  ? "border-[#ff2448] bg-[#ff2448]/15 text-[#ff8f86]"
                  : "border-white/10 bg-white/[0.03] text-[#c2c6d7] hover:bg-white/[0.05]",
              )}
              style={mono}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.responseType === "Multiple Choice" && options.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {options.map((opt) => {
            const on = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[6px] border px-3 py-2 text-left text-sm transition-colors",
                  on
                    ? "border-[#ff2448] bg-[#ff2448]/12 text-[#e8e8ee]"
                    : "border-white/10 bg-white/[0.03] text-[#c2c6d7] hover:bg-white/[0.05]",
                )}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-full border",
                    on ? "border-[#ff2448] bg-[#ff2448]" : "border-white/30",
                  )}
                />
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
