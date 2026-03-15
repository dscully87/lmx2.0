"use client";

import { useRef, useState } from "react";
import { parseSpreadsheet, parseCsvFiles } from "@/lib/spreadsheet/parser";
import type { ParseResult } from "@/lib/spreadsheet/types";

type Props = {
  onResult: (result: ParseResult) => void;
};

type UploadState =
  | { stage: "idle" }
  | { stage: "file-selected"; file: File; type: "xlsx" }
  | { stage: "csv-pair"; players: File | null; picks: File | null }
  | { stage: "parsing" }
  | { stage: "error"; messages: string[] };

export default function UploadZone({ onResult }: Props) {
  const [state, setState] = useState<UploadState>({ stage: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx") {
      setState({ stage: "file-selected", file, type: "xlsx" });
    } else if (ext === "csv") {
      setState({ stage: "csv-pair", players: null, picks: null });
    } else {
      setState({ stage: "error", messages: ["Please upload an .xlsx or .csv file."] });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCsvFile = (sheet: "players" | "picks", file: File) => {
    setState((prev) => {
      if (prev.stage !== "csv-pair") return prev;
      return { ...prev, [sheet]: file };
    });
  };

  const handleGenerate = async () => {
    setState({ stage: "parsing" });
    let result: ParseResult;

    if (state.stage === "file-selected") {
      result = await parseSpreadsheet(state.file);
    } else if (state.stage === "csv-pair" && state.players && state.picks) {
      result = await parseCsvFiles(state.players, state.picks);
    } else {
      setState({ stage: "error", messages: ["Please provide both player and pick CSV files."] });
      return;
    }

    if (!result.ok) {
      setState({ stage: "error", messages: result.errors.map((e) => e.message) });
      return;
    }

    onResult(result);
  };

  const reset = () => {
    setState({ stage: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const canGenerate =
    state.stage === "file-selected" ||
    (state.stage === "csv-pair" && state.players !== null && state.picks !== null);

  return (
    <div className="glass-card p-8 flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(245,158,11,0.12)" }}
        >
          2
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-display font-bold text-xl" style={{ color: "var(--lmx-text)" }}>
            Upload & generate your report
          </h2>
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            Upload your filled-in XLSX (or both CSVs) and get an instant beautified report.
            Your file never leaves your browser.
          </p>
        </div>
      </div>

      {/* Error state */}
      {state.stage === "error" && (
        <div
          className="rounded-lg p-4 border"
          style={{ borderColor: "var(--lmx-red)", background: "rgba(239,68,68,0.06)" }}
        >
          <p
            className="font-display font-bold text-sm uppercase tracking-widest mb-2"
            style={{ color: "var(--lmx-red)" }}
          >
            Could not read file
          </p>
          <ul className="flex flex-col gap-1">
            {state.messages.map((m, i) => (
              <li key={i} className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                · {m}
              </li>
            ))}
          </ul>
          <button
            onClick={reset}
            className="mt-3 text-sm underline hover:opacity-80 transition-opacity"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            Try a different file
          </button>
        </div>
      )}

      {/* Drop zone (idle or error) */}
      {(state.stage === "idle" || state.stage === "error") && (
        <div
          className="rounded-lg border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors"
          style={{
            borderColor: dragging ? "var(--lmx-green)" : "var(--lmx-surface-edge)",
            background: dragging ? "rgba(16,185,129,0.04)" : "transparent",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: "var(--lmx-text-muted)" }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-display font-bold text-sm" style={{ color: "var(--lmx-text)" }}>
            Drag & drop your file here
          </p>
          <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
            .xlsx (recommended) or .csv — max 5MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* XLSX selected */}
      {state.stage === "file-selected" && (
        <div
          className="rounded-lg p-4 flex items-center justify-between gap-4"
          style={{ background: "var(--lmx-surface)", border: "1px solid var(--lmx-surface-edge)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.12)", color: "var(--lmx-green)" }}
            >
              XL
            </div>
            <div>
              <p className="font-display font-bold text-sm" style={{ color: "var(--lmx-text)" }}>
                {state.file.name}
              </p>
              <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                {(state.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <button onClick={reset} className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--lmx-text-muted)" }}>
            Remove
          </button>
        </div>
      )}

      {/* CSV pair upload */}
      {state.stage === "csv-pair" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            CSV mode requires two files — one for players, one for picks.
          </p>
          {(["players", "picks"] as const).map((sheet) => {
            const file = state[sheet];
            return (
              <label
                key={sheet}
                className="flex items-center justify-between gap-4 rounded-lg p-3 cursor-pointer border transition-colors"
                style={{
                  borderColor: file ? "var(--lmx-green)" : "var(--lmx-surface-edge)",
                  background: "var(--lmx-surface)",
                }}
              >
                <span className="font-display text-sm capitalize" style={{ color: "var(--lmx-text)" }}>
                  {sheet}.csv
                </span>
                {file ? (
                  <span className="text-xs" style={{ color: "var(--lmx-green)" }}>{file.name} ✓</span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>Choose file…</span>
                )}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvFile(sheet, f);
                  }}
                />
              </label>
            );
          })}
          <button onClick={reset} className="text-xs text-left hover:opacity-80 transition-opacity" style={{ color: "var(--lmx-text-muted)" }}>
            ← Switch to XLSX upload
          </button>
        </div>
      )}

      {/* Parsing state */}
      {state.stage === "parsing" && (
        <div className="flex items-center gap-3 py-4">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--lmx-green)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            Parsing your file…
          </p>
        </div>
      )}

      {/* Generate button */}
      {state.stage !== "parsing" && (
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="self-start px-6 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canGenerate ? "var(--lmx-amber)" : "var(--lmx-surface-edge)",
            color: canGenerate ? "var(--lmx-surface)" : "var(--lmx-text-muted)",
          }}
        >
          Generate Report
        </button>
      )}
    </div>
  );
}
