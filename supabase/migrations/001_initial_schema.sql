-- ============================================================
-- LMX V2 — Initial Schema
-- ============================================================
-- Run against your Supabase project via the SQL editor.
-- All tables have RLS enabled. Policies enforce role-based access.

create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  role          text not null default 'player' check (role in ('player', 'manager', 'admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- COMPETITIONS
-- ============================================================
create table public.competitions (
  id          uuid primary key default gen_random_uuid(),
  api_id      text not null unique,
  name        text not null,
  code        text not null,
  country     text not null,
  emblem_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.competitions enable row level security;

create policy "competitions_select_all" on public.competitions
  for select using (true);

create policy "competitions_admin_write" on public.competitions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  api_id          text not null,
  name            text not null,
  short_name      text not null,
  crest_url       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (competition_id, api_id)
);

alter table public.teams enable row level security;

create policy "teams_select_all" on public.teams
  for select using (true);

create policy "teams_admin_write" on public.teams
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- FIXTURES
-- ============================================================
create table public.fixtures (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  home_team_id    uuid not null references public.teams(id),
  away_team_id    uuid not null references public.teams(id),
  api_id          text not null unique,
  kickoff_at      timestamptz not null,
  season          text not null,
  matchday        integer,
  status          text not null default 'scheduled'
                    check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  home_score      integer,
  away_score      integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index fixtures_competition_season_idx on public.fixtures(competition_id, season);
create index fixtures_kickoff_idx on public.fixtures(kickoff_at);
create index fixtures_status_idx on public.fixtures(status);

alter table public.fixtures enable row level security;

create policy "fixtures_select_all" on public.fixtures
  for select using (true);

create policy "fixtures_admin_write" on public.fixtures
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- GAMEWEEKS
-- ============================================================
create table public.gameweeks (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  name            text not null,
  number          integer not null,
  starts_at       timestamptz not null,
  cutoff_at       timestamptz not null,
  closes_at       timestamptz not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'open', 'locked', 'processing', 'complete')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (competition_id, number)
);

create index gameweeks_competition_status_idx on public.gameweeks(competition_id, status);
create index gameweeks_cutoff_idx on public.gameweeks(cutoff_at);

alter table public.gameweeks enable row level security;

create policy "gameweeks_select_all" on public.gameweeks
  for select using (true);

create policy "gameweeks_manager_write" on public.gameweeks
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin'))
  );

-- ============================================================
-- GAMEWEEK FIXTURES
-- ============================================================
create table public.gameweek_fixtures (
  id          uuid primary key default gen_random_uuid(),
  gameweek_id uuid not null references public.gameweeks(id) on delete cascade,
  fixture_id  uuid not null references public.fixtures(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (gameweek_id, fixture_id)
);

alter table public.gameweek_fixtures enable row level security;

create policy "gw_fixtures_select_all" on public.gameweek_fixtures
  for select using (true);

create policy "gw_fixtures_manager_write" on public.gameweek_fixtures
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin'))
  );

-- ============================================================
-- LEAGUES
-- Note: member-based policies are added AFTER league_memberships is created below.
-- ============================================================
create table public.leagues (
  id                  uuid primary key default gen_random_uuid(),
  competition_id      uuid not null references public.competitions(id),
  name                text not null,
  slug                text not null unique,
  invite_code         text not null unique default upper(substring(gen_random_uuid()::text, 1, 6)),
  is_public           boolean not null default false,
  auto_pick_enabled   boolean not null default false,
  created_by          uuid not null references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index leagues_slug_idx on public.leagues(slug);
create index leagues_invite_code_idx on public.leagues(invite_code);
create index leagues_public_idx on public.leagues(is_public) where is_public = true;

alter table public.leagues enable row level security;

-- Anyone can view public leagues
create policy "leagues_select_public" on public.leagues
  for select using (is_public = true);

-- Managers/admins can create leagues
create policy "leagues_insert_manager" on public.leagues
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin'))
    and auth.uid() = created_by
  );

-- ============================================================
-- LEAGUE MEMBERSHIPS
-- ============================================================
create table public.league_memberships (
  id                        uuid primary key default gen_random_uuid(),
  league_id                 uuid not null references public.leagues(id) on delete cascade,
  user_id                   uuid not null references auth.users(id) on delete cascade,
  role                      text not null default 'player' check (role in ('manager', 'player')),
  is_eliminated             boolean not null default false,
  eliminated_gameweek_id    uuid references public.gameweeks(id),
  joined_at                 timestamptz not null default now(),
  unique (league_id, user_id)
);

create index lm_league_idx on public.league_memberships(league_id);
create index lm_user_idx on public.league_memberships(user_id);

alter table public.league_memberships enable row level security;

-- Members can see who else is in their league
create policy "lm_select_member" on public.league_memberships
  for select using (
    exists (
      select 1 from public.league_memberships lm2
      where lm2.league_id = league_memberships.league_id and lm2.user_id = auth.uid()
    )
  );

-- Users can join a league
create policy "lm_insert_self" on public.league_memberships
  for insert with check (auth.uid() = user_id);

-- League manager or admin can update memberships
create policy "lm_update_manager" on public.league_memberships
  for update using (
    exists (
      select 1 from public.league_memberships mgr
      where mgr.league_id = league_memberships.league_id
        and mgr.user_id = auth.uid()
        and mgr.role = 'manager'
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- LEAGUES — cross-referencing policies (added after league_memberships exists)
-- ============================================================

-- Members can view their own leagues
create policy "leagues_select_member" on public.leagues
  for select using (
    exists (
      select 1 from public.league_memberships
      where league_id = leagues.id and user_id = auth.uid()
    )
  );

-- Only league manager or admin can update
create policy "leagues_update_manager" on public.leagues
  for update using (
    exists (
      select 1 from public.league_memberships
      where league_id = leagues.id and user_id = auth.uid() and role = 'manager'
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- PICKS
-- ============================================================
create table public.picks (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues(id) on delete cascade,
  gameweek_id   uuid not null references public.gameweeks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  team_id       uuid not null references public.teams(id),
  status        text not null default 'pending'
                  check (status in ('pending', 'survived', 'eliminated', 'auto')),
  is_auto       boolean not null default false,
  submitted_at  timestamptz not null default now(),
  locked_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (league_id, gameweek_id, user_id)
);

create index picks_league_gw_idx on public.picks(league_id, gameweek_id);
create index picks_user_league_idx on public.picks(user_id, league_id);

alter table public.picks enable row level security;

create policy "picks_select_member" on public.picks
  for select using (
    exists (
      select 1 from public.league_memberships
      where league_id = picks.league_id and user_id = auth.uid()
    )
  );

create policy "picks_insert_self" on public.picks
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.gameweeks
      where id = gameweek_id and status = 'open'
    )
  );

create policy "picks_update_self" on public.picks
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.gameweeks
      where id = picks.gameweek_id and status = 'open'
    )
  );

-- ============================================================
-- PICK LOCKS
-- ============================================================
create table public.pick_locks (
  id          uuid primary key default gen_random_uuid(),
  pick_id     uuid not null references public.picks(id) on delete cascade,
  locked_at   timestamptz not null default now(),
  reason      text
);

alter table public.pick_locks enable row level security;

create policy "pick_locks_select_member" on public.pick_locks
  for select using (
    exists (
      select 1 from public.picks p
      join public.league_memberships lm on lm.league_id = p.league_id
      where p.id = pick_locks.pick_id and lm.user_id = auth.uid()
    )
  );

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.competitions
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.teams
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.fixtures
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.gameweeks
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.leagues
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.league_memberships
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.picks
  for each row execute procedure public.set_updated_at();
