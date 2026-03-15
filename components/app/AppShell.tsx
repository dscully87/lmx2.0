"use client";

import { useState } from "react";
import Link from "next/link";

interface AppShellProps {
  profile: { display_name: string; role: string };
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isManagerOrAdmin = profile.role === "manager" || profile.role === "admin";
  const isAdmin = profile.role === "admin";

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    ...(isManagerOrAdmin
      ? [{ label: "Create League", href: "/leagues/create" }]
      : []),
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--lmx-surface)" }}
    >
      {/* Top navigation bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6"
        style={{
          background: "var(--lmx-surface-mid)",
          borderBottom: "1px solid var(--lmx-surface-edge)",
          height: 56,
        }}
      >
        {/* Wordmark */}
        <Link
          href="/dashboard"
          className="font-display font-bold text-xl tracking-tight"
          style={{ color: "var(--lmx-green)" }}
        >
          LMX
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm font-display font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:block text-sm font-display"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            {profile.display_name}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:border-red-400/40 font-display"
              style={{
                borderColor: "var(--lmx-surface-edge)",
                color: "var(--lmx-text-muted)",
              }}
            >
              Sign out
            </button>
          </form>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col gap-1 p-1.5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span
              className="block w-5 h-0.5 transition-all"
              style={{
                background: "var(--lmx-text-muted)",
                transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all"
              style={{
                background: "var(--lmx-text-muted)",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all"
              style={{
                background: "var(--lmx-text-muted)",
                transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-3 flex flex-col gap-1"
          style={{
            background: "var(--lmx-surface-mid)",
            borderBottom: "1px solid var(--lmx-surface-edge)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--lmx-text-muted)" }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
