import { createAdminClient } from "@/lib/supabase/admin";
import { assignAutoPicks } from "./auto-pick";
import { syncGameweekResults } from "./sync-results";
import { processGameweek } from "./process";

export type JobResult = Record<string, unknown> & { job: string; ranAt: string };

// ── Individual job runners ─────────────────────────────────────────────────────

async function runLockGameweeks(): Promise<JobResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: gameweeks, error } = await admin
    .from("gameweeks")
    .select("id, competition_id")
    .eq("status", "open")
    .lte("cutoff_at", now);

  if (error) throw new Error(error.message);

  const results = [];

  for (const gw of gameweeks ?? []) {
    const autoPickOutcomes = await assignAutoPicks(gw.id, gw.competition_id);

    const { error: lockError } = await admin
      .from("gameweeks")
      .update({ status: "locked" })
      .eq("id", gw.id);

    if (lockError) {
      results.push({ id: gw.id, ok: false, error: lockError.message });
      continue;
    }

    const { data: picks } = await admin
      .from("picks")
      .select("id")
      .eq("gameweek_id", gw.id)
      .in("status", ["pending", "auto"]);

    if (picks && picks.length > 0) {
      const pickIds = picks.map((p) => p.id);
      await admin
        .from("pick_locks")
        .insert(pickIds.map((pick_id) => ({ pick_id, locked_at: now, reason: "cutoff" })));
      await admin.from("picks").update({ locked_at: now }).in("id", pickIds);
    }

    const autoAssigned = autoPickOutcomes.reduce((sum, r) => sum + r.assigned, 0);
    results.push({ id: gw.id, ok: true, picksLocked: picks?.length ?? 0, autoAssigned });
  }

  return {
    job: "lock-gameweeks",
    ranAt: now,
    locked: results.filter((r) => r.ok).length,
    results,
  };
}

async function runSyncResults(): Promise<JobResult> {
  const admin = createAdminClient();

  const { data: gameweeks, error } = await admin
    .from("gameweeks")
    .select("id")
    .in("status", ["locked", "processing"]);

  if (error) throw new Error(error.message);

  const syncResults = await Promise.all(
    (gameweeks ?? []).map((gw) => syncGameweekResults(gw.id))
  );

  return {
    job: "sync-results",
    ranAt: new Date().toISOString(),
    gameweeksChecked: gameweeks?.length ?? 0,
    fixturesSynced: syncResults.reduce((sum, r) => sum + r.fixturesSynced, 0),
    results: syncResults,
  };
}

async function runProcessGameweeks(): Promise<JobResult> {
  const admin = createAdminClient();

  const { data: gameweeks, error } = await admin
    .from("gameweeks")
    .select("id")
    .eq("status", "locked");

  if (error) throw new Error(error.message);

  const outcomes = [];

  for (const gw of gameweeks ?? []) {
    const sync = await syncGameweekResults(gw.id);

    if (!sync.allFinished) {
      outcomes.push({ id: gw.id, status: "waiting", fixturesSynced: sync.fixturesSynced });
      continue;
    }

    const result = await processGameweek(gw.id);
    if (result.ok) {
      outcomes.push({ id: gw.id, status: "processed", ...result.result });
    } else {
      outcomes.push({ id: gw.id, status: "error", error: result.error });
    }
  }

  return {
    job: "process-gameweeks",
    ranAt: new Date().toISOString(),
    processed: outcomes.filter((o) => o.status === "processed").length,
    outcomes,
  };
}

// ── Public dispatcher ──────────────────────────────────────────────────────────

export type CronJobName = "lock-gameweeks" | "sync-results" | "process-gameweeks";

export async function runJob(name: CronJobName): Promise<JobResult> {
  switch (name) {
    case "lock-gameweeks":    return runLockGameweeks();
    case "sync-results":      return runSyncResults();
    case "process-gameweeks": return runProcessGameweeks();
  }
}

// ── DB helpers used by cron routes ────────────────────────────────────────────

export type CronJobConfig = {
  enabled: boolean;
  interval_minutes: number;
  next_run_at: string | null;
};

export async function getCronJobConfig(name: CronJobName): Promise<CronJobConfig | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("cron_jobs")
    .select("enabled, interval_minutes, next_run_at")
    .eq("name", name)
    .single();
  return data;
}

export async function recordCronRun(
  name: CronJobName,
  status: "ok" | "error",
  result: JobResult | { error: string },
  intervalMinutes: number
) {
  const admin = createAdminClient();
  const now = new Date();
  await admin
    .from("cron_jobs")
    .update({
      last_run_at: now.toISOString(),
      last_run_status: status,
      last_run_result: result,
      next_run_at: new Date(now.getTime() + intervalMinutes * 60 * 1000).toISOString(),
    })
    .eq("name", name);
}
