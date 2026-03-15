import { createAdminClient } from "@/lib/supabase/admin";
import { getFootballAdapter } from "@/lib/football-api";

export type SyncResultsOutcome = {
  gameweekId: string;
  fixturesSynced: number;
  allFinished: boolean;
};

/**
 * Fetches the latest results for a gameweek's fixtures from the football API
 * and upserts them into the fixtures table. Safe to call multiple times.
 */
export async function syncGameweekResults(
  gameweekId: string
): Promise<SyncResultsOutcome> {
  const admin = createAdminClient();
  const adapter = getFootballAdapter();

  // Get all fixtures for this gameweek
  const { data: gwFixtures } = await admin
    .from("gameweek_fixtures")
    .select("fixtures(id, api_id, status)")
    .eq("gameweek_id", gameweekId);

  if (!gwFixtures || gwFixtures.length === 0) {
    return { gameweekId, fixturesSynced: 0, allFinished: true };
  }

  type FixtureRef = { id: string; api_id: string; status: string } | null;
  const allFixtures = gwFixtures
    .map((gf) => gf.fixtures as unknown as FixtureRef)
    .filter((f): f is NonNullable<FixtureRef> => f !== null);

  // Only fetch from the API for fixtures not yet finished
  const unfinished = allFixtures.filter((f) => f.status !== "finished");

  if (unfinished.length === 0) {
    return { gameweekId, fixturesSynced: 0, allFinished: true };
  }

  const apiIds = unfinished.map((f) => f.api_id);
  const results = await adapter.getResults(apiIds);

  let synced = 0;
  for (const result of results) {
    const { error } = await admin
      .from("fixtures")
      .update({
        home_score: result.homeScore,
        away_score: result.awayScore,
        status: "finished",
      })
      .eq("api_id", result.fixtureApiId);

    if (!error) synced++;
  }

  // Re-check how many are still unfinished after the sync
  const { data: refreshed } = await admin
    .from("gameweek_fixtures")
    .select("fixtures(status)")
    .eq("gameweek_id", gameweekId);

  const allFinished = (refreshed ?? []).every(
    (gf) => (gf.fixtures as unknown as { status: string } | null)?.status === "finished"
  );

  return { gameweekId, fixturesSynced: synced, allFinished };
}
