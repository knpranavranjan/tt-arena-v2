// Tournament days are IST calendar days (see lib/ist-calendar.ts) — render
// them in IST so every viewer sees the same day the tournament is live on.
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

const istParts = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year") };
};

/**
 * A tournament's days: "13 Sept 2026" for one day, "12–14 Sept 2026" within a
 * month, "30 Sept – 2 Oct 2026" across months, full dates across years.
 */
export function formatDateRange(start: string, end?: string) {
  if (!end || end.slice(0, 10) <= start.slice(0, 10)) return formatDate(start);
  const a = istParts(start);
  const b = istParts(end);
  if (a.year !== b.year) return `${formatDate(start)} – ${formatDate(end)}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day}–${b.day} ${b.month} ${b.year}`;
}

/** Dates of anything carrying `date` + optional `endDate` (event, category, event group). */
export function formatEventDates(x: { date: string; endDate?: string }) {
  return formatDateRange(x.date, x.endDate);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function abbreviateName(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  return `${parts[0][0]}. ${last}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
