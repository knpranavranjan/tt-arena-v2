"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useCurrentClub, useCurrentPlayer } from "@/lib/session-data";
import { arenaFontVariables } from "@/lib/fonts";
import { events, tournaments } from "@/lib/mock-data";
import { useHostingPlans } from "@/lib/hosting-plans";
import { formatCurrency } from "@/lib/format";
import type { Tournament, TournamentFormat } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

const fieldClass =
  "w-full rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] transition-colors focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]";
// For a field sharing a flex row with a fixed-width sibling (e.g. an amount
// input) — `w-full` fights the flex layout and squashes the field to almost
// nothing. Set flex/min-width inline (not just via Tailwind classes) so the
// fix doesn't depend on those utilities being present in the compiled CSS.
const flexFieldClass = fieldClass.replace("w-full", "min-w-0 flex-1");
const flexFieldStyle = { flex: "1 1 0%", minWidth: 0 };
// Same story for the fixed-width amount field beside it: Tailwind emits
// `.w-full` after `.w-52` in the stylesheet, so the `w-full` from fieldClass
// was winning the cascade and stretching this field over the whole row.
// An inline width can't lose that fight.
const amountFieldStyle = { width: 208, flexShrink: 0 };
const dateFieldClass = `${fieldClass} [color-scheme:dark]`;
const selectClass = `${fieldClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27white%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[position:right_1rem_center] bg-no-repeat pr-10`;
const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#8b8b93]";
const sectionLabelClass = "mb-4 text-xs font-bold uppercase tracking-widest text-[#c2c6d7]";
const dashedButtonClass =
  "flex w-full items-center justify-center gap-1.5 rounded-[4px] border border-dashed border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/[0.03]";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface CategoryRow {
  id: string;
  name: string;
  entryFee: string;
  prizePool: string;
}

type ResponseType = "Multiple Choice" | "Short Answer" | "Yes / No";

interface QuestionRow {
  id: string;
  question: string;
  responseType: ResponseType;
  options: string[];
}

const formatOptions: { value: TournamentFormat; label: string }[] = [
  { value: "POOL_KNOCKOUT", label: "Round Robin + Knockouts" },
  { value: "ROUND_ROBIN_LEAGUE", label: "Round Robin / League" },
  { value: "SINGLE_ELIMINATION", label: "Direct Knockout" },
];

const matchFormatOptions = ["Best of 3 sets", "Best of 5 sets", "Best of 7 sets"];
const umpireOptions = ["No – self-officiated", "Yes – club umpire", "Yes – certified umpire"];
const responseTypeOptions: ResponseType[] = ["Multiple Choice", "Short Answer", "Yes / No"];

