"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PosterUpload } from "@/components/tournaments/poster-upload";
import { TieBreakRules } from "@/components/tournaments/tie-break-rules";
import { useTournamentEdits } from "@/lib/tournament-edits";
import {
  DEFAULT_TIE_BREAK_ORDER,
  normalizeTieBreakOrder,
  type TieBreakCriterionId,
} from "@/lib/tie-break";
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
const flexFieldStyle = { flex: "1 1 0%", minWidth: 0 };
const amountFieldStyle = { width: 160, flexShrink: 0 };
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

interface CategoryRow {
  /** The `Tournament` record id this row maps to. */
  id: string;
  label: string;
  entryFee: string;
  prizePool: string;
}

function baseName(eventName: string | undefined, tournamentName: string) {
  if (eventName && tournamentName.startsWith(`${eventName} — `)) return eventName;
  const dash = tournamentName.lastIndexOf(" — ");
  return dash > 0 ? tournamentName.slice(0, dash) : eventName ?? tournamentName;
}

function categoryLabel(eventName: string | undefined, t: Tournament) {
  const base = baseName(eventName, t.name);
  if (t.name.startsWith(`${base} — `)) return t.name.slice(base.length + 3);
  return t.category;
}

/**
 * Event-wide "edit the details you submitted on the Host a Tournament form".
 * One form for the whole event — event-level fields apply to every category,
 * and each category's name + fees are editable inline. Saving fans the change
 * out to the event and every category `Tournament` record via the
 * tournament-edits override store, so players see it immediately.
 */
