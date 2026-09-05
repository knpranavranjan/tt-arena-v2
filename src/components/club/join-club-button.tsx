"use client";

import Link from "next/link";
import { ArrowRight, Check, Lock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentPlayer } from "@/lib/session-data";
import { useJoinRequests } from "@/lib/join-requests";

const baseButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-[2px] py-3.5 text-sm font-semibold uppercase tracking-wide";
const mono = { fontFamily: "var(--font-home-mono)" };

export function JoinClubButton({ clubId, clubName }: { clubId: string; clubName: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const player = useCurrentPlayer();
  const { sendRequest, hasPendingRequest, requests, isLoading: requestsLoading } = useJoinRequests();

  if (authLoading || requestsLoading) {
    return <div className="mt-4 h-[50px] w-full animate-pulse rounded-[2px] bg-white/5" />;
  }

  if (!user) {
    return (
      <>
        <Link
          href={`/login?next=/clubs/${clubId}`}
          className={`mt-4 ${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95`}
          style={mono}
        >
          Join Club
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#8b8b93]">
          <Lock className="h-3 w-3" strokeWidth={2} />
          Login required to send join request
        </p>
      </>
    );
  }

  if (user.role !== "PLAYER" || !player) {
    return (
      <>
        <button type="button" disabled className={`mt-4 ${baseButtonClass} cursor-not-allowed bg-white/10 text-[#8b8b93]`} style={mono}>
          Join Club
        </button>
        <p className="mt-2 text-center text-xs text-[#8b8b93]">Only players can request to join a club.</p>
      </>
    );
  }

  // A player isn't capped at one club — membership here means either their
  // seeded home club or a club whose join request was accepted.
  const isMember =
    player.clubId === clubId ||
    requests.some((r) => r.clubId === clubId && r.playerId === player.id && r.status === "ACCEPTED");

  if (isMember) {
    return (
      <div
        className={`mt-4 ${baseButtonClass} border border-white/15 text-[#c2c6d7]`}
        style={mono}
      >
        <UserCheck className="h-4 w-4" strokeWidth={2} />
        You&apos;re a Member
      </div>
    );
  }

  if (hasPendingRequest(clubId, player.id)) {
    return (
      <>
        <div
          className={`mt-4 ${baseButtonClass} border border-emerald-500/40 bg-emerald-500/10 text-emerald-400`}
          style={mono}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Request Sent
        </div>
        <p className="mt-2 text-center text-xs text-[#8b8b93]">Waiting for {clubName} to respond.</p>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        sendRequest(clubId, player.id, player.name);
        toast.success("Join request sent", { description: `${clubName} will review your request.` });
      }}
      className={`mt-4 ${baseButtonClass} bg-[#ff2448] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95`}
      style={mono}
    >
      Join Club
      <ArrowRight className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
