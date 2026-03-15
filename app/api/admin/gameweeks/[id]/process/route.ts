import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncGameweekResults } from "@/lib/gameweek/sync-results";
import { processGameweek } from "@/lib/gameweek/process";

/**
 * POST /api/admin/gameweeks/[id]/process
 *
 * Manual trigger for admins and league managers.
 * Syncs the latest fixture results from the football API then processes the gameweek.
 *
 * Query params:
 *   ?force=true  — process even if some fixtures are not yet finished
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameweekId } = await params;
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  // ── Auth: must be admin or a manager of a league in this competition ─────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";

  if (!isAdmin && !isManager) {
    return NextResponse.json({ error: "Admin or manager access required" }, { status: 403 });
  }

  // If manager, verify they manage a league in this gameweek's competition
  if (!isAdmin) {
    const admin = createAdminClient();

    const { data: gameweek } = await admin
      .from("gameweeks")
      .select("competition_id")
      .eq("id", gameweekId)
      .single();

    if (!gameweek) {
      return NextResponse.json({ error: "Gameweek not found" }, { status: 404 });
    }

    const { data: managedLeague } = await supabase
      .from("leagues")
      .select("id")
      .eq("competition_id", gameweek.competition_id)
      .limit(1)
      .single();

    // Check via membership since leagues are manager-created
    const { data: managership } = await supabase
      .from("league_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .eq("league_id", managedLeague?.id ?? "")
      .single();

    if (!managership) {
      return NextResponse.json({ error: "You do not manage a league in this competition" }, { status: 403 });
    }
  }

  // ── Sync latest results from football API ─────────────────────────────────
  const sync = await syncGameweekResults(gameweekId);

  if (!sync.allFinished && !force) {
    return NextResponse.json(
      {
        error: "Not all fixtures have finished. Add ?force=true to process anyway.",
        fixturesSynced: sync.fixturesSynced,
      },
      { status: 409 }
    );
  }

  // ── Process ───────────────────────────────────────────────────────────────
  const result = await processGameweek(gameweekId, force);

  if (!result.ok) {
    const status =
      result.error.type === "not_found"
        ? 404
        : result.error.type === "already_complete"
        ? 409
        : result.error.type === "wrong_status"
        ? 409
        : 500;

    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    fixturesSynced: sync.fixturesSynced,
    ...result.result,
  });
}
