import { NextResponse } from "next/server";
import { getCronJobConfig, recordCronRun, runJob } from "@/lib/gameweek/run-job";

function verifyCronSecret(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getCronJobConfig("sync-results");

  if (!config?.enabled) {
    return NextResponse.json({ skipped: true, reason: "disabled" });
  }

  if (config.next_run_at && new Date(config.next_run_at) > new Date()) {
    return NextResponse.json({ skipped: true, reason: "not_due", next_run_at: config.next_run_at });
  }

  try {
    const result = await runJob("sync-results");
    await recordCronRun("sync-results", "ok", result, config.interval_minutes);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await recordCronRun("sync-results", "error", { error: message }, config.interval_minutes);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
