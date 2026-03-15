"use client";

import { useState } from "react";

export type CronJob = {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
  interval_minutes: number;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: "ok" | "error" | "skipped" | null;
  last_run_result: Record<string, unknown> | null;
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export function CronJobCard({ job: initial }: { job: CronJob }) {
  const [job, setJob] = useState(initial);
  const [intervalHours, setIntervalHours] = useState(
    Math.max(1, Math.round(initial.interval_minutes / 60))
  );
  const [savingInterval, setSavingInterval] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);

  const intervalDirty = intervalHours * 60 !== job.interval_minutes;

  async function toggleEnabled() {
    setTogglingEnabled(true);
    const next = !job.enabled;
    const res = await fetch(`/api/admin/cron-jobs/${job.name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    if (res.ok) setJob((j) => ({ ...j, enabled: next }));
    setTogglingEnabled(false);
  }

  async function saveInterval() {
    setSavingInterval(true);
    const minutes = intervalHours * 60;
    const res = await fetch(`/api/admin/cron-jobs/${job.name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval_minutes: minutes }),
    });
    if (res.ok) setJob((j) => ({ ...j, interval_minutes: minutes }));
    setSavingInterval(false);
  }

  async function runNow() {
    setRunning(true);
    setRunOutput(null);
    const res = await fetch(`/api/admin/cron-jobs/${job.name}/run`, { method: "POST" });
    const data = await res.json();
    setJob((j) => ({
      ...j,
      last_run_at: new Date().toISOString(),
      last_run_status: res.ok ? "ok" : "error",
      last_run_result: data,
    }));
    setRunOutput(JSON.stringify(data, null, 2));
    setRunning(false);
  }

  return (
    <div
      className="glass-card rounded-xl p-6 flex flex-col gap-5"
      style={{
        borderLeft: `3px solid ${
          job.enabled ? "var(--lmx-green)" : "var(--lmx-surface-edge)"
        }`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className="font-display font-bold text-base"
            style={{ color: "var(--lmx-text)" }}
          >
            {job.label}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--lmx-text-muted)" }}>
            {job.description}
          </p>
        </div>

        {/* Enable / disable toggle */}
        <button
          onClick={toggleEnabled}
          disabled={togglingEnabled}
          aria-label={job.enabled ? "Disable job" : "Enable job"}
          className="flex-shrink-0 w-11 h-6 rounded-full relative transition-opacity disabled:opacity-50"
          style={{
            background: job.enabled ? "var(--lmx-green)" : "var(--lmx-surface-edge)",
          }}
        >
          <span
            className="absolute top-0.5 bottom-0.5 aspect-square rounded-full bg-white transition-transform"
            style={{
              transform: job.enabled ? "translateX(calc(100% + 2px))" : "translateX(2px)",
            }}
          />
        </button>
      </div>

      {/* Run stats */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div>
          <p style={{ color: "var(--lmx-text-muted)" }}>Last run</p>
          <p style={{ color: "var(--lmx-text)" }}>
            {fmt(job.last_run_at) ?? "Never"}
            {job.last_run_status && (
              <span
                className="ml-2 font-display font-bold uppercase text-[10px]"
                style={{
                  color:
                    job.last_run_status === "ok"
                      ? "var(--lmx-green)"
                      : "var(--lmx-red)",
                }}
              >
                {job.last_run_status}
              </span>
            )}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--lmx-text-muted)" }}>Next scheduled</p>
          <p style={{ color: "var(--lmx-text)" }}>
            {job.next_run_at
              ? fmt(job.next_run_at)
              : job.enabled
              ? "On next heartbeat"
              : "—"}
          </p>
        </div>
      </div>

      {/* Interval + Run Now */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs whitespace-nowrap" style={{ color: "var(--lmx-text-muted)" }}>
            Run every
          </span>
          <input
            type="number"
            min={1}
            max={168}
            value={intervalHours}
            onChange={(e) => setIntervalHours(Math.max(1, Number(e.target.value)))}
            className="w-14 px-2 py-1 rounded text-xs text-center"
            style={{
              background: "var(--lmx-surface)",
              border: "1px solid var(--lmx-surface-edge)",
              color: "var(--lmx-text)",
              fontFamily: "var(--font-mono)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
            hr{intervalHours !== 1 ? "s" : ""}
          </span>
          <button
            onClick={saveInterval}
            disabled={!intervalDirty || savingInterval}
            className="px-3 py-1 rounded text-xs font-display font-bold transition-opacity disabled:opacity-30"
            style={{
              background: "var(--lmx-surface-mid)",
              border: "1px solid var(--lmx-surface-edge)",
              color: "var(--lmx-text)",
            }}
          >
            {savingInterval ? "Saving…" : "Save"}
          </button>
        </div>

        <button
          onClick={runNow}
          disabled={running}
          className="px-5 py-2 rounded-lg text-xs font-display font-bold transition-opacity disabled:opacity-50 flex-shrink-0"
          style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
        >
          {running ? "Running…" : "Run Now"}
        </button>
      </div>

      {/* Last run output */}
      {runOutput && (
        <pre
          className="rounded-lg p-3 text-[11px] overflow-x-auto leading-relaxed"
          style={{
            background: "var(--lmx-surface)",
            border: "1px solid var(--lmx-surface-edge)",
            color: "var(--lmx-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {runOutput}
        </pre>
      )}
    </div>
  );
}
