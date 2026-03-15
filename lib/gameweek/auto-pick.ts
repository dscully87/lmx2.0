import { createAdminClient } from "@/lib/supabase/admin";

export type AutoPickOutcome = {
  leagueId: string;
  assigned: number;
  skipped: number; // player has used every available team — they'll be eliminated at processing
};

/**
 * Assigns auto-picks for all leagues with auto_pick_enabled = true.
 * Called at cutoff lock time, before the gameweek transitions to locked.
 *
 * Strategy: pick the alphabetically-first team (from the gameweek's fixtures)
 * that the player has not previously used in this league.
 *
 * If a player has used every available team, no pick is assigned and they will
 * be eliminated when the gameweek is processed.
 */
export async function assignAutoPicks(
  gameweekId: string,
  competitionId: string
): Promise<AutoPickOutcome[]> {
  const admin = createAdminClient();

  // ── 1. Get leagues in this competition with auto-pick enabled ───────────────
  const { data: leagues } = await admin
    .from("leagues")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("auto_pick_enabled", true);

  if (!leagues || leagues.length === 0) return [];

  // ── 2. Get teams playing in this gameweek (home + away from all fixtures) ────
  const { data: gwFixtures } = await admin
    .from("gameweek_fixtures")
    .select("fixtures(home_team_id, away_team_id, teams_home:teams!home_team_id(id, name), teams_away:teams!away_team_id(id, name))")
    .eq("gameweek_id", gameweekId);

  type TeamRef = { id: string; name: string };
  type FixtureRef = {
    home_team_id: string;
    away_team_id: string;
    teams_home: TeamRef | null;
    teams_away: TeamRef | null;
  } | null;

  const playingTeams = new Map<string, string>(); // team_id → name
  for (const gf of gwFixtures ?? []) {
    const f = gf.fixtures as unknown as FixtureRef;
    if (!f) continue;
    if (f.teams_home) playingTeams.set(f.teams_home.id, f.teams_home.name);
    if (f.teams_away) playingTeams.set(f.teams_away.id, f.teams_away.name);
  }

  // Sort teams alphabetically for deterministic assignment
  const sortedTeams = Array.from(playingTeams.entries()).sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  if (sortedTeams.length === 0) return [];

  const outcomes: AutoPickOutcome[] = [];

  for (const league of leagues) {
    // ── 3. Get active non-eliminated members who haven't picked yet ────────────
    const { data: members } = await admin
      .from("league_memberships")
      .select("user_id")
      .eq("league_id", league.id)
      .eq("is_eliminated", false);

    if (!members || members.length === 0) {
      outcomes.push({ leagueId: league.id, assigned: 0, skipped: 0 });
      continue;
    }

    // Find members who already have a pick for this gameweek
    const { data: existingPicks } = await admin
      .from("picks")
      .select("user_id")
      .eq("league_id", league.id)
      .eq("gameweek_id", gameweekId);

    const alreadyPicked = new Set((existingPicks ?? []).map((p) => p.user_id));
    const needsPick = members.filter((m) => !alreadyPicked.has(m.user_id));

    if (needsPick.length === 0) {
      outcomes.push({ leagueId: league.id, assigned: 0, skipped: 0 });
      continue;
    }

    // ── 4. Get all teams already used by each player in this league ────────────
    const { data: priorPicks } = await admin
      .from("picks")
      .select("user_id, team_id")
      .eq("league_id", league.id)
      .neq("gameweek_id", gameweekId)
      .in("status", ["survived", "pending", "auto", "eliminated"]);

    const usedByPlayer = new Map<string, Set<string>>();
    for (const pick of priorPicks ?? []) {
      if (!usedByPlayer.has(pick.user_id)) usedByPlayer.set(pick.user_id, new Set());
      usedByPlayer.get(pick.user_id)!.add(pick.team_id);
    }

    let assigned = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const member of needsPick) {
      const used = usedByPlayer.get(member.user_id) ?? new Set<string>();
      const available = sortedTeams.find(([teamId]) => !used.has(teamId));

      if (!available) {
        // Player has used every team — no auto-pick possible, they'll be eliminated
        skipped++;
        continue;
      }

      const [teamId] = available;
      const { error } = await admin.from("picks").insert({
        league_id: league.id,
        gameweek_id: gameweekId,
        user_id: member.user_id,
        team_id: teamId,
        status: "auto",
        is_auto: true,
        submitted_at: now,
        locked_at: now,
      });

      if (!error) assigned++;
    }

    outcomes.push({ leagueId: league.id, assigned, skipped });
  }

  return outcomes;
}
