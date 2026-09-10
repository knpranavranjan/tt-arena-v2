"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PosterUpload } from "@/components/tournaments/poster-upload";
import { TieBreakRules } from "@/components/tournaments/tie-break-rules";
import { getEvent, getTournament } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments, useHostedTournaments } from "@/lib/hosted-tournaments";
import { effectiveStatus, isLive, useTournamentStatus } from "@/lib/tournament-status";
import { useTournamentEdits } from "@/lib/tournament-edits";
import { DEFAULT_TIE_BREAK_ORDER, normalizeTieBreakOrder, type TieBreakCriterionId } from "@/lib/tie-break";
import type {
  QuestionResponseType,
  RegistrationQuestion,
  Tournament,
  TournamentFormat,
  TTEvent,
} from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };

const fieldClass =
  "w-full rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] transition-colors focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]";
const flexFieldClass = fieldClass.replace("w-full", "min-w-0 flex-1");
const flexFieldStyle = { flex: "1 1 0%", minWidth: 0 };
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

const formatOptions: { value: TournamentFormat; label: string }[] = [
  { value: "POOL_KNOCKOUT", label: "Round Robin + Knockouts" },
  { value: "ROUND_ROBIN_LEAGUE", label: "Round Robin / League" },
  { value: "SINGLE_ELIMINATION", label: "Direct Knockout" },
];
const matchFormatOptions = ["Best of 3 sets", "Best of 5 sets", "Best of 7 sets"];
const umpireOptions = ["No – self-officiated", "Yes – club umpire", "Yes – certified umpire"];
const responseTypeOptions: QuestionResponseType[] = ["Multiple Choice", "Short Answer", "Yes / No"];

interface QuestionRow {
  id: string;
  question: string;
  responseType: QuestionResponseType;
  options: string[];
}

/** The event name on its own — a category `Tournament.name` is
 *  `"<event> — <category>"`, so strip that suffix for the name field. */
function baseName(eventName: string | undefined, tournamentName: string) {
  if (eventName && tournamentName.startsWith(`${eventName} — `)) return eventName;
  const dash = tournamentName.lastIndexOf(" — ");
  return dash > 0 ? tournamentName.slice(0, dash) : eventName ?? tournamentName;
}

/** The category label as it currently reads in the tournament name (e.g.
 *  "Under 21 Singles"), falling back to the bare `category` field. Prefilling
 *  from the name keeps a no-op save from rewriting the visible title. */
function categoryLabel(eventName: string | undefined, t: Tournament) {
  const base = baseName(eventName, t.name);
  if (t.name.startsWith(`${base} — `)) return t.name.slice(base.length + 3);
  return t.category;
}

export default function ManageHostTournamentEditPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;

  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { isLoading } = useHostedTournaments();
  const { overrides } = useTournamentStatus();

  const tournament =
    allTournaments.find((t) => t.id === tournamentId) ??
    (tournamentId ? getTournament(tournamentId) : undefined);
  const event =
    allEvents.find((e) => e.id === tournament?.eventId) ??
    (tournament ? getEvent(tournament.eventId) : undefined);

  if (isLoading) {
    return <div className="h-96 w-full animate-pulse rounded-[8px] bg-white/5" />;
  }

  if (!tournament) {
    return (
      <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
        <p className="text-sm font-semibold text-[#e2e2e8]">Tournament not found</p>
      </div>
    );
  }

  if (!isLive(effectiveStatus(tournament, overrides))) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm font-semibold text-[#e2e2e8]">Editing opens once the tournament is live</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#8b8b93]">
          While it&apos;s still a draft awaiting approval, change the details by resubmitting the host form.
          Once an admin approves it, this tab lets you edit everything players see.
        </p>
        <Link
          href={`/host/tournaments/${tournament.id}`}
          className="mt-4 inline-flex items-center rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
          style={mono}
        >
          Back to Overview
        </Link>
      </div>
    );
  }

  return <EditForm key={tournament.id} tournament={tournament} event={event} />;
}

