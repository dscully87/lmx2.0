"use client";

import { useState } from "react";

interface Props {
  slug: string;
  initialName: string;
  initialIsPublic: boolean;
  initialAutoPickEnabled: boolean;
}

export function ManageLeagueForm({
  slug,
  initialName,
  initialIsPublic,
  initialAutoPickEnabled,
}: Props) {
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [autoPickEnabled, setAutoPickEnabled] = useState(initialAutoPickEnabled);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch(`/api/leagues/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_public: isPublic, auto_pick_enabled: autoPickEnabled }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="glass-card rounded-xl p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="manage-name"
          className="text-xs font-display font-medium uppercase tracking-widest"
          style={{ color: "var(--lmx-text-muted)" }}
        >
          League Name
        </label>
        <input
          id="manage-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          style={{
            background: "var(--lmx-surface)",
            border: "1px solid var(--lmx-surface-edge)",
            color: "var(--lmx-text)",
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <div
              className="w-10 h-5 rounded-full transition-colors"
              style={{ background: isPublic ? "var(--lmx-green)" : "var(--lmx-surface-edge)" }}
            />
            <div
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                background: "white",
                transform: isPublic ? "translateX(20px)" : "translateX(0)",
              }}
            />
          </div>
          <span className="text-sm font-display" style={{ color: "var(--lmx-text)" }}>
            Public league
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={autoPickEnabled}
              onChange={(e) => setAutoPickEnabled(e.target.checked)}
            />
            <div
              className="w-10 h-5 rounded-full transition-colors"
              style={{ background: autoPickEnabled ? "var(--lmx-amber)" : "var(--lmx-surface-edge)" }}
            />
            <div
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                background: "white",
                transform: autoPickEnabled ? "translateX(20px)" : "translateX(0)",
              }}
            />
          </div>
          <span className="text-sm font-display" style={{ color: "var(--lmx-text)" }}>
            Auto-pick enabled
          </span>
        </label>
      </div>

      {error && (
        <p
          className="text-sm rounded-lg px-4 py-2.5"
          style={{
            color: "var(--lmx-red)",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="text-sm rounded-lg px-4 py-2.5"
          style={{
            color: "var(--lmx-green)",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-start px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
      >
        {loading ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
