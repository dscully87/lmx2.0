"use client";

import { useState } from "react";
import DownloadTemplate from "./DownloadTemplate";
import UploadZone from "./UploadZone";
import ReportView from "./ReportView";
import type { LeagueData, ParseError } from "@/lib/spreadsheet/types";

type PageState =
  | { stage: "idle" }
  | { stage: "report"; data: LeagueData; warnings: ParseError[] };

export default function SpreadsheetToolPage() {
  const [state, setState] = useState<PageState>({ stage: "idle" });

  return (
    <main className="min-h-screen" style={{ background: "var(--lmx-surface)" }}>
      {/* Hero */}
      <section
        className="relative py-20 px-4 flex flex-col items-center text-center overflow-hidden"
        style={{ background: "var(--lmx-surface-mid)" }}
      >
        {/* Pitch overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
          viewBox="0 0 800 400"
          fill="none"
          aria-hidden="true"
        >
          <rect x="40" y="40" width="720" height="320" stroke="#34D399" strokeWidth="2" />
          <circle cx="400" cy="200" r="60" stroke="#34D399" strokeWidth="2" />
          <line x1="400" y1="40" x2="400" y2="360" stroke="#34D399" strokeWidth="2" />
        </svg>

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
          <span
            className="text-xs tracking-[0.3em] uppercase font-display"
            style={{ color: "var(--lmx-green)" }}
          >
            Free Tool
          </span>
          <h1 className="font-display font-bold text-3xl md:text-5xl" style={{ color: "var(--lmx-text)" }}>
            Run your league offline?<br />We&apos;ve got you.
          </h1>
          <p className="text-base md:text-lg max-w-xl" style={{ color: "var(--lmx-text-muted)" }}>
            Download our pre-formatted template, track your league in Excel or Google Sheets,
            then upload it for an instant beautified report — standings, pick history, elimination
            timeline and more. No account needed.
          </p>
          <div className="flex gap-4 mt-2">
            <a
              href="#step-1"
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              Get the template
            </a>
            <a
              href="#step-2"
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm border transition-all hover:opacity-80"
              style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text)" }}
            >
              Upload a file
            </a>
          </div>
        </div>
      </section>

      {/* Tool content */}
      <section className="max-w-3xl mx-auto px-4 py-16 flex flex-col gap-8">
        {state.stage === "idle" ? (
          <>
            <div id="step-1">
              <DownloadTemplate />
            </div>
            <div id="step-2">
              <UploadZone
                onResult={(result) => {
                  if (result.ok) {
                    setState({ stage: "report", data: result.data, warnings: result.warnings });
                    // Scroll to report after a short tick
                    setTimeout(() => {
                      document.getElementById("lmx-report")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
              />
            </div>
          </>
        ) : (
          <ReportView
            data={state.data}
            warnings={state.warnings}
            onReset={() => setState({ stage: "idle" })}
          />
        )}
      </section>

      {/* Upsell */}
      {state.stage === "idle" && (
        <section
          className="py-16 px-4 text-center"
          style={{ background: "var(--lmx-surface-mid)" }}
        >
          <p className="text-xs uppercase tracking-widest font-display mb-3" style={{ color: "var(--lmx-green)" }}>
            Ready to go fully automated?
          </p>
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-4" style={{ color: "var(--lmx-text)" }}>
            LMX handles everything for you
          </h2>
          <p className="text-base max-w-xl mx-auto mb-8" style={{ color: "var(--lmx-text-muted)" }}>
            Live fixture sync, automated pick deadlines, instant eliminations, and a league your
            players can join with a single link. No spreadsheets required.
          </p>
          <a
            href="/signup?role=manager"
            className="inline-block px-8 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--lmx-amber)", color: "var(--lmx-surface)" }}
          >
            Create a free league
          </a>
        </section>
      )}

      {/* Footer */}
      <footer
        className="py-6 px-4 border-t text-center print:hidden"
        style={{ borderColor: "var(--lmx-surface-edge)", background: "var(--lmx-surface)" }}
      >
        <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
          <a href="/" className="font-display font-bold hover:opacity-80 transition-opacity" style={{ color: "var(--lmx-green)" }}>
            LMX
          </a>{" "}
          · Your file is processed entirely in your browser and never uploaded to our servers.
        </p>
      </footer>
    </main>
  );
}
