"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_TYPES, limitsFor } from "@/lib/tournament-categories";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };

/** Age | Rating switch at the start of a category row (host form + edit form). */
export function CategoryTypeToggle({
  value,
  onChange,
}: {
  value: CategoryType;
  onChange: (value: CategoryType) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Category type"
      className="flex shrink-0 overflow-hidden rounded-[4px] border border-white/10 bg-[#1a1c20]"
    >
      {CATEGORY_TYPES.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors",
              active ? "bg-[#ff2448] text-white" : "text-[#8b8b93] hover:text-[#e2e2e8]",
            )}
            style={mono}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const PAGE_SIZE = 12;

/**
 * The entry restriction for a category — numbers only: rating 50 … 3000 or
 * age 1 … 100. Players must be under it to register. Blank = open to all.
 *
 * A paged number-grid picker (like a calendar's year picker): ‹ range ›,
 * 12 numbers in a 3-column grid, the chosen one in the theme red. Layout-
 * critical styling is inline so it never depends on a utility class being
 * present in the compiled CSS.
 */
export function CategoryLimitSelect({
  type,
  value,
  onChange,
  style,
}: {
  type: CategoryType;
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}) {
  const label = type === "RATING" ? "Rating" : "Age";
  const numbers = limitsFor(type);
  const pageCount = Math.ceil(numbers.length / PAGE_SIZE);
  const pageOf = (v: string) => Math.max(0, Math.floor(Math.max(0, numbers.indexOf(Number(v))) / PAGE_SIZE));

  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  // Hover tint in state: this project's CSS is precompiled, so a new hover:
  // utility class wouldn't exist.
  const [hovered, setHovered] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popId = useId();

  const pageNumbers = numbers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rangeLabel = `${pageNumbers[0]}–${pageNumbers[pageNumbers.length - 1]}`;

  const openPicker = () => {
    setPage(value ? pageOf(value) : 0);
    setOpen(true);
  };
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navBtn = (disabled: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#1a1c20",
    color: disabled ? "#4a4a52" : "#c2c6d7",
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <div ref={wrapRef} style={{ position: "relative", ...style }}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={`${label} limit — players must be under this`}
        title={`${label} limit — players must be under this`}
        onClick={() => (open ? setOpen(false) : openPicker())}
        style={{
          outline: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          height: 46,
          padding: "0 10px 0 14px",
          borderRadius: 4,
          border: `1px solid ${open ? "#ff2448" : "rgba(255,255,255,0.1)"}`,
          background: "#1a1c20",
          fontSize: 14,
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: "#8b8b93" }}>{label}</span>{" "}
          <span style={{ color: value ? "#e2e2e8" : "#5a5a60", fontWeight: value ? 600 : 400 }}>{value || "any"}</span>
        </span>
        <ChevronDown
          strokeWidth={2}
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            color: open ? "#ff2448" : "#8b8b93",
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 150ms",
          }}
        />
      </button>

      {open && (
        <div
          id={popId}
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()} limit`}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 40,
            width: 232,
            padding: 12,
            borderRadius: 12,
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* ‹ range › */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              type="button"
              aria-label="Previous numbers"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={navBtn(page === 0)}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} strokeWidth={2} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e2e8", fontVariantNumeric: "tabular-nums" }}>
              {rangeLabel}
            </span>
            <button
              type="button"
              aria-label="Next numbers"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              style={navBtn(page >= pageCount - 1)}
            >
              <ChevronRight style={{ width: 16, height: 16 }} strokeWidth={2} />
            </button>
          </div>

          {/* 3-column number grid */}
          <div role="listbox" aria-label={`${label} limit`} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {pageNumbers.map((n) => {
              const selected = String(n) === value;
              return (
                <button
                  key={n}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(String(n))}
                  onMouseEnter={() => setHovered(String(n))}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    height: 34,
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: selected ? 700 : 500,
                    fontVariantNumeric: "tabular-nums",
                    color: selected ? "#ffffff" : "#e2e2e8",
                    background: selected ? "#ff2448" : hovered === String(n) ? "rgba(255,255,255,0.08)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* open category */}
          <button
            type="button"
            onClick={() => choose("")}
            onMouseEnter={() => setHovered("any")}
            onMouseLeave={() => setHovered(null)}
            style={{
              marginTop: 8,
              width: "100%",
              height: 32,
              borderRadius: 6,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12,
              fontWeight: 600,
              color: value ? "#c2c6d7" : "#ffffff",
              background: !value ? "#ff2448" : hovered === "any" ? "rgba(255,255,255,0.08)" : "transparent",
              cursor: "pointer",
            }}
          >
            Any (no limit)
          </button>
        </div>
      )}
    </div>
  );
}
