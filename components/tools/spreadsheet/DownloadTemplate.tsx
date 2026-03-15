"use client";

import { useState } from "react";
import { downloadTemplate, downloadTemplateCsv } from "@/lib/spreadsheet/generator";

export default function DownloadTemplate() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadTemplate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.12)" }}
        >
          1
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-display font-bold text-xl" style={{ color: "var(--lmx-text)" }}>
            Download the template
          </h2>
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            Pre-formatted XLSX with two sheets — <strong>players</strong> and <strong>picks</strong>.
            Open in Excel or Google Sheets and fill it in as your league progresses.
          </p>
        </div>
      </div>

      {/* Template preview */}
      <div
        className="rounded-lg p-4 text-xs font-mono overflow-x-auto"
        style={{ background: "var(--lmx-surface)", color: "var(--lmx-text-muted)" }}
      >
        <p className="font-display font-bold text-xs uppercase tracking-widest mb-2" style={{ color: "var(--lmx-green)" }}>
          players sheet
        </p>
        <p>player_name · entry_gameweek · status · eliminated_gameweek · notes</p>
        <p className="mt-1 opacity-60">Alice Smith · 1 · active · — · ...</p>
        <p className="opacity-60">Bob Jones · 1 · eliminated · 4 · Picked Chelsea</p>

        <p className="font-display font-bold text-xs uppercase tracking-widest mt-4 mb-2" style={{ color: "var(--lmx-amber)" }}>
          picks sheet
        </p>
        <p>player_name · gameweek · team_picked · result · pick_type</p>
        <p className="mt-1 opacity-60">Alice Smith · 1 · Arsenal · W · manual</p>
        <p className="opacity-60">Bob Jones · 4 · Chelsea · L · manual</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
        >
          {loading ? "Generating…" : "Download Template (.xlsx)"}
        </button>

        <div className="flex gap-3 text-xs pt-1" style={{ color: "var(--lmx-text-muted)" }}>
          <span>Prefer CSV?</span>
          <button
            onClick={() => downloadTemplateCsv("players")}
            className="underline hover:opacity-80 transition-opacity"
          >
            players.csv
          </button>
          <button
            onClick={() => downloadTemplateCsv("picks")}
            className="underline hover:opacity-80 transition-opacity"
          >
            picks.csv
          </button>
        </div>
      </div>
    </div>
  );
}
