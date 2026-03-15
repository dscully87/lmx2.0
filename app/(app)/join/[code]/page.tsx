import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";
import { JoinLeagueButton } from "./JoinLeagueButton";

interface Params {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: Params) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch league by invite code (case-insensitive)
  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, slug, invite_code, is_public, competition_id, competitions(name)")
    .ilike("invite_code", code.toUpperCase())
    .single();

  if (!league) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <h1
          className="font-display font-bold text-2xl mb-3"
          style={{ color: "var(--lmx-text)" }}
        >
          League Not Found
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--lmx-text-muted)" }}>
          We couldn&apos;t find a league with invite code{" "}
          <span
            className="font-mono font-bold"
            style={{ color: "var(--lmx-amber)", fontFamily: "var(--font-mono)" }}
          >
            {code.toUpperCase()}
          </span>
          . Double-check the code and try again.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--lmx-surface-mid)", color: "var(--lmx-text)", border: "1px solid var(--lmx-surface-edge)" }}
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from("league_memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (existingMembership) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-4xl mb-4">✓</p>
        <h1
          className="font-display font-bold text-2xl mb-3"
          style={{ color: "var(--lmx-green)" }}
        >
          Already a Member
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--lmx-text-muted)" }}>
          You&apos;re already in <strong style={{ color: "var(--lmx-text)" }}>{league.name}</strong>.
        </p>
        <Link
          href={`/leagues/${league.slug}`}
          className="inline-block px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
        >
          Go to League →
        </Link>
      </div>
    );
  }

  // Count members
  const { count: memberCount } = await supabase
    .from("league_memberships")
    .select("id", { count: "exact", head: true })
    .eq("league_id", league.id);

  const comp = league.competitions as unknown as { name: string } | null;

  return (
    <div className="max-w-md mx-auto">
      <PageHeader label="Join League" title="You've been invited!" />

      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2
              className="font-display font-bold text-xl mb-1"
              style={{ color: "var(--lmx-text)" }}
            >
              {league.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              {comp?.name ?? "Competition unknown"}
            </p>
          </div>
          <span
            className="font-mono text-lg font-bold tracking-widest px-3 py-1 rounded-lg"
            style={{
              color: "var(--lmx-green)",
              background: "rgba(16,185,129,0.1)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {league.invite_code}
          </span>
        </div>

        <div
          className="flex gap-4 pt-4"
          style={{ borderTop: "1px solid var(--lmx-surface-edge)" }}
        >
          <div>
            <p className="text-xs uppercase tracking-wider font-display mb-0.5" style={{ color: "var(--lmx-text-muted)" }}>
              Players
            </p>
            <p className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
              {memberCount ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-display mb-0.5" style={{ color: "var(--lmx-text-muted)" }}>
              Visibility
            </p>
            <p className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
              {league.is_public ? "Public" : "Private"}
            </p>
          </div>
        </div>
      </div>

      <JoinLeagueButton inviteCode={league.invite_code} leagueSlug={league.slug} />

      <div className="mt-4 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-display"
          style={{ color: "var(--lmx-text-muted)" }}
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
