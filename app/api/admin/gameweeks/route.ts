import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    name: string;
    number: number;
    starts_at: string;
    cutoff_at: string;
    closes_at: string;
    status: string;
    fixture_ids: string[];
  };

  if (!body.competition_id || !body.name || !body.cutoff_at || !body.closes_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Insert gameweek
  const { data: gameweek, error: gwError } = await admin
    .from("gameweeks")
    .insert({
      competition_id: body.competition_id,
      name: body.name,
      number: body.number,
      starts_at: body.starts_at,
      cutoff_at: body.cutoff_at,
      closes_at: body.closes_at,
      status: body.status ?? "draft",
    })
    .select("id")
    .single();

  if (gwError || !gameweek) {
    return NextResponse.json({ error: gwError?.message ?? "Failed to create gameweek" }, { status: 500 });
  }

  // Insert gameweek_fixtures
  if (body.fixture_ids && body.fixture_ids.length > 0) {
    const gwFixtures = body.fixture_ids.map((fixture_id) => ({
      gameweek_id: gameweek.id,
      fixture_id,
    }));

    const { error: fixturesError } = await admin
      .from("gameweek_fixtures")
      .insert(gwFixtures);

    if (fixturesError) {
      return NextResponse.json({ error: fixturesError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: gameweek.id });
}
