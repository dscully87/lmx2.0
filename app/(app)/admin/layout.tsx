import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ADMIN_TABS = [
  { label: "Overview", href: "/admin" },
  { label: "Competitions", href: "/admin/competitions" },
  { label: "Teams", href: "/admin/teams" },
  { label: "Sync", href: "/admin/sync" },
  { label: "Gameweeks", href: "/admin/gameweeks" },
  { label: "Jobs", href: "/admin/jobs" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p style={{ color: "var(--lmx-text-muted)" }}>Not authenticated.</p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <h1
          className="font-display font-bold text-2xl mb-3"
          style={{ color: "var(--lmx-text)" }}
        >
          Access Denied
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--lmx-text-muted)" }}>
          You need admin privileges to access this section.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
          style={{
            background: "var(--lmx-surface-mid)",
            color: "var(--lmx-text)",
            border: "1px solid var(--lmx-surface-edge)",
          }}
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Admin sub-nav */}
      <div
        className="flex gap-1 overflow-x-auto mb-8 pb-1"
        style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}
      >
        {ADMIN_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 rounded-t-lg font-display font-medium text-sm whitespace-nowrap transition-colors hover:bg-white/5 flex-shrink-0"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
