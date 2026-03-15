import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    league_id: string;
    gameweek_id: string;
    team_id: string;
  };

  if (!body.league_id || !body.gameweek_id || !body.team_id) {
    return NextResponse.json(
      { error: "league_id, gameweek_id, and team_id are required" },
      { status: 400 }
    );
  }

  // Verify gameweek is open and cutoff hasn't passed
  const { data: gameweek } = await supabase
    .from("gameweeks")
    .select("status, cutoff_at")
    .eq("id", body.gameweek_id)
    .single();

  if (!gameweek || gameweek.status !== "open") {
    return NextResponse.json({ error: "Gameweek is not open for picks" }, { status: 400 });
  }

  if (new Date(gameweek.cutoff_at) < new Date()) {
    return NextResponse.json({ error: "Pick window has closed (cutoff passed)" }, { status: 400 });
  }

  // Verify user is a member of the league and not eliminated
  const { data: membership } = await supabase
    .from("league_memberships")
    .select("id, is_eliminated")
    .eq("league_id", body.league_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this league" }, { status: 403 });
  }

  if (membership.is_eliminated) {
    return NextResponse.json({ error: "You have been eliminated from this league" }, { status: 403 });
  }

  // Verify team hasn't already been used in a prior gameweek in this league
  const { data: existingPick } = await supabase
    .from("picks")
    .select("id")
    .eq("league_id", body.league_id)
    .eq("user_id", user.id)
    .eq("team_id", body.team_id)
    .neq("gameweek_id", body.gameweek_id)
    .in("status", ["survived", "pending", "auto"])
    .limit(1)
    .single();

  if (existingPick) {
    return NextResponse.json(
      { error: "You have already used this team in a previous gameweek" },
      { status: 400 }
    );
  }

  // Upsert pick
  const { error: upsertError } = await supabase
    .from("picks")
    .upsert(
      {
        league_id: body.league_id,
        gameweek_id: body.gameweek_id,
        user_id: user.id,
        team_id: body.team_id,
        status: "pending",
        is_auto: false,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "league_id,gameweek_id,user_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
