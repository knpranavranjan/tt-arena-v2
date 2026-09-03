"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import { useMembershipStatus, type MembershipRole } from "@/lib/membership";
import { formatCurrency, formatDate } from "@/lib/format";
import { mono, display } from "@/components/settings/settings-ui";

const copy: Record<MembershipRole, { noun: string; blurb: string }> = {
  PLAYER: {
    noun: "Player",
    blurb: "Register for tournaments, track your rating, and browse clubs across the country.",
  },
  CLUB: {
    noun: "Club",
    blurb: "List your club, manage your roster, and host tournaments under your club name.",
  },
};

// Full-bleed paywall shown at /player/renew and /club/renew — the only
// in-portal page RequireActiveMembership (lib/membership.tsx) lets an
// unpaid or lapsed Player/Club account reach. No DashboardShell chrome:
// they can't do anything else on the site until they pay.
export function MembershipPaywall({ role }: { role: MembershipRole }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { hasRecord, expiresAt, fee, activate } = useMembershipStatus();

  if (!user) return null;

  const handlePay = () => {
    activate();
    toast.success(hasRecord ? "Membership renewed for 1 year" : "Membership activated for 1 year");
    router.push(dashboardPathForRole[role]);
  };

  return (
    <div
      style={{ fontFamily: "var(--font-home-body)" }}
      className="flex min-h-screen flex-col bg-[#050a12] text-[#e2e2e8]"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link href="/" className="text-lg font-extrabold uppercase tracking-tight text-[#e2e2e8]" style={display}>
          SpinTTRatings
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8b8b93] transition-colors hover:text-[#e2e2e8]"
          style={mono}
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          Log out
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[14px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-10 text-center">
          <span
            className="mb-4 inline-block rounded-[2px] border border-[#ff2448]/40 bg-[#ff2448]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ff8f86]"
            style={mono}
          >
            {hasRecord ? "Membership Expired" : "Membership Required"}
          </span>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-[#e2e2e8] sm:text-4xl" style={display}>
            {hasRecord ? "Renew your membership" : `Activate your ${copy[role].noun} membership`}
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-[#8b8b93]">
            {hasRecord
              ? `Your membership expired on ${expiresAt ? formatDate(expiresAt) : "—"}. Renew to get back into your ${copy[
                  role
                ].noun.toLowerCase()} portal.`
              : `${copy[role].blurb} A SpinTTRatings ${copy[role].noun} membership is ${formatCurrency(
                  fee ?? 0,
                )} per year.`}
          </p>

          <p className="mb-1 text-4xl font-extrabold text-[#ff8f86]" style={display}>
            {formatCurrency(fee ?? 0)}
          </p>
          <p className="mb-8 text-xs uppercase tracking-widest text-[#8b8b93]" style={mono}>
            per year · renews annually
          </p>

          <button
            type="button"
            onClick={handlePay}
            className="flex w-full items-center justify-center rounded-[4px] bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
            style={mono}
          >
            {hasRecord ? "Pay & Renew for 1 Year" : "Pay & Activate Membership"}
          </button>

          <p className="mt-4 text-[11px] text-[#5a5a60]">Demo checkout — no real payment is processed.</p>
        </div>
      </main>
    </div>
  );
}
