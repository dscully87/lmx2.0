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

  const body = await request.json() as { invite_code: string };

  if (!body.invite_code?.trim()) {
    return NextResponse.json({ error: "invite_code is required" }, { status: 400 });
  }

  // Find league by invite code (case-insensitive)
  const { data: league } = await supabase
    .from("leagues")
    .select("id, slug")
    .ilike("invite_code", body.invite_code.trim().toUpperCase())
    .single();

  if (!league) {
    return NextResponse.json({ error: "League not found. Check the invite code." }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("league_memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You are already a member of this league", slug: league.slug }, { status: 409 });
  }

  // Insert membership
  const { error: memberError } = await supabase.from("league_memberships").insert({
    league_id: league.id,
    user_id: user.id,
    role: "player",
    is_eliminated: false,
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ slug: league.slug });
}
