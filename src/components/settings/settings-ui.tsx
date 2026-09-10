"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { useMembershipStatus } from "@/lib/membership";

export const mono = { fontFamily: "var(--font-home-mono)" };
export const display = { fontFamily: "var(--font-home-display)" };

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
        {title}
      </h2>
      {description && <p className="mt-1.5 text-sm text-[#8b8b93]">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function SettingsField({
  label,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
      />
    </label>
  );
}

export function SettingsTextArea({
  label,
  className,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {label}
      </span>
      <textarea
        {...props}
        className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
      />
    </label>
  );
}

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#e2e2e8]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[#8b8b93]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#ff2448]" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={`self-start rounded-[2px] bg-[#ff2448] px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_-4px_#ff2448] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        className ?? ""
      }`}
      style={mono}
    >
      {children}
    </button>
  );
}

export interface PaymentRow {
  id: string;
  description: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Refunded";
}

const paymentStatusClass: Record<PaymentRow["status"], string> = {
  Paid: "border border-[#ff2448]/40 bg-[#ff2448]/10 text-[#ff8f86]",
  Pending: "border border-amber-400/40 bg-amber-400/10 text-amber-300",
  Refunded: "border border-white/20 bg-[#111318]/80 text-[#8b8b93]",
};

export function PaymentHistoryTable({ rows }: { rows: PaymentRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#8b8b93]">No payments yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-[8px] border border-white/10">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 text-right font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/10 last:border-0">
              <td className="px-4 py-3.5 font-medium text-[#e2e2e8]">{r.description}</td>
              <td className="px-4 py-3.5 text-[#8b8b93]">{formatDate(r.date)}</td>
              <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-[#e2e2e8]">
                {formatCurrency(r.amount)}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${paymentStatusClass[r.status]}`}
                  style={mono}
                >
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SupportSection() {
  return (
    <SettingsSection title="Support" description="Need a hand? We usually respond within 24 hours.">
      <p className="text-sm leading-relaxed text-[#c2c6d7]">
        Reach us at{" "}
        <a href="mailto:support@spinttratings.app" className="text-[#ff8f86] hover:text-[#ff2448]">
          support@spinttratings.app
        </a>{" "}
        or send a message below and our team will get back to you.
      </p>
      <SettingsButton
        onClick={() =>
          toast.success("Message sent", { description: "Our support team will reach out to you shortly." })
        }
      >
        Contact Support
      </SettingsButton>
    </SettingsSection>
  );
}

// Shown in Player and Club Settings only — renders the signed-in user's
// annual membership status and lets them renew (even before it expires,
// which just pushes expiresAt out another year from now).
export function MembershipSection() {
  const { isLoading, isActive, expiresAt, daysRemaining, fee, activate } = useMembershipStatus();

  if (isLoading) return null;

  return (
    <SettingsSection title="Membership" description="Your annual SpinTTRatings membership.">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-white/10 bg-[#111318]/60 p-4">
        <div>
          <span
            className={`inline-flex items-center rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              isActive
                ? "border border-[#ff2448]/40 bg-[#ff2448]/10 text-[#ff8f86]"
                : "border border-white/20 bg-[#111318]/80 text-[#8b8b93]"
            }`}
            style={mono}
          >
            {isActive ? "Active" : "Expired"}
          </span>
          <p className="mt-2 text-sm text-[#c2c6d7]">
            {isActive && expiresAt
              ? `Renews on ${formatDate(expiresAt)}${
                  daysRemaining !== null ? ` (${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left)` : ""
                }`
              : "Your membership has expired."}
          </p>
          {fee !== undefined && <p className="mt-1 text-xs text-[#8b8b93]">{formatCurrency(fee)} / year</p>}
        </div>
        <SettingsButton
          onClick={() => {
            activate();
            toast.success("Membership renewed for 1 year");
          }}
        >
          Renew for 1 Year
        </SettingsButton>
      </div>
    </SettingsSection>
  );
}

export function PasswordSection() {
  return (
    <SettingsSection title="Password" description="Change the password used to sign in.">
      <SettingsField label="Current Password" type="password" placeholder="••••••••" autoComplete="current-password" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField label="New Password" type="password" placeholder="••••••••" autoComplete="new-password" />
        <SettingsField label="Confirm New Password" type="password" placeholder="••••••••" autoComplete="new-password" />
      </div>
      <SettingsButton onClick={() => toast.success("Password updated")}>Update Password</SettingsButton>
    </SettingsSection>
  );
}
