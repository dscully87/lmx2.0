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

  const { count } = await supabase
    .from("gameweeks")
    .select("id", { count: "exact", head: true })
    .eq("competition_id", competitionId);

  return NextResponse.json({ number: (count ?? 0) + 1 });
}
