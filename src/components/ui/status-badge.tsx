import { cn } from "@/lib/utils";
import type {
  EventStatus,
  MatchStatus,
  RatingExportStatus,
  RegistrationStatus,
  TournamentStatus,
} from "@/lib/types";
import { LiveDot } from "@/components/motion/live-dot";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide";

const tone = {
  neutral: "border-border bg-secondary text-secondary-foreground",
  info: "border-primary/30 bg-accent text-accent-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  live: "border-live/40 bg-live/10 text-live",
  gold: "border-champion/40 bg-champion/10 text-champion",
} as const;

const tournamentStatusMap: Record<TournamentStatus, { label: string; tone: keyof typeof tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  REGISTRATION_OPEN: { label: "Registration Open", tone: "success" },
  REGISTRATION_CLOSED: { label: "Registration Closed", tone: "warning" },
  SEEDING: { label: "Seeding", tone: "info" },
  POOLS: { label: "Pools", tone: "info" },
  KNOCKOUT: { label: "In Progress", tone: "live" },
  COMPLETED: { label: "Completed", tone: "gold" },
};

export function TournamentStatusBadge({ status, className }: { status: TournamentStatus; className?: string }) {
  const { label, tone: t } = tournamentStatusMap[status];
  return (
    <span className={cn(base, tone[t], className)}>
      {status === "KNOCKOUT" && <LiveDot />}
      {label}
    </span>
  );
}

const registrationStatusMap: Record<RegistrationStatus, { label: string; tone: keyof typeof tone }> = {
  AVAILABLE: { label: "Available", tone: "success" },
  REGISTERED: { label: "Registered", tone: "info" },
  REGISTRATION_CLOSED: { label: "Registration Closed", tone: "warning" },
  TOURNAMENT_STARTED: { label: "Tournament Started", tone: "live" },
  COMPLETED: { label: "Completed", tone: "gold" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
};

export function RegistrationStatusBadge({ status, className }: { status: RegistrationStatus; className?: string }) {
  const { label, tone: t } = registrationStatusMap[status];
  return <span className={cn(base, tone[t], className)}>{label}</span>;
}

const eventStatusMap: Record<EventStatus, { label: string; tone: keyof typeof tone }> = {
  UPCOMING: { label: "Upcoming", tone: "info" },
  LIVE: { label: "Live", tone: "live" },
  COMPLETED: { label: "Completed", tone: "neutral" },
};

export function EventStatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const { label, tone: t } = eventStatusMap[status];
  return (
    <span className={cn(base, tone[t], className)}>
      {status === "LIVE" && <LiveDot />}
      {label}
    </span>
  );
}

const matchStatusMap: Record<MatchStatus, { label: string; tone: keyof typeof tone }> = {
  SCHEDULED: { label: "Scheduled", tone: "neutral" },
  LIVE: { label: "Live", tone: "live" },
  COMPLETED: { label: "Completed", tone: "success" },
};

export function MatchStatusBadge({ status, className }: { status: MatchStatus; className?: string }) {
  const { label, tone: t } = matchStatusMap[status];
  return (
    <span className={cn(base, tone[t], className)}>
      {status === "LIVE" && <LiveDot />}
      {label}
    </span>
  );
}

const ratingExportMap: Record<RatingExportStatus, { label: string; tone: keyof typeof tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  SENT: { label: "Sent", tone: "success" },
  FAILED: { label: "Failed", tone: "live" },
};

export function RatingExportStatusBadge({ status, className }: { status: RatingExportStatus; className?: string }) {
  const { label, tone: t } = ratingExportMap[status];
  return <span className={cn(base, tone[t], className)}>{label}</span>;
}
