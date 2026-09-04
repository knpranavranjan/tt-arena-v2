import {
  derivedPlayerPhone,
  getCategoryBreakdown,
  getPlayer,
  getTournament,
  getTournamentPlayers,
  tournamentCode,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { Tournament } from "@/lib/types";
import type { TournamentRegistration } from "@/lib/registrations";

/* ---------------------------------------------------------------- shared */

export interface ExportRow {
  playerId: string;
  name: string;
  club: string;
  category: string;
  phone: string;
  entries: number;
  amountPaid: number;
  registeredAt: string;
  status: "Registered" | "Payment Pending";
}

/**
 * The registrant list, matching what the Registrations tab shows: the seeded
 * roster plus any live public sign-ups, newest first.
 */
export function buildExportRows(
  tournament: Tournament,
  liveRegs: readonly TournamentRegistration[],
): ExportRow[] {
  const deadline = new Date(tournament.registrationDeadline).getTime();

  const seedRows: ExportRow[] = getTournamentPlayers(tournament).map((p, i) => {
    const seed = Number(p.id.replace(/\D/g, "")) || i + 1;
    return {
      playerId: p.id,
      name: p.name,
      club: p.clubName ?? "Unaffiliated",
      category: String(p.category),
      phone: derivedPlayerPhone(p),
      entries: 1,
      amountPaid: tournament.entryFee,
      registeredAt: new Date(deadline - (1 + (seed % 10)) * 86_400_000).toISOString(),
      status: "Registered",
    };
  });

  const seen = new Set(seedRows.map((r) => r.playerId));
  const liveRows: ExportRow[] = liveRegs
    .filter((r) => r.tournamentId === tournament.id && !seen.has(r.playerId))
    .map((r) => {
      const p = getPlayer(r.playerId);
      return {
        playerId: r.playerId,
        name: r.playerName,
        club: p?.clubName ?? "Unaffiliated",
        category: p ? String(p.category) : String(tournament.category),
        phone: p ? derivedPlayerPhone(p) : "—",
        entries: 1,
        amountPaid: r.status === "REGISTERED" ? tournament.entryFee : 0,
        registeredAt: r.createdAt,
        status: r.status === "REGISTERED" ? "Registered" : "Payment Pending",
      };
    });

  return [...seedRows, ...liveRows].sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
  );
}

export function overviewData(tournament: Tournament) {
  const totalRegistrations = tournament.registeredPlayerIds.length;
  return {
    totalRegistrations,
    maxPlayers: tournament.maxPlayers,
    feeCollected: totalRegistrations * tournament.entryFee,
    feeRefunded: 0,
    payoutPending: 0,
    breakdown: getCategoryBreakdown(tournament).map((r) => ({
      category: String(r.category),
      spotsFilled: r.spotsFilled,
      spotsTotal: r.spotsTotal,
      fillPct: r.spotsTotal > 0 ? Math.round((r.spotsFilled / r.spotsTotal) * 100) : 0,
      feeCollected: r.feeCollected,
    })),
  };
}

/* ------------------------------------------------ published results (draws) */

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat";
}

export interface PublishedResult {
  category: string;
  championName: string | null;
  runnerUpName: string | null;
  players: number;
  matchesPlayed: number;
}

/** Read the per-category champion / runner-up from the local draws store. */
export function readPublishedResults(tournament: Tournament): PublishedResult[] {
  let blob: unknown;
  try {
    const raw = window.localStorage.getItem("tt-demo-draws");
    blob = raw ? JSON.parse(raw)?.[tournament.id] : null;
  } catch {
    blob = null;
  }
  if (!blob || typeof blob !== "object") return [];

  const store = blob as {
    draws?: Record<string, { players?: unknown[]; poolMatches?: { played?: boolean }[]; bracket?: unknown }>;
    published?: Record<string, { champion?: string; runnerUp?: string }>;
  };
  const published = store.published ?? {};
  const draws = store.draws ?? {};

  const idToName = new Map<string, string>();
  for (const r of getCategoryBreakdown(tournament)) idToName.set(slug(String(r.category)), String(r.category));
  if (idToName.size === 0) idToName.set(slug(tournament.category || "open"), tournament.category || "Open");

  const name = (id?: string) => (id ? (getPlayer(id)?.name ?? id) : null);

  return Object.keys(published).map((catId) => {
    const draw = draws[catId];
    const koPlayed = draw?.bracket
      ? countBracketPlayed(draw.bracket)
      : 0;
    return {
      category: idToName.get(catId) ?? catId,
      championName: name(published[catId]?.champion),
      runnerUpName: name(published[catId]?.runnerUp),
      players: draw?.players?.length ?? 0,
      matchesPlayed: (draw?.poolMatches?.filter((m) => m.played).length ?? 0) + koPlayed,
    };
  });
}

