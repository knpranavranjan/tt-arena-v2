import { Scale } from "lucide-react";

const mono = { fontFamily: "var(--font-home-mono)" };

/**
 * Platform-wide tie-break order. This is not host-configurable — every
 * SpinTTRatings tournament resolves ties the same way — so it's shown as fixed
 * information on the host form and on every public event page.
 */
export const TIE_BREAK_ORDER = [
  "Point difference",
  "Head-to-head result",
  "Games won and games lost",
] as const;

export function TieBreakRules({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[8px] border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Scale className="h-4 w-4 text-[#ff8f86]" strokeWidth={1.75} />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#c2c6d7]" style={mono}>
          Tie-break order
        </p>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[#8b8b93]">
        When players are level, the qualifiers are decided by the following preference (1 is most preferred,
        3 is least):
      </p>
      <ol className="space-y-2">
        {TIE_BREAK_ORDER.map((rule, i) => (
          <li key={rule} className="flex items-start gap-2.5 text-sm text-[#e2e2e8]">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#ff2448]/40 bg-[#ff2448]/10 text-[11px] font-bold text-[#ff8f86]"
              style={mono}
            >
              {i + 1}
            </span>
            {rule}
          </li>
        ))}
      </ol>
    </div>
  );
}
