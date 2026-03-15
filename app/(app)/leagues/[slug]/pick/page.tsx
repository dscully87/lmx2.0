import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PickScreen } from "@/components/app/PickScreen";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function PickPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch league
  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, slug, competition_id")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  // Check membership
  const { data: membership } = await supabase
    .from("league_memberships")
    .select("id, is_eliminated")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect(`/leagues/${slug}`);
  }

  // Fetch open gameweek
  const { data: gameweek } = await supabase
    .from("gameweeks")
    .select("id, name, number, status, cutoff_at")
    .eq("competition_id", league.competition_id)
    .eq("status", "open")
    .order("number", { ascending: true })
    .limit(1)
    .single();

  if (!gameweek) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-4xl mb-4">⏳</p>
        <h1
          className="font-display font-bold text-2xl mb-3"
          style={{ color: "var(--lmx-text)" }}
        >
          No Active Gameweek
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--lmx-text-muted)" }}>
          There is no open gameweek for this competition right now. Check back soon.
        </p>
        <Link
          href={`/leagues/${slug}`}
          className="inline-block px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--lmx-surface-mid)", color: "var(--lmx-text)", border: "1px solid var(--lmx-surface-edge)" }}
        >
          ← Back to league
        </Link>
      </div>
    );
  }

  const isPastCutoff = new Date(gameweek.cutoff_at) < new Date();

  // Fetch gameweek fixtures with team data
  const { data: gwFixtures } = await supabase
    .from("gameweek_fixtures")
    .select(
      `
      fixture_id,
      fixtures (
        id, kickoff_at, status,
        home_team:teams!fixtures_home_team_id_fkey (id, name, short_name, crest_url),
        away_team:teams!fixtures_away_team_id_fkey (id, name, short_name, crest_url)
      )
    `
    )
    .eq("gameweek_id", gameweek.id);

  // Fetch user's previously used team IDs in this league (survived/pending/auto only, not this GW)
  const { data: priorPicks } = await supabase
    .from("picks")
    .select("team_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .neq("gameweek_id", gameweek.id)
    .in("status", ["survived", "pending", "auto"]);

  const usedTeamIds = (priorPicks ?? []).map((p) => p.team_id);

  // Fetch user's current pick for this gameweek
  const { data: existingPick } = await supabase
    .from("picks")
    .select("team_id")
    .eq("league_id", league.id)
    .eq("gameweek_id", gameweek.id)
    .eq("user_id", user.id)
    .single();

  type FixtureRow = {
    id: string;
    kickoff_at: string;
    status: string;
    home_team: { id: string; name: string; short_name: string; crest_url: string | null };
    away_team: { id: string; name: string; short_name: string; crest_url: string | null };
  };

  const fixtures: FixtureRow[] = (gwFixtures ?? [])
    .map((gf) => gf.fixtures as unknown as FixtureRow)
    .filter(Boolean);

  if (isPastCutoff && !existingPick) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <h1
          className="font-display font-bold text-2xl mb-3"
          style={{ color: "var(--lmx-text)" }}
        >
          Pick Window Closed
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--lmx-text-muted)" }}>
          The cutoff for {gameweek.name} has passed. You did not submit a pick.
        </p>
        <Link
          href={`/leagues/${slug}`}
          className="inline-block px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--lmx-surface-mid)", color: "var(--lmx-text)", border: "1px solid var(--lmx-surface-edge)" }}
        >
          ← Back to league
        </Link>
      </div>
    );
  }

  return (
    <PickScreen
      league={{ id: league.id, slug: league.slug, name: league.name }}
      gameweek={{ id: gameweek.id, name: gameweek.name, cutoff_at: gameweek.cutoff_at }}
      fixtures={fixtures}
      usedTeamIds={usedTeamIds}
      existingPick={existingPick ? { team_id: existingPick.team_id } : null}
      isPastCutoff={isPastCutoff}
    />
  );
}
