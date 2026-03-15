import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFootballAdapter } from "@/lib/football-api";

export async function GET() {
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

  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return NextResponse.json(
      {
        error: "API_KEY_MISSING",
        message: "Set FOOTBALL_DATA_API_KEY in .env.local to enable this feature",
      },
      { status: 400 }
    );
  }

  try {
    const adapter = getFootballAdapter();
    const competitions = await adapter.getCompetitions();
    return NextResponse.json({ competitions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch competitions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
