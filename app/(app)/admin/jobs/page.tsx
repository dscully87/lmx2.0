import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/app/PageHeader";
import { CronJobCard } from "./CronJobCard";
import type { CronJob } from "./CronJobCard";

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("cron_jobs")
    .select("*")
    .order("name");

  return (
    <div>
      <PageHeader
        label="Admin"
        title="Scheduled Jobs"
      />

      <div
        className="glass-card rounded-xl p-4 mb-6 text-xs"
        style={{ borderLeft: "3px solid var(--lmx-amber)", color: "var(--lmx-text-muted)" }}
      >
        <span className="font-display font-bold uppercase tracking-wider" style={{ color: "var(--lmx-amber)" }}>
          How it works
        </span>
        {" "}— Vercel runs an hourly heartbeat for each job. Enable/disable controls whether
        the job does any work when the heartbeat fires. The interval setting controls
        how much time must pass between automatic runs. Use{" "}
        <span className="font-display font-bold" style={{ color: "var(--lmx-text)" }}>Run Now</span>
        {" "}to trigger a job immediately regardless of schedule.
      </div>

      {(!jobs || jobs.length === 0) ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            No jobs found. Run migration 002_cron_jobs.sql to seed them.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(jobs as CronJob[]).map((job) => (
            <CronJobCard key={job.name} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
