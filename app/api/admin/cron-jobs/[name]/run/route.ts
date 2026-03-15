import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runJob, recordCronRun } from "@/lib/gameweek/run-job";
import type { CronJobName } from "@/lib/gameweek/run-job";

const VALID_JOB_NAMES: CronJobName[] = ["lock-gameweeks", "sync-results", "process-gameweeks"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!VALID_JOB_NAMES.includes(name as CronJobName)) {
    return NextResponse.json({ error: "Unknown job" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  // Get current interval so we can update next_run_at correctly
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("cron_jobs")
    .select("interval_minutes")
    .eq("name", name)
    .single();

  const intervalMinutes = job?.interval_minutes ?? 60;

  try {
    const result = await runJob(name as CronJobName);
    await recordCronRun(name as CronJobName, "ok", result, intervalMinutes);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await recordCronRun(name as CronJobName, "error", { error: message }, intervalMinutes);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
