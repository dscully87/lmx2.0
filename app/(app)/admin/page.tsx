import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";

async function getCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    competitionsCount,
    teamsCount,
    fixturesCount,
    leaguesCount,
    profilesCount,
  ] = await Promise.all([
    getCount(supabase, "competitions"),
    getCount(supabase, "teams"),
    getCount(supabase, "fixtures"),
    getCount(supabase, "leagues"),
    getCount(supabase, "profiles"),
  ]);

  const stats = [
    { label: "Competitions", value: competitionsCount, href: "/admin/competitions", colour: "var(--lmx-green)" },
    { label: "Teams", value: teamsCount, href: "/admin/teams", colour: "var(--lmx-amber)" },
    { label: "Fixtures", value: fixturesCount, href: "/admin/sync", colour: "#6366F1" },
    { label: "Leagues", value: leaguesCount, href: "/dashboard", colour: "#EC4899" },
    { label: "Users", value: profilesCount, href: "/admin", colour: "var(--lmx-text-muted)" },
  ];

  return (
    <div>
      <PageHeader label="Admin" title="Overview" subtitle="System stats at a glance." />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="glass-card rounded-xl p-5 flex flex-col gap-1 hover:no-underline"
          >
            <span
              className="font-display font-bold text-3xl"
              style={{ color: stat.colour }}
            >
              {stat.value.toLocaleString()}
            </span>
            <span
              className="text-xs font-display uppercase tracking-wider"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              {stat.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { label: "Sync Teams & Fixtures", desc: "Pull data from football-data.org", href: "/admin/sync", colour: "var(--lmx-green)" },
          { label: "Manage Competitions", desc: "Add competitions from API", href: "/admin/competitions", colour: "var(--lmx-amber)" },
          { label: "Create Gameweek", desc: "Set up the next gameweek for a competition", href: "/admin/gameweeks/create", colour: "#6366F1" },
          { label: "View Gameweeks", desc: "See all gameweeks and their status", href: "/admin/gameweeks", colour: "#EC4899" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="glass-card rounded-xl p-5 flex flex-col gap-1 hover:no-underline"
          >
            <span
              className="font-display font-bold text-base"
              style={{ color: item.colour }}
            >
              {item.label} →
            </span>
            <span className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              {item.desc}
            </span>
          </Link>
        ))}
      </div>

      {/* Admin setup instructions */}
      <div
        className="glass-card rounded-xl p-6"
        style={{ border: "1px solid rgba(245,158,11,0.3)" }}
      >
        <p
          className="text-xs uppercase tracking-widest font-display mb-3"
          style={{ color: "var(--lmx-amber)" }}
        >
          Set a user as Admin
        </p>
        <p className="text-sm mb-3" style={{ color: "var(--lmx-text-muted)" }}>
          To promote a user to admin, run this in the{" "}
          <strong style={{ color: "var(--lmx-text)" }}>Supabase SQL Editor</strong>:
        </p>
        <code
          className="block text-sm rounded-lg px-4 py-3"
          style={{
            background: "var(--lmx-surface)",
            border: "1px solid var(--lmx-surface-edge)",
            color: "var(--lmx-green)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {`UPDATE profiles SET role = 'admin' WHERE id = '${user?.id ?? "<user_id>"}';`}
        </code>
        <p className="text-xs mt-2" style={{ color: "var(--lmx-text-muted)" }}>
          Your current user ID is shown above. Sign out and back in after running this query.
        </p>
      </div>
    </div>
  );
}
