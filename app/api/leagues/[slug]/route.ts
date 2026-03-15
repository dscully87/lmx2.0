import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get league
  const { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  // Check user is manager of this league or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("league_memberships")
    .select("role")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "manager" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as {
    name?: string;
    is_public?: boolean;
    auto_pick_enabled?: boolean;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.is_public !== undefined) updates.is_public = body.is_public;
  if (body.auto_pick_enabled !== undefined) updates.auto_pick_enabled = body.auto_pick_enabled;

  const { error } = await supabase
    .from("leagues")
    .update(updates)
    .eq("id", league.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