export function EventEditForm({
  event,
  categories,
  backHref,
}: {
  event: TTEvent | undefined;
  categories: Tournament[];
  backHref: string;
}) {
  const { saveTournamentEdit, saveEventEdit } = useTournamentEdits();
  const primary = categories[0];
  const eventName = event?.name;

  const [name, setName] = useState(() => baseName(eventName, primary.name));
  const [date, setDate] = useState(() => event?.date ?? primary.date);
  const [location, setLocation] = useState(() => event?.location ?? primary.venue);
  const [venue, setVenue] = useState(() => event?.venue ?? primary.venue);
  const [totalPrizePool, setTotalPrizePool] = useState(String(primary.totalPrizePool || ""));
  const [format, setFormat] = useState<TournamentFormat>(primary.format);
  const [matchFormat, setMatchFormat] = useState(primary.matchFormat || matchFormatOptions[1]);
  const [ballType, setBallType] = useState(primary.ballType || "");
  const [umpireStatus, setUmpireStatus] = useState(primary.umpireStatus || umpireOptions[0]);
  const [tieBreakOrder, setTieBreakOrder] = useState<TieBreakCriterionId[]>(() =>
    normalizeTieBreakOrder(primary.tieBreakOrder ?? DEFAULT_TIE_BREAK_ORDER),
  );
  const [details, setDetails] = useState(primary.description || "");
  const [poster, setPoster] = useState(event?.posterUrl ?? primary.posterUrl ?? "");
  const [rows, setRows] = useState<CategoryRow[]>(() =>
    categories.map((c) => ({
      id: c.id,
      label: categoryLabel(eventName, c),
      entryFee: String(c.entryFee || ""),
      prizePool: String(c.prizePool || ""),
    })),
  );
  const [questions, setQuestions] = useState<QuestionRow[]>(() =>
    (primary.registrationQuestions ?? []).map((q) => ({
      id: makeId("q"),
      question: q.question,
      responseType: q.responseType,
      options: q.options && q.options.length ? [...q.options] : [""],
    })),
  );

  const initialName = useMemo(() => baseName(eventName, primary.name), [eventName, primary.name]);

  function updateRow(id: string, patch: Partial<CategoryRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
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
  function addOption(qid: string) {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, options: [...q.options, ""] } : q)));
  }
  function updateOption(qid: string, i: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, options: q.options.map((o, j) => (j === i ? value : o)) } : q)),
    );
  }
  function removeOption(qid: string, i: number) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, options: q.options.filter((_, j) => j !== i) } : q)),
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim() || !venue.trim() || rows.some((r) => !r.label.trim())) {
      toast.error("Missing details", {
        description: "Event name, date, location, venue and every category name are required.",
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

    const combinedPrizePool =
      Number(totalPrizePool) ||
      rows.reduce((sum, r) => sum + (Number(r.prizePool) || 0), 0) ||
      undefined;

    // Event-level fields — apply to every category of this event.
    if (event) {
      saveEventEdit(event.id, {
        name: name.trim(),
        date,
        location: location.trim(),
        venue: venue.trim(),
        posterUrl: poster || undefined,
      });
    }

    // Fan the event-level + per-category values out to each category record.
    for (const r of rows) {
      saveTournamentEdit(r.id, {
        name: `${name.trim()} — ${r.label.trim()}`,
        venue: venue.trim(),
        date,
        category: r.label.trim(),
        entryFee: Number(r.entryFee) || 0,
        format,
        matchFormat,
        ballType: ballType.trim() || "Plastic 40+, 3-star (match)",
        umpireStatus,
        prizePool: Number(r.prizePool) || 0,
        totalPrizePool: combinedPrizePool,
        description: details,
        posterUrl: poster || undefined,
        registrationQuestions: registrationQuestions.length ? registrationQuestions : undefined,
        tieBreakOrder,
      });
    }

    toast.success("Details updated", {
      description:
        rows.length > 1
          ? "Every category of this event now shows the changes."
          : "Players see the changes on the event page right away.",
    });
  }

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mb-8 max-w-xl">
        <h2 className="text-lg font-bold uppercase tracking-tight text-[#e2e2e8]" style={mono}>
          Edit tournament details
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8b8b93]">
          The same details you submitted on the &ldquo;Host a Tournament&rdquo; form. This is one form
          for the whole event — a change here updates <span className="text-[#c2c6d7]">every category</span>.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-10">
        <div>
          <label htmlFor="ev-name" className={labelClass} style={mono}>
            Tournament Name
          </label>
          <input id="ev-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          {name.trim() && name.trim() !== initialName ? (
            <p className="mt-1.5 text-xs text-[#8b8b93]">
              Categories will show as{" "}
              <span className="text-[#c2c6d7]">
                {name.trim()} — {rows[0]?.label.trim() || "…"}
              </span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-date" className={labelClass} style={mono}>
              Date
            </label>
            <input
              id="ev-date"
              type="date"
              className={dateFieldClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ev-location" className={labelClass} style={mono}>
              Location
            </label>
            <input
              id="ev-location"
              className={fieldClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="ev-venue" className={labelClass} style={mono}>
            Venue / Club Name
          </label>
          <input id="ev-venue" className={fieldClass} value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>

        <div>
          <h3 className={sectionLabelClass} style={mono}>
            Categories &amp; Entry Fees
          </h3>
          <p className="mb-4 text-xs text-[#8b8b93]">
            One row per category of this event. Editing a name or fee updates that category everywhere.
          </p>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3">
                <input
                  className={fieldClass}
                  style={flexFieldStyle}
                  placeholder="Category (e.g. Under 15, Open)"
                  value={r.label}
                  onChange={(e) => updateRow(r.id, { label: e.target.value })}
                />
                <input
                  className={fieldClass}
                  style={amountFieldStyle}
                  placeholder="Entry fee ₹"
                  inputMode="numeric"
                  value={r.entryFee}
                  onChange={(e) => updateRow(r.id, { entryFee: e.target.value })}
                />
                <input
                  className={fieldClass}
                  style={amountFieldStyle}
                  placeholder="Prize ₹"
                  inputMode="numeric"
                  value={r.prizePool}
                  onChange={(e) => updateRow(r.id, { prizePool: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-format" className={labelClass} style={mono}>
              Format
            </label>
            <select
              id="ev-format"
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
            <label htmlFor="ev-match-format" className={labelClass} style={mono}>
              Match Format
            </label>
            <select
              id="ev-match-format"
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
            The order the live match console applies when players finish level on group points.
          </p>
          <TieBreakRules editable order={tieBreakOrder} onChange={setTieBreakOrder} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-ball" className={labelClass} style={mono}>
              Ball Type
            </label>
            <input
              id="ev-ball"
              className={fieldClass}
              placeholder="Plastic 40+, 3-star (match)"
              value={ballType}
              onChange={(e) => setBallType(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ev-umpire" className={labelClass} style={mono}>
              Will there be an umpire?
            </label>
            <select
              id="ev-umpire"
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
          <label htmlFor="ev-total-prize" className={labelClass} style={mono}>
            Total Cash Prize Pool
          </label>
          <input
            id="ev-total-prize"
            className={fieldClass}
            placeholder="e.g. 50000 — leave blank to sum the category prizes"
            inputMode="numeric"
            value={totalPrizePool}
            onChange={(e) => setTotalPrizePool(e.target.value)}
          />
        </div>

        <div>
          <h3 className={sectionLabelClass} style={mono}>
            Registration Questions
          </h3>
          <p className="mb-4 text-xs text-[#8b8b93]">
            Custom questions players answer when they register (applies to every category).
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
                      {responseTypeOptions.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
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
                            className={fieldClass}
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
          <label htmlFor="ev-details" className={labelClass} style={mono}>
            Details for Players
          </label>
          <textarea
            id="ev-details"
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
            href={backHref}
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
