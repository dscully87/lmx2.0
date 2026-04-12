"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        setError(upsertError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--lmx-surface)" }}
    >
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <Link
          href="/"
          className="block text-center font-display font-bold text-3xl mb-2 tracking-tight"
          style={{ color: "var(--lmx-green)" }}
        >
          LMX
        </Link>
        <p
          className="text-center text-sm mb-10"
          style={{ color: "var(--lmx-text-muted)" }}
        >
          What should we call you?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Display name */}
          <div className="glass-card rounded-xl p-6 flex flex-col gap-3">
            <label
              htmlFor="display-name"
              className="text-xs font-display font-medium uppercase tracking-widest"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Your name
            </label>
            <input
              id="display-name"
              type="text"
              required
              autoFocus
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "var(--lmx-surface)",
                border: "1px solid var(--lmx-surface-edge)",
                color: "var(--lmx-text)",
              }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              This is how other players will see you in leagues.
            </p>
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
            disabled={loading || !displayName.trim()}
            className="w-full px-6 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--lmx-green)",
              color: "var(--lmx-surface)",
            }}
          >
            {loading ? "Setting up..." : "Let's go"}
          </button>
        </form>
      </div>
    </main>
  );
}
