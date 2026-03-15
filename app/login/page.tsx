"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="glass-card rounded-xl p-8">
      <h1
        className="font-display font-bold text-xl mb-1"
        style={{ color: "var(--lmx-text)" }}
      >
        Sign in
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--lmx-text-muted)" }}>
        Enter your credentials to continue.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-xs font-display font-medium uppercase tracking-widest"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--lmx-surface)",
              border: "1px solid var(--lmx-surface-edge)",
              color: "var(--lmx-text)",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-display font-medium uppercase tracking-widest"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--lmx-surface)",
              border: "1px solid var(--lmx-surface-edge)",
              color: "var(--lmx-text)",
            }}
          />
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
          disabled={loading}
          className="mt-2 w-full py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--lmx-green)",
            color: "var(--lmx-surface)",
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--lmx-surface)" }}
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center font-display font-bold text-3xl mb-8 tracking-tight"
          style={{ color: "var(--lmx-green)" }}
        >
          LMX
        </Link>

        <Suspense
          fallback={
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                Loading…
              </p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm mt-6" style={{ color: "var(--lmx-text-muted)" }}>
          No account?{" "}
          <Link href="/signup" className="underline" style={{ color: "var(--lmx-green)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
