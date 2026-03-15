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

  if (!competitionId) {
    return NextResponse.json({ error: "competition_id is required" }, { status: 400 });
  }

  const { data: teams, count, error } = await supabase
    .from("teams")
    .select("id, name, short_name, crest_url", { count: "exact" })
    .eq("competition_id", competitionId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teams: teams ?? [], count: count ?? 0 });
}
