/**
 * Server-side FPL (Fantasy Premier League) API client.
 * No API key required — all endpoints are public.
 * MUST be called server-side only (FPL blocks CORS from browsers).
 */

const FPL_BASE = "https://fantasy.premierleague.com/api";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; lmx-app)" };

// ---------------------------------------------------------------------------
// Raw FPL types
// ---------------------------------------------------------------------------

type RawFPLEvent = {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
  is_previous: boolean;
};

type RawFPLTeam = {
  id: number;
  name: string;
  short_name: string;
  code: number;
};

type RawFPLFixture = {
  id: number;
  event: number;
  kickoff_time: string | null;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
};

type FPLBootstrap = {
  events: RawFPLEvent[];
  teams: RawFPLTeam[];
};

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type FPLGameweek = {
  id: number;
  name: string;
  deadline: string;
  finished: boolean;
  isCurrent: boolean;
  isNext: boolean;
  isPrevious: boolean;
};

export type FPLTeamInfo = {
  id: number;
  name: string;
  shortName: string;
  badge: string;
};

export type FPLEnrichedFixture = {
  fixtureId: number;
  gameweek: number;
  kickoffTime: string | null;
  started: boolean;
  finished: boolean;
  homeTeam: FPLTeamInfo;
  awayTeam: FPLTeamInfo;
  homeScore: number | null;
  awayScore: number | null;
  homeDifficulty: number;
  awayDifficulty: number;
};

// ---------------------------------------------------------------------------
// In-memory bootstrap cache (5 min TTL)
// ---------------------------------------------------------------------------

let bootstrapCache: FPLBootstrap | null = null;
let bootstrapCachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getBootstrap(): Promise<FPLBootstrap> {
  if (bootstrapCache && Date.now() - bootstrapCachedAt < CACHE_TTL) {
    return bootstrapCache;
  }
  const res = await fetch(`${FPL_BASE}/bootstrap-static/`, {
    headers: HEADERS,
    next: { revalidate: 300 }, // Next.js fetch cache: 5 min
  });
  if (!res.ok) {
    throw new Error(`FPL bootstrap fetch failed: ${res.status} ${res.statusText}`);
  }
  bootstrapCache = await res.json();
  bootstrapCachedAt = Date.now();
  return bootstrapCache!;
}

function buildTeamMap(bootstrap: FPLBootstrap): Map<number, FPLTeamInfo> {
  const map = new Map<number, FPLTeamInfo>();
  for (const t of bootstrap.teams) {
    map.set(t.id, {
      id: t.id,
      name: t.name,
      shortName: t.short_name,
      badge: `https://resources.premierleague.com/premierleague/badges/t${t.code}.png`,
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns all 38 gameweeks with status flags. */
export async function getFPLGameweeks(): Promise<FPLGameweek[]> {
  const bootstrap = await getBootstrap();
  return bootstrap.events.map((e) => ({
    id: e.id,
    name: e.name,
    deadline: e.deadline_time,
    finished: e.finished,
    isCurrent: e.is_current,
    isNext: e.is_next,
    isPrevious: e.is_previous,
  }));
}

/** Returns enriched fixtures for a specific gameweek (1–38). */
export async function getFPLFixturesForGameweek(
  gwNumber: number
): Promise<FPLEnrichedFixture[]> {
  if (gwNumber < 1 || gwNumber > 38) {
    throw new Error("Gameweek must be between 1 and 38");
  }

  const [bootstrap, fixturesRes] = await Promise.all([
    getBootstrap(),
    fetch(`${FPL_BASE}/fixtures/?event=${gwNumber}`, {
      headers: HEADERS,
      cache: "no-store", // always fresh for fixture data
    }),
  ]);

  if (!fixturesRes.ok) {
    throw new Error(
      `FPL fixtures fetch failed: ${fixturesRes.status} ${fixturesRes.statusText}`
    );
  }

  const rawFixtures: RawFPLFixture[] = await fixturesRes.json();
  const teamMap = buildTeamMap(bootstrap);

  return rawFixtures.map((f) => {
    const homeTeam = teamMap.get(f.team_h);
    const awayTeam = teamMap.get(f.team_a);

    if (!homeTeam || !awayTeam) {
      throw new Error(
        `Unknown team ID in fixture ${f.id}: home=${f.team_h} away=${f.team_a}`
      );
    }

    return {
      fixtureId: f.id,
      gameweek: f.event,
      kickoffTime: f.kickoff_time,
      started: f.started,
      finished: f.finished,
      homeTeam,
      awayTeam,
      homeScore: f.team_h_score,
      awayScore: f.team_a_score,
      homeDifficulty: f.team_h_difficulty,
      awayDifficulty: f.team_a_difficulty,
    };
  });
}