export default function HostTournamentPage() {
  const { user, isLoading } = useAuth();
  const club = useCurrentClub();
  const player = useCurrentPlayer();
  const { plans: hostingPlans } = useHostingPlans();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([
    { id: makeId("cat"), name: "", entryFee: "", prizePool: "" },
  ]);
  const [format, setFormat] = useState<TournamentFormat>("POOL_KNOCKOUT");
  const [matchFormat, setMatchFormat] = useState(matchFormatOptions[1]);
  const [ballType, setBallType] = useState("");
  const [umpireStatus, setUmpireStatus] = useState(umpireOptions[0]);
  const [totalPrizePool, setTotalPrizePool] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([
    { id: makeId("q"), question: "", responseType: "Multiple Choice", options: [""] },
  ]);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  function updateCategory(id: string, patch: Partial<CategoryRow>) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function addCategory() {
    setCategories((prev) => [...prev, { id: makeId("cat"), name: "", entryFee: "", prizePool: "" }]);
  }
  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function updateQuestion(id: string, patch: Partial<QuestionRow>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  function addQuestion() {
    setQuestions((prev) => [...prev, { id: makeId("q"), question: "", responseType: "Multiple Choice", options: [""] }]);
  }
  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }
  function addOption(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, ""] } : q)),
    );
  }
  function updateOption(questionId: string, index: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) } : q,
      ),
    );
  }
  function removeOption(questionId: string, index: number) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options: q.options.filter((_, i) => i !== index) } : q)),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validCategories = categories.filter((c) => c.name.trim());
    if (!name.trim() || !date || !location.trim() || !venue.trim() || validCategories.length === 0) {
      toast.error("Missing details", {
        description: "Fill in the tournament name, date, location, venue and at least one category.",
      });
      return;
    }
    // The details are ready — hosting a tournament costs a fee, so collect that
    // before the submission actually goes to admin review.
    setShowPlanModal(true);
  }

  function submitTournament() {
    const validCategories = categories.filter((c) => c.name.trim());
    const organizerName = club?.name ?? player?.name ?? user?.name ?? "Tournament Host";
    const sharedEventId = makeId("evt-host");
    const createdIds: string[] = [];

    validCategories.forEach((cat) => {
      const id = makeId("trn-host");
      const newTournament: Tournament = {
        id,
        eventId: sharedEventId,
        name: `${name} — ${cat.name}`,
        venue,
        organizer: organizerName,
        date,
        registrationDeadline: date,
        maxPlayers: 32,
        registeredPlayerIds: [],
        format,
        category: cat.name,
        entryFee: Number(cat.entryFee) || 0,
        description: details,
        status: "DRAFT",
        matchFormat,
        ballType: ballType.trim() || "Plastic 40+, 3-star (match)",
        umpireStatus,
        prizePool: Number(cat.prizePool) || 0,
      };
      tournaments.push(newTournament);
      createdIds.push(id);
    });

    events.push({
      id: sharedEventId,
      name,
      organizer: organizerName,
      venue,
      date,
      location,
      status: "UPCOMING",
      tournamentIds: createdIds,
      participatingClubIds: club ? [club.id] : [],
    });

    toast.success("Submitted for approval", {
      description: "An admin will review this before it goes live for players.",
    });
    setShowPlanModal(false);
    setSubmitted(true);
  }

  if (isLoading) {
    return (
      <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-12">
          <div className="h-96 w-full animate-pulse rounded-[8px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-12">
          <h1 className="mb-4 text-3xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-4xl" style={display}>
            Host a Tournament
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-[#c2c6d7]">
            Log in as a player or club to submit a tournament for admin approval.
          </p>
          <Link
            href="/login?next=/host-tournament"
            className="inline-flex items-center justify-center gap-2 rounded-[2px] bg-[#ff2448] px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
            style={mono}
          >
            <Lock className="h-4 w-4" strokeWidth={2} />
            Log In to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
            <Check className="h-6 w-6 text-emerald-400" strokeWidth={2.5} />
          </div>
          <h1 className="mb-4 text-3xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-4xl" style={display}>
            Submitted for Approval
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-[#c2c6d7]">
            {name} is now pending admin review. It stays hidden from players until it&apos;s approved, then it goes
            live for registration.
          </p>
          <Link
            href="/tournaments"
            className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-white/15 px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
            style={mono}
          >
            View All Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-12 sm:py-16">
        <h1
          className="mb-3 text-3xl font-extrabold uppercase leading-tight tracking-tight text-[#e2e2e8] sm:text-4xl"
          style={display}
        >
          Host a Tournament
        </h1>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-[#c2c6d7]">
          Submit the details below — the event goes into &lsquo;pending approval&rsquo; until admin reviews it,
          then it goes live for players to register.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <label htmlFor="name" className={labelClass} style={mono}>
              Tournament Name
            </label>
            <input
              id="name"
              className={fieldClass}
              placeholder="Chennai Winter Open"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className={labelClass} style={mono}>
                Date
              </label>
              <input
                id="date"
                type="date"
                className={dateFieldClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="location" className={labelClass} style={mono}>
                Location
              </label>
              <input
                id="location"
                className={fieldClass}
                placeholder="Chennai, TN"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="venue" className={labelClass} style={mono}>
              Venue / Club Name
            </label>
            <input
              id="venue"
              className={fieldClass}
              placeholder="Chennai Smashers TTC, Besant Nagar"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div>
            <h2 className={sectionLabelClass} style={mono}>
              Categories &amp; Entry Fees
            </h2>
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <input
                    className={flexFieldClass}
                    style={flexFieldStyle}
                    placeholder={`Category ${i + 1} (e.g. Under 15, Open)`}
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                  />
                  <input
                    className={`${fieldClass} w-52 shrink-0`}
                    style={amountFieldStyle}
                    placeholder="Entry fee ₹"
                    inputMode="numeric"
                    value={cat.entryFee}
                    onChange={(e) => updateCategory(cat.id, { entryFee: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(cat.id)}
                    aria-label="Remove category"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[#8b8b93] transition-colors hover:bg-white/5 hover:text-[#e2e2e8]"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCategory} className={`mt-3 ${dashedButtonClass}`} style={mono}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Category
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="format" className={labelClass} style={mono}>
                Format
              </label>
              <select
                id="format"
                className={selectClass}
                value={format}
                onChange={(e) => setFormat(e.target.value as TournamentFormat)}
              >
                {formatOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="matchFormat" className={labelClass} style={mono}>
                Match Format
              </label>
              <select
                id="matchFormat"
                className={selectClass}
                value={matchFormat}
                onChange={(e) => setMatchFormat(e.target.value)}
              >
                {matchFormatOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="ballType" className={labelClass} style={mono}>
                Ball Type
              </label>
              <input
                id="ballType"
                className={fieldClass}
                placeholder="Plastic 40+, 3-star (match)"
                value={ballType}
                onChange={(e) => setBallType(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="umpireStatus" className={labelClass} style={mono}>
                Will there be an umpire?
              </label>
              <select
                id="umpireStatus"
                className={selectClass}
                value={umpireStatus}
                onChange={(e) => setUmpireStatus(e.target.value)}
              >
                {umpireOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h2 className={sectionLabelClass} style={mono}>
              Cash Prize Pool
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="totalPrizePool" className={labelClass} style={mono}>
                  Total Cash Prize Pool
                </label>
                <input
                  id="totalPrizePool"
                  className={fieldClass}
                  placeholder="e.g. ₹50,000"
                  inputMode="numeric"
                  value={totalPrizePool}
                  onChange={(e) => setTotalPrizePool(e.target.value)}
                />
              </div>
              {categories.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <input
                    className={`${flexFieldClass} cursor-not-allowed text-[#8b8b93]`}
                    style={flexFieldStyle}
                    placeholder={`Category ${i + 1} (e.g. Under 15, Open)`}
                    value={cat.name}
                    disabled
                  />
                  <input
                    className={`${fieldClass} w-52 shrink-0`}
                    style={amountFieldStyle}
                    placeholder="Prize Pool ₹"
                    inputMode="numeric"
                    value={cat.prizePool}
                    onChange={(e) => updateCategory(cat.id, { prizePool: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#8b8b93]">
              Note: prize pools will automatically update as you add categories above.
            </p>
          </div>

          <div>
            <h2 className={sectionLabelClass} style={mono}>
              Registration Questions
            </h2>
            <p className="mb-4 text-xs text-[#8b8b93]">
              Add custom questions for players (e.g., T-shirt size, dietary requirements)
            </p>
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="rounded-[6px] border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className={labelClass} style={mono}>
                        Question
                      </label>
                      <input
                        className={fieldClass}
                        placeholder="Enter your T-shirt size"
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                      />
                    </div>
                    <div className="w-44 shrink-0">
                      <label className={labelClass} style={mono}>
                        Response Type
                      </label>
                      <select
                        className={selectClass}
                        value={q.responseType}
                        onChange={(e) => updateQuestion(q.id, { responseType: e.target.value as ResponseType })}
                      >
                        {responseTypeOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      aria-label="Remove question"
                      className="mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[#8b8b93] transition-colors hover:bg-white/5 hover:text-[#e2e2e8]"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  {q.responseType === "Multiple Choice" && (
                    <div className="border-t border-white/10 pt-3">
                      <p className={labelClass} style={mono}>
                        Options
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-white/30" />
                            <input
                              className={flexFieldClass}
                              style={flexFieldStyle}
                              placeholder="Add option"
                              value={opt}
                              onChange={(e) => updateOption(q.id, i, e.target.value)}
                            />
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(q.id, i)}
                                aria-label="Remove option"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-[#8b8b93] transition-colors hover:bg-white/5 hover:text-[#e2e2e8]"
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#ff8f86] transition-colors hover:text-[#ff2448]"
                        style={mono}
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addQuestion} className={`mt-3 ${dashedButtonClass}`} style={mono}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Question
            </button>
          </div>

          <div>
            <label htmlFor="details" className={labelClass} style={mono}>
              Details for Players
            </label>
            <textarea
              id="details"
              rows={4}
              className={fieldClass}
              placeholder="Anything else players should know before registering."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="border-t border-white/10 pt-8">
            <p className="mb-4 text-xs leading-relaxed text-[#8b8b93]">
              Choose a hosting plan and pay to submit this for admin approval. The event stays hidden from players
              until approved.
            </p>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
              style={mono}
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </div>

      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-[960px] rounded-[14px] border border-white/10 bg-[#0c0e12] p-10 text-[#e2e2e8] ring-0 sm:max-w-[960px]"
        >
          <DialogClose
            render={
              <button
                type="button"
                aria-label="Close"
                className="absolute right-6 top-6 text-[#8b8b93] transition-colors hover:text-[#e2e2e8]"
              />
            }
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </DialogClose>

          <DialogTitle className="mb-3 pr-10 text-3xl font-extrabold tracking-tight text-[#ff8f86] sm:text-4xl" style={display}>
            Choose a hosting plan
          </DialogTitle>
          <DialogDescription className="mb-8 max-w-xl text-sm leading-relaxed text-[#c2c6d7]">
            Pick how you&apos;d like to pay the hosting fee — this submits the tournament for admin approval.
          </DialogDescription>

          <div className="grid gap-5 sm:grid-cols-3">
            {hostingPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col rounded-[10px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6"
              >
                <h3 className="mb-4 text-xl font-bold leading-tight text-[#e2e2e8]" style={display}>
                  {plan.title}
                </h3>
                <p className="mb-4 text-3xl font-extrabold text-[#ff8f86]" style={display}>
                  {formatCurrency(plan.price)}
                </p>
                <p className="mb-8 flex-1 text-sm leading-relaxed text-[#c2c6d7]">{plan.description}</p>
                <button
                  type="button"
                  onClick={submitTournament}
                  className="flex w-full items-center justify-center rounded-[4px] bg-[#ff2448] py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
                  style={mono}
                >
                  Select &amp; Pay
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
