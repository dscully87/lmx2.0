import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFootballAdapter } from "@/lib/football-api";

// Preview — fetch from API but do NOT save
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const api_competition_id = searchParams.get("api_competition_id");
  const season = searchParams.get("season");

  if (!api_competition_id || !season) {
    return NextResponse.json({ error: "api_competition_id and season are required" }, { status: 400 });
  }
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return NextResponse.json({ error: "API_KEY_MISSING" }, { status: 400 });
  }

  try {
    const adapter = getFootballAdapter();
    const fixtures = await adapter.getFixturesByCompetition(api_competition_id, season);
    const sorted = [...fixtures].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
    const from = sorted[0]?.kickoffAt.toISOString() ?? null;
    const to = sorted[sorted.length - 1]?.kickoffAt.toISOString() ?? null;
    // Return first 5 as a sample for preview
    const sample = sorted.slice(0, 5).map((f) => ({
      homeTeam: f.homeTeam.name,
      awayTeam: f.awayTeam.name,
      kickoffAt: f.kickoffAt.toISOString(),
      matchday: f.matchday,
    }));
    return NextResponse.json({ count: fixtures.length, from, to, sample });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json() as {
    competition_id: string;
    api_competition_id: string;
    season: string;
  };

  if (!body.competition_id || !body.api_competition_id || !body.season) {
    return NextResponse.json(
      { error: "competition_id, api_competition_id, and season are required" },
      { status: 400 }
    );
  }

  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY not set" }, { status: 400 });
  }

  try {
    const adapter = getFootballAdapter();
    const fixtures = await adapter.getFixturesByCompetition(body.api_competition_id, body.season);

    const admin = createAdminClient();

    // Fetch all teams for this competition to build api_id -> id map
    const { data: teams } = await admin
      .from("teams")
      .select("id, api_id")
      .eq("competition_id", body.competition_id);

    const teamMap = new Map<string, string>();
    (teams ?? []).forEach((t) => teamMap.set(t.api_id, t.id));

    let count = 0;
    let skipped = 0;

    const rows = [];
    for (const fixture of fixtures) {
      const homeTeamId = teamMap.get(fixture.homeTeam.apiId);
      const awayTeamId = teamMap.get(fixture.awayTeam.apiId);

      if (!homeTeamId || !awayTeamId) {
        skipped++;
        continue;
      }

      rows.push({
        competition_id: body.competition_id,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        api_id: fixture.apiId,
        kickoff_at: fixture.kickoffAt.toISOString(),
        season: fixture.season,
        matchday: fixture.matchday,
        status: fixture.status,
        home_score: fixture.score?.home ?? null,
        away_score: fixture.score?.away ?? null,
        updated_at: new Date().toISOString(),
      });
      count++;
    }

    if (rows.length > 0) {
      const { error } = await admin
        .from("fixtures")
        .upsert(rows, { onConflict: "api_id" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ count, skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
