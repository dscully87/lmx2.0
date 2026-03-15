"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";

interface Competition {
  id: string;
  name: string;
  code: string;
  country: string;
}

interface Props {
  competitions: Competition[];
}

export function CreateLeagueForm({ competitions }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");
  const [isPublic, setIsPublic] = useState(false);
  const [autoPickEnabled, setAutoPickEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competitionId) {
      setError("Please select a competition.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          competition_id: competitionId,
          is_public: isPublic,
          auto_pick_enabled: autoPickEnabled,
        }),
      });

      const data = await res.json() as { slug?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to create league.");
        setLoading(false);
        return;
      }

      router.push(`/leagues/${data.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        label="Leagues"
        title="Create a League"
        subtitle="Set up your last-man-standing competition."
      />

      {competitions.length === 0 && (
        <div
          className="glass-card rounded-xl p-5 mb-6 flex items-start gap-3"
          style={{
            border: "1px solid rgba(245,158,11,0.4)",
            background: "rgba(245,158,11,0.07)",
          }}
        >
          <span style={{ color: "var(--lmx-amber)", fontSize: 18 }}>⚠</span>
          <p className="text-sm" style={{ color: "var(--lmx-amber)" }}>
            No competitions synced yet. Ask your admin to sync competitions
            from the Admin panel before creating a league.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
          {/* League name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="league-name"
              className="text-xs font-display font-medium uppercase tracking-widest"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              League Name
            </label>
            <input
              id="league-name"
              type="text"
              required
              placeholder="e.g. The Premier Predictor League"
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

          {/* Competition */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="competition"
              className="text-xs font-display font-medium uppercase tracking-widest"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Competition
            </label>
            {competitions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                No competitions available
              </p>
            ) : (
              <select
                id="competition"
                required
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: "var(--lmx-surface)",
                  border: "1px solid var(--lmx-surface-edge)",
                  color: "var(--lmx-text)",
                }}
              >
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Toggles */}
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
                  style={{
                    background: isPublic
                      ? "var(--lmx-green)"
                      : "var(--lmx-surface-edge)",
                  }}
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
              <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                Visible to everyone on the Discover page
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
                  style={{
                    background: autoPickEnabled
                      ? "var(--lmx-amber)"
                      : "var(--lmx-surface-edge)",
                  }}
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
              <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                Randomly pick for players who miss the deadline
              </span>
            </label>
          </div>
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

        <button
          type="submit"
          disabled={loading || competitions.length === 0 || !name.trim()}
          className="px-6 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--lmx-green)",
            color: "var(--lmx-surface)",
          }}
        >
          {loading ? "Creating…" : "Create League →"}
        </button>
      </form>
    </div>
  );
}
