-- ============================================================
-- LMX V2 — Cron Job Configuration
-- ============================================================
-- Stores per-job enabled/interval settings and last-run state.
-- Vercel Cron runs an hourly heartbeat; the actual execution
-- frequency is controlled here by admins via the dashboard.

create table public.cron_jobs (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null unique,
  label             text        not null,
  description       text        not null,
  enabled           boolean     not null default true,
  interval_minutes  integer     not null default 60 check (interval_minutes > 0),
  next_run_at       timestamptz,
  last_run_at       timestamptz,
  last_run_status   text        check (last_run_status in ('ok', 'error', 'skipped')),
  last_run_result   jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.cron_jobs enable row level security;

-- Only admins can read or write cron job config
create policy "cron_jobs_admin_all" on public.cron_jobs
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create trigger set_updated_at before update on public.cron_jobs
  for each row execute procedure public.set_updated_at();

-- ── Seed the three jobs ───────────────────────────────────────────────────────
insert into public.cron_jobs (name, label, description, interval_minutes) values
  (
    'lock-gameweeks',
    'Lock Gameweeks',
    'Transitions open gameweeks to locked when their cutoff time passes. Also assigns auto-picks for leagues that have it enabled.',
    60
  ),
  (
    'sync-results',
    'Sync Results',
    'Fetches the latest fixture results from the football API for all locked gameweeks.',
    120
  ),
  (
    'process-gameweeks',
    'Process Gameweeks',
    'Evaluates picks against results and marks players as survived or eliminated once all fixtures in a gameweek are finished.',
    120
  );
