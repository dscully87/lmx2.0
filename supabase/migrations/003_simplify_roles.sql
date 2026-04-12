-- ============================================================
-- LMX V2 — Simplify Roles
-- ============================================================
-- Removes the player/manager distinction. Only two profile roles
-- remain: 'user' (everyone) and 'admin' (the app owner).
-- League memberships become 'owner' (creator) and 'member'.

BEGIN;

-- ============================================================
-- 1a. PROFILES — simplify role column
-- ============================================================

-- Migrate existing data first
UPDATE public.profiles SET role = 'user' WHERE role IN ('player', 'manager');

-- Drop old constraint, add new one, change default
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- ============================================================
-- 1b. LEAGUE_MEMBERSHIPS — simplify role column
-- ============================================================

-- Migrate existing data
UPDATE public.league_memberships SET role = 'owner' WHERE role = 'manager';
UPDATE public.league_memberships SET role = 'member' WHERE role = 'player';

-- Drop old constraint, add new one, change default
ALTER TABLE public.league_memberships DROP CONSTRAINT IF EXISTS league_memberships_role_check;
ALTER TABLE public.league_memberships
  ADD CONSTRAINT league_memberships_role_check CHECK (role IN ('owner', 'member'));
ALTER TABLE public.league_memberships ALTER COLUMN role SET DEFAULT 'member';

-- ============================================================
-- 1c. UPDATE RLS POLICIES
-- ============================================================

-- ── Gameweeks: admin only (was manager+admin) ────────────────
DROP POLICY IF EXISTS "gameweeks_manager_write" ON public.gameweeks;
CREATE POLICY "gameweeks_admin_write" ON public.gameweeks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Gameweek Fixtures: admin only (was manager+admin) ────────
DROP POLICY IF EXISTS "gw_fixtures_manager_write" ON public.gameweek_fixtures;
CREATE POLICY "gw_fixtures_admin_write" ON public.gameweek_fixtures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Leagues INSERT: any authenticated user (was manager+admin) ──
DROP POLICY IF EXISTS "leagues_insert_manager" ON public.leagues;
CREATE POLICY "leagues_insert_authenticated" ON public.leagues
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

-- ── League Memberships UPDATE: owner or admin (was manager) ──
DROP POLICY IF EXISTS "lm_update_manager" ON public.league_memberships;
CREATE POLICY "lm_update_owner" ON public.league_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.league_memberships mgr
      WHERE mgr.league_id = league_memberships.league_id
        AND mgr.user_id = auth.uid()
        AND mgr.role = 'owner'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Leagues UPDATE: owner or admin (was manager) ─────────────
DROP POLICY IF EXISTS "leagues_update_manager" ON public.leagues;
CREATE POLICY "leagues_update_owner" ON public.leagues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.league_memberships
      WHERE league_id = leagues.id AND user_id = auth.uid() AND role = 'owner'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMIT;
