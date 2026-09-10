"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Scale } from "lucide-react";
import {
  DEFAULT_TIE_BREAK_ORDER,
  normalizeTieBreakOrder,
  tieBreakLabel,
  type TieBreakCriterionId,
} from "@/lib/tie-break";

const mono = { fontFamily: "var(--font-home-mono)" };

/**
 * The tournament's group-stage tie-break order.
 *
 * Read-only by default (public event pages, and any place it's shown as
 * reference). Pass `editable` + `onChange` on the Host form so the organizer can
 * drag the criteria into the order they want the live match console to apply
 * when players finish level on group points.
 */
export function TieBreakRules({
  className = "",
  order,
  editable = false,
  onChange,
}: {
  className?: string;
  /** Stored order; defaults to the platform default when absent. */
  order?: readonly TieBreakCriterionId[] | null;
  editable?: boolean;
  onChange?: (order: TieBreakCriterionId[]) => void;
}) {
  const value = normalizeTieBreakOrder(order ?? DEFAULT_TIE_BREAK_ORDER);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (!onChange || from === to || from < 0 || to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className={`rounded-[8px] border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Scale className="h-4 w-4 text-[#ff8f86]" strokeWidth={1.75} />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#c2c6d7]" style={mono}>
          Tie-break order
        </p>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[#8b8b93]">
        {editable
          ? "Drag to set the order the match console applies when players are level on group points (1 is tried first). Every match that ends in a tie is resolved by this order."
          : "When players are level, the qualifiers are decided by the following preference (1 is most preferred, 3 is least):"}
      </p>
      <ol className="space-y-2">
        {value.map((id, i) => (
          <li
            key={id}
            draggable={editable}
            onDragStart={editable ? () => setDragIndex(i) : undefined}
            onDragEnter={editable ? () => setDropIndex(i) : undefined}
            onDragOver={editable ? (e) => e.preventDefault() : undefined}
            onDragEnd={
              editable
                ? () => {
                    setDragIndex(null);
                    setDropIndex(null);
                  }
                : undefined
            }
            onDrop={
              editable
                ? (e) => {
                    e.preventDefault();
                    if (dragIndex !== null) move(dragIndex, i);
                    setDragIndex(null);
                    setDropIndex(null);
                  }
                : undefined
            }
            className={`flex items-center gap-2.5 text-sm text-[#e2e2e8] ${
              editable
                ? `cursor-grab rounded-[6px] border border-white/10 bg-[#1a1c20] px-3 py-2.5 transition-colors ${
                    dragIndex === i ? "opacity-40" : ""
                  } ${
                    dropIndex === i && dragIndex !== null && dragIndex !== i
                      ? "border-[#ff2448]/60"
                      : ""
                  }`
                : "items-start"
            }`}
          >
            <span
              className="mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#ff2448]/40 bg-[#ff2448]/10 text-[11px] font-bold text-[#ff8f86]"
              style={mono}
            >
              {i + 1}
            </span>
            <span className="flex-1">{tieBreakLabel(id)}</span>
            {editable ? (
              <span className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  aria-label={`Move ${tieBreakLabel(id)} up`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#8b8b93] transition-colors hover:bg-white/5 hover:text-[#e2e2e8] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${tieBreakLabel(id)} down`}
                  disabled={i === value.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#8b8b93] transition-colors hover:bg-white/5 hover:text-[#e2e2e8] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={2} />
                </button>
                <GripVertical className="h-4 w-4 text-[#5a5a60]" strokeWidth={2} />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