function countBracketPlayed(bracket: unknown): number {
  const b = bracket as { rounds?: { played?: boolean; isBye?: boolean }[][]; thirdPlace?: { played?: boolean; isBye?: boolean } };
  let n = 0;
  for (const round of b.rounds ?? []) for (const m of round) if (m.played && !m.isBye) n += 1;
  if (b.thirdPlace?.played && !b.thirdPlace.isBye) n += 1;
  return n;
}

/** ASCII-safe rupee formatting — jsPDF's core fonts have no ₹ glyph. */
function inr(amount: number): string {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

/* ---------------------------------------------------------------- CSV */

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Excel-friendly CSV of the registrant list. */
export function downloadPlayersCsv(tournament: Tournament, rows: ExportRow[]) {
  const header = ["#", "Name", "Club", "Category", "Phone", "Entries", "Amount Paid (INR)", "Registered On", "Status"];
  const lines = [
    header,
    ...rows.map((r, i) => [
      i + 1,
      r.name,
      r.club,
      r.category,
      r.phone,
      r.entries,
      r.amountPaid,
      formatDate(r.registeredAt),
      r.status,
    ]),
  ];
  const csv = "﻿" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${tournamentCode(tournament)}-players.csv`);
}

/* ---------------------------------------------------------------- PDF */

/** Three-page PDF: overview, registrations by category, champion. */
export async function downloadTournamentPdf(tournamentId: string) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return;

  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default;

  // Registrant rows — read live regs straight from storage so the caller
  // doesn't have to thread the hook through.
  let liveRegs: TournamentRegistration[] = [];
  try {
    const raw = window.localStorage.getItem("tt-demo-registrations");
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) liveRegs = parsed;
  } catch {
    liveRegs = [];
  }

  const rows = buildExportRows(tournament, liveRegs);
  const ov = overviewData(tournament);
  const results = readPublishedResults(tournament);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 40;

  const title = (text: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20);
    doc.text(text, M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
  };

  /* ---- page 1 — overview ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(tournament.name, M, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(
    `#${tournamentCode(tournament)}   ·   ${tournament.venue}   ·   ${formatDate(tournament.date)}   ·   ${tournament.status.replace(/_/g, " ")}`,
    M,
    74,
  );

  title("Overview", 108);
  autoTable(doc, {
    startY: 120,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 200 } },
    body: [
      ["Total registrations", `${ov.totalRegistrations} of ${ov.maxPlayers} spots`],
      ["Fee collected", inr(ov.feeCollected)],
      ["Fee refunded", inr(ov.feeRefunded)],
      ["Payout pending", inr(ov.payoutPending)],
    ],
  });

  const afterKpis = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  title("Categories breakdown", afterKpis);
  autoTable(doc, {
    startY: afterKpis + 12,
    headStyles: { fillColor: [20, 20, 22] },
    styles: { fontSize: 9.5, cellPadding: 5 },
    head: [["Category", "Spots filled", "Fill %", "Fee collected"]],
    body: ov.breakdown.map((r) => [
      r.category,
      `${r.spotsFilled} / ${r.spotsTotal}`,
      `${r.fillPct}%`,
      inr(r.feeCollected),
    ]),
  });

  /* ---- page 2 — registrations by category ---- */
  doc.addPage();
  title("Registrations — all players by category", 56);

  const byCategory = new Map<string, ExportRow[]>();
  for (const r of rows) {
    const list = byCategory.get(r.category) ?? [];
    list.push(r);
    byCategory.set(r.category, list);
  }

  let y = 76;
  for (const [category, list] of byCategory) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(`${category}  (${list.length})`, M, y);
    autoTable(doc, {
      startY: y + 8,
      margin: { left: M, right: M },
      headStyles: { fillColor: [20, 20, 22] },
      styles: { fontSize: 9, cellPadding: 4 },
      head: [["#", "Name", "Club", "Phone", "Amount", "Registered", "Status"]],
      body: list.map((r, i) => [
        i + 1,
        r.name,
        r.club,
        r.phone,
        inr(r.amountPaid),
        formatDate(r.registeredAt),
        r.status,
      ]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      y = 56;
    }
  }
  if (byCategory.size === 0) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text("No registrations yet.", M, y);
  }

  /* ---- page 3 — champion ---- */
  doc.addPage();
  title("Results", 56);

  if (results.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text("Results have not been published for this tournament yet.", M, 80);
  } else {
    autoTable(doc, {
      startY: 72,
      headStyles: { fillColor: [20, 20, 22] },
      styles: { fontSize: 10, cellPadding: 6 },
      head: [["Category", "Champion", "Runner-up", "Players", "Matches"]],
      body: results.map((r) => [
        r.category,
        r.championName ?? "—",
        r.runnerUpName ?? "—",
        String(r.players),
        String(r.matchesPlayed),
      ]),
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")} · SpinTTRatings`, M, doc.internal.pageSize.getHeight() - 24);

  doc.save(`${tournamentCode(tournament)}-report.pdf`);
}
