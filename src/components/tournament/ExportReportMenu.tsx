"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useRegistrations } from "@/lib/registrations";
import { buildExportRows, downloadPlayersCsv, downloadTournamentPdf } from "@/lib/tournament-export";
import type { Tournament } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };

export function ExportReportMenu({ tournament }: { tournament: Tournament }) {
  const { registrations } = useRegistrations();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportPdf = async () => {
    setOpen(false);
    setBusy(true);
    const t = toast.loading("Building PDF report…");
    try {
      await downloadTournamentPdf(tournament.id);
      toast.success("PDF report downloaded", { id: t });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate the PDF", { id: t });
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    setOpen(false);
    try {
      const rows = buildExportRows(tournament, registrations);
      downloadPlayersCsv(tournament, rows);
      toast.success(`Exported ${rows.length} player${rows.length === 1 ? "" : "s"} to CSV`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't export the players list");
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[2px] border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5 disabled:opacity-50"
        style={mono}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        Export Report
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-[6px] border border-white/10 bg-[#161719] py-1 shadow-xl">
            <button
              type="button"
              onClick={exportPdf}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8f86]" strokeWidth={2} />
              <span>
                <span className="block text-xs font-semibold text-[#e2e2e8]">PDF report</span>
                <span className="block text-[11px] text-[#8b8b93]">Overview · registrations · results</span>
              </span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
              <span>
                <span className="block text-xs font-semibold text-[#e2e2e8]">Excel (players)</span>
                <span className="block text-[11px] text-[#8b8b93]">Registered players list — CSV</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
