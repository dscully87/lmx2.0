import { createAdminClient } from "@/lib/supabase/admin";

export type ProcessResult = {
  gameweekId: string;
  leaguesProcessed: number;
  picksResolved: number;
  survived: number;
  eliminated: number;
  noPickEliminated: number;
};

export type ProcessError =
  | { type: "not_found" }
  | { type: "wrong_status"; current: string }
  | { type: "already_complete" }
  | { type: "fixtures_incomplete"; unfinished: number }
  | { type: "db_error"; message: string };

type FixtureRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

/**
 * Processes a gameweek: evaluates each player's pick against match results
 * and marks them as survived or eliminated.
 *
 * Rules:
 * - Pick winning team  → survived
 * - Pick drawing team  → eliminated (draw is NOT a win)
 * - Pick losing team   → eliminated
 * - No pick submitted  → eliminated
 *
 * @param gameweekId  UUID of the gameweek to process
 * @param force       If true, process even if some fixtures are not yet finished
 *                    (unresolved fixtures are treated as draws → both teams eliminated)
 */
export async function processGameweek(
  gameweekId: string,
  force = false
): Promise<{ ok: true; result: ProcessResult } | { ok: false; error: ProcessError }> {
  const admin = createAdminClient();

  // ── 1. Fetch gameweek ───────────────────────────────────────────────────────
  const { data: gameweek, error: gwError } = await admin
    .from("gameweeks")
    .select("id, competition_id, status")
    .eq("id", gameweekId)
    .single();

  if (gwError || !gameweek) {
    return { ok: false, error: { type: "not_found" } };
  }

  if (gameweek.status === "complete") {
    return { ok: false, error: { type: "already_complete" } };
  }

  if (!["locked", "processing"].includes(gameweek.status)) {
    return { ok: false, error: { type: "wrong_status", current: gameweek.status } };
  }

  // ── 2. Fetch fixtures for this gameweek ─────────────────────────────────────
  const { data: gwFixtures, error: fixturesError } = await admin
    .from("gameweek_fixtures")
    .select("fixture_id, fixtures(id, home_team_id, away_team_id, home_score, away_score, status)")
    .eq("gameweek_id", gameweekId);

  if (fixturesError || !gwFixtures) {
    return {
      ok: false,
      error: { type: "db_error", message: fixturesError?.message ?? "Failed to fetch fixtures" },
    };
  }

  const fixtures = gwFixtures
    .map((gf) => gf.fixtures as unknown as FixtureRow | null)
    .filter((f): f is FixtureRow => f !== null);

  // ── 3. Guard: all fixtures must be finished unless forced ──────────────────
  const unfinishedCount = fixtures.filter((f) => f.status !== "finished").length;
  if (unfinishedCount > 0 && !force) {
    return { ok: false, error: { type: "fixtures_incomplete", unfinished: unfinishedCount } };
  }

  // ── 4. Build winner map: team_id → true (won) | false (drew/lost/unresolved) ─
  // This is the core rule: ONLY a win survives. Draw = eliminated.
  const teamSurvived = new Map<string, boolean>();

  for (const f of fixtures) {
    if (
      f.status === "finished" &&
      f.home_score !== null &&
      f.away_score !== null
    ) {
      if (f.home_score > f.away_score) {
        teamSurvived.set(f.home_team_id, true);
        teamSurvived.set(f.away_team_id, false);
      } else if (f.away_score > f.home_score) {
        teamSurvived.set(f.home_team_id, false);
        teamSurvived.set(f.away_team_id, true);
      } else {
        // Draw — both teams are eliminated
        teamSurvived.set(f.home_team_id, false);
        teamSurvived.set(f.away_team_id, false);
      }
    } else {
      // Unresolved (forced) — treat as no winner
      teamSurvived.set(f.home_team_id, false);
      teamSurvived.set(f.away_team_id, false);
    }
  }

  // ── 5. Transition to processing ─────────────────────────────────────────────
  if (gameweek.status === "locked") {
    const { error: transitionError } = await admin
      .from("gameweeks")
      .update({ status: "processing" })
      .eq("id", gameweekId);

    if (transitionError) {
      return { ok: false, error: { type: "db_error", message: transitionError.message } };
    }
  }

  // ── 6. Get all leagues for this competition ──────────────────────────────────
  const { data: leagues, error: leaguesError } = await admin
    .from("leagues")
    .select("id")
    .eq("competition_id", gameweek.competition_id);

  if (leaguesError || !leagues) {
    return {
      ok: false,
      error: { type: "db_error", message: leaguesError?.message ?? "Failed to fetch leagues" },
    };
  }

  let totalPicksResolved = 0;
  let totalSurvived = 0;
  let totalEliminated = 0;
  let totalNoPickEliminated = 0;

  // ── 7. Process each league ──────────────────────────────────────────────────
  for (const league of leagues) {
    // Get all non-eliminated active members
    const { data: members } = await admin
      .from("league_memberships")
      .select("id, user_id")
      .eq("league_id", league.id)
      .eq("is_eliminated", false);

    if (!members || members.length === 0) continue;

    // Get all unresolved picks for this gameweek/league
    const { data: picks } = await admin
      .from("picks")
      .select("id, user_id, team_id")
      .eq("league_id", league.id)
      .eq("gameweek_id", gameweekId)
      .in("status", ["pending", "auto"]);

    const pickByUser = new Map((picks ?? []).map((p) => [p.user_id, p]));

    const survivedPickIds: string[] = [];
    const eliminatedPickIds: string[] = [];
    const eliminatedMemberIds: string[] = []; // for memberships with no pick
    const eliminatedUserIds: string[] = []; // for memberships with a losing pick

    for (const member of members) {
      const pick = pickByUser.get(member.user_id);

      if (!pick) {
        // No pick submitted → eliminated
        eliminatedMemberIds.push(member.id);
        totalNoPickEliminated++;
        totalEliminated++;
        continue;
      }

      const survived = teamSurvived.get(pick.team_id) ?? false;
      totalPicksResolved++;

      if (survived) {
        survivedPickIds.push(pick.id);
        totalSurvived++;
      } else {
        eliminatedPickIds.push(pick.id);
        eliminatedUserIds.push(member.user_id);
        totalEliminated++;
      }
    }

    // ── 8. Bulk-update pick statuses ─────────────────────────────────────────
    if (survivedPickIds.length > 0) {
      await admin
        .from("picks")
        .update({ status: "survived" })
        .in("id", survivedPickIds);
    }

    if (eliminatedPickIds.length > 0) {
      await admin
        .from("picks")
        .update({ status: "eliminated" })
        .in("id", eliminatedPickIds);
    }

    // ── 9. Mark eliminated memberships ───────────────────────────────────────
    // Eliminated via losing/drawing pick
    if (eliminatedUserIds.length > 0) {
      await admin
        .from("league_memberships")
        .update({ is_eliminated: true, eliminated_gameweek_id: gameweekId })
        .eq("league_id", league.id)
        .in("user_id", eliminatedUserIds);
    }

    // Eliminated via no-pick
    if (eliminatedMemberIds.length > 0) {
      await admin
        .from("league_memberships")
        .update({ is_eliminated: true, eliminated_gameweek_id: gameweekId })
        .in("id", eliminatedMemberIds);
    }
  }

  // ── 10. Mark gameweek complete ───────────────────────────────────────────────
  const { error: completeError } = await admin
    .from("gameweeks")
    .update({ status: "complete" })
    .eq("id", gameweekId);

  if (completeError) {
    return { ok: false, error: { type: "db_error", message: completeError.message } };
  }

  return {
    ok: true,
    result: {
      gameweekId,
      leaguesProcessed: leagues.length,
      picksResolved: totalPicksResolved,
      survived: totalSurvived,
      eliminated: totalEliminated,
      noPickEliminated: totalNoPickEliminated,
    },
  };
}