function EditForm({ tournament, event }: { tournament: Tournament; event: TTEvent | undefined }) {
  const { saveTournamentEdit, saveEventEdit } = useTournamentEdits();

  const [name, setName] = useState(() => baseName(event?.name, tournament.name));
  const [date, setDate] = useState(() => event?.date ?? tournament.date);
  const [location, setLocation] = useState(() => event?.location ?? tournament.venue);
  const [venue, setVenue] = useState(() => event?.venue ?? tournament.venue);
  const [category, setCategory] = useState(() => categoryLabel(event?.name, tournament));
  const [entryFee, setEntryFee] = useState(String(tournament.entryFee || ""));
  const [prizePool, setPrizePool] = useState(String(tournament.prizePool || ""));
  const [totalPrizePool, setTotalPrizePool] = useState(String(tournament.totalPrizePool || ""));
  const [format, setFormat] = useState<TournamentFormat>(tournament.format);
  const [matchFormat, setMatchFormat] = useState(tournament.matchFormat || matchFormatOptions[1]);
  const [ballType, setBallType] = useState(tournament.ballType || "");
  const [umpireStatus, setUmpireStatus] = useState(tournament.umpireStatus || umpireOptions[0]);
  const [tieBreakOrder, setTieBreakOrder] = useState<TieBreakCriterionId[]>(() =>
    normalizeTieBreakOrder(tournament.tieBreakOrder ?? DEFAULT_TIE_BREAK_ORDER),
  );
  const [details, setDetails] = useState(tournament.description || "");
  const [poster, setPoster] = useState(event?.posterUrl ?? tournament.posterUrl ?? "");
  const [questions, setQuestions] = useState<QuestionRow[]>(() =>
    (tournament.registrationQuestions ?? []).map((q) => ({
      id: makeId("q"),
      question: q.question,
      responseType: q.responseType,
      options: q.options && q.options.length ? [...q.options] : [""],
    })),
  );

  const initialName = useMemo(() => baseName(event?.name, tournament.name), [event?.name, tournament.name]);

  function updateQuestion(id: string, patch: Partial<QuestionRow>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: makeId("q"), question: "", responseType: "Multiple Choice", options: [""] },
    ]);
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
      prev.map((q) =>
        q.id === questionId ? { ...q, options: q.options.filter((_, i) => i !== index) } : q,
      ),
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim() || !venue.trim() || !category.trim()) {
      toast.error("Missing details", {
        description: "Tournament name, date, location, venue and category can't be blank.",
      });
      return;
    }

    const registrationQuestions: RegistrationQuestion[] = questions
      .filter((q) => q.question.trim())
      .map((q) => ({
        question: q.question.trim(),
        responseType: q.responseType,
        options:
          q.responseType === "Multiple Choice"
            ? q.options.map((o) => o.trim()).filter(Boolean)
            : undefined,
      }));

    const combinedPrizePool = Number(totalPrizePool) || Number(prizePool) || undefined;
    const derivedName = `${name.trim()} — ${category.trim()}`;

    saveTournamentEdit(tournament.id, {
      name: derivedName,
      venue: venue.trim(),
      date,
      category: category.trim(),
      entryFee: Number(entryFee) || 0,
      format,
      matchFormat,
      ballType: ballType.trim() || "Plastic 40+, 3-star (match)",
      umpireStatus,
      prizePool: Number(prizePool) || 0,
      totalPrizePool: combinedPrizePool,
      description: details,
      posterUrl: poster || undefined,
      registrationQuestions: registrationQuestions.length ? registrationQuestions : undefined,
      tieBreakOrder,
    });

    if (event) {
      saveEventEdit(event.id, {
        name: name.trim(),
        date,
        location: location.trim(),
        venue: venue.trim(),
        posterUrl: poster || undefined,
      });
    }

    toast.success("Details updated", {
      description: "Players see the changes on the event page right away.",
    });
  }

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mb-8 max-w-xl">
        <h2 className="text-lg font-bold uppercase tracking-tight text-[#e2e2e8]" style={mono}>
          Edit tournament details
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8b8b93]">
          Change anything you submitted on the host form. Event-level fields (name, date, location, venue,
          poster) apply to every category of this event.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-10">
        <div>
          <label htmlFor="name" className={labelClass} style={mono}>
            Tournament Name
          </label>
          <input id="name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          {name.trim() && name.trim() !== initialName ? (
            <p className="mt-1.5 text-xs text-[#8b8b93]">
              This category will show as <span className="text-[#c2c6d7]">{name.trim()} — {category.trim() || "…"}</span>
            </p>
          ) : null}
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
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="venue" className={labelClass} style={mono}>
            Venue / Club Name
          </label>
          <input id="venue" className={fieldClass} value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>

        <div>
          <h3 className={sectionLabelClass} style={mono}>
            Category &amp; Entry Fee
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className={flexFieldClass}
              style={flexFieldStyle}
              placeholder="Category (e.g. Under 15, Open)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <input
              className={`${fieldClass} w-52 shrink-0`}
              style={amountFieldStyle}
              placeholder="Entry fee ₹"
              inputMode="numeric"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
            />
          </div>
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

        <div>
          <h3 className={sectionLabelClass} style={mono}>
            Tie-break Rules
          </h3>
          <p className="mb-4 text-xs text-[#8b8b93]">
            Set the order the live match console applies when players finish level on group points. Shown to
            players on the event page.
          </p>
          <TieBreakRules editable order={tieBreakOrder} onChange={setTieBreakOrder} />
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
          <h3 className={sectionLabelClass} style={mono}>
            Cash Prize Pool
          </h3>
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
            <div className="flex flex-wrap items-center gap-3">
              <input
                className={`${flexFieldClass} cursor-not-allowed text-[#8b8b93]`}
                style={flexFieldStyle}
                value={category}
                disabled
              />
              <input
                className={`${fieldClass} w-52 shrink-0`}
                style={amountFieldStyle}
                placeholder="Prize Pool ₹"
                inputMode="numeric"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionLabelClass} style={mono}>
            Registration Questions
          </h3>
          <p className="mb-4 text-xs text-[#8b8b93]">
            Custom questions players answer when they register (e.g., T-shirt size, dietary requirements).
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
                      onChange={(e) =>
                        updateQuestion(q.id, { responseType: e.target.value as QuestionResponseType })
                      }
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
          <h3 className={sectionLabelClass} style={mono}>
            Event Poster
          </h3>
          <PosterUpload value={poster} onChange={setPoster} />
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

        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-[2px] bg-[#ff2448] px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
            style={mono}
          >
            Save Changes
          </button>
          <Link
            href={`/host/tournaments/${tournament.id}`}
            className="flex items-center justify-center rounded-[2px] border border-white/15 px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
            style={mono}
          >
            Back to Overview
          </Link>
        </div>
      </form>
    </div>
  );
}
