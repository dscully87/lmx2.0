"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/onboarding";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
  }

  if (success) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p
          className="font-display font-bold text-xl mb-3"
          style={{ color: "var(--lmx-green)" }}
        >
          Check your email
        </p>
        <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
          We&apos;ve sent a confirmation link to <strong>{email}</strong>.
          Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-8">
      <h1
        className="font-display font-bold text-xl mb-1"
        style={{ color: "var(--lmx-text)" }}
      >
        Create your account
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--lmx-text-muted)" }}>
        Join LMX and start playing in seconds.
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg font-display font-medium text-sm transition-all hover:opacity-90 active:scale-95 mb-4"
        style={{
          background: "white",
          color: "#1f2937",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "var(--lmx-surface-edge)" }} />
        <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "var(--lmx-surface-edge)" }} />
      </div>

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
            autoComplete="new-password"
            required
            minLength={6}
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
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}

export default function SignUpPage() {
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
                Loading...
              </p>
            </div>
          }
        >
          <SignUpForm />
        </Suspense>

        <p className="text-center text-sm mt-6" style={{ color: "var(--lmx-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="underline" style={{ color: "var(--lmx-green)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
