import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competition_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!competitionId) {
    return NextResponse.json({ error: "competition_id is required" }, { status: 400 });
  }

  let query = supabase
    .from("fixtures")
    .select(
      `
      id, kickoff_at, status,
      home_team:teams!fixtures_home_team_id_fkey(name, short_name),
      away_team:teams!fixtures_away_team_id_fkey(name, short_name)
    `
    )
    .eq("competition_id", competitionId)
    .eq("status", "scheduled")
    .order("kickoff_at", { ascending: true });

  if (from) query = query.gte("kickoff_at", from);
  if (to) query = query.lte("kickoff_at", to);

  const { data: fixtures, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fixtures: fixtures ?? [] });
}
