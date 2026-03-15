"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  inviteCode: string;
  leagueSlug: string;
}

export function JoinLeagueButton({ inviteCode, leagueSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      const data = await res.json() as { slug?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to join league.");
        setLoading(false);
        return;
      }

      router.push(`/leagues/${data.slug ?? leagueSlug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
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
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="w-full px-6 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
      >
        {loading ? "Joining…" : "Join League →"}
      </button>
    </div>
  );
}
