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
    const teams = await adapter.getTeamsByCompetition(api_competition_id, season);
    return NextResponse.json({ teams });
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
    return NextResponse.json({ error: "competition_id, api_competition_id, and season are required" }, { status: 400 });
  }

  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY not set" },
      { status: 400 }
    );
  }

  try {
    const adapter = getFootballAdapter();
    const teams = await adapter.getTeamsByCompetition(body.api_competition_id, body.season);

    const admin = createAdminClient();

    const rows = teams.map((team) => ({
      competition_id: body.competition_id,
      api_id: team.apiId,
      name: team.name,
      short_name: team.shortName,
      crest_url: team.crest || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin
      .from("teams")
      .upsert(rows, { onConflict: "competition_id,api_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: teams.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
