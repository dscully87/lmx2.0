/**
 * Concrete adapter for football-data.org (v4 API)
 * Docs: https://www.football-data.org/documentation/quickstart
 */

import type { Competition, Fixture, Result } from "@/types/football";
import type { FootballApiAdapter } from "./adapter";

const BASE_URL = "https://api.football-data.org/v4";

// Maps football-data.org status strings to our normalised status
const STATUS_MAP: Record<string, Fixture["status"]> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  SUSPENDED: "cancelled",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
  AWARDED: "finished",
};

function getHeaders() {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_KEY is not set");
  }
  return { "X-Auth-Token": token };
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 3600 }, // 1 hour default cache
  });

  if (!res.ok) {
    throw new Error(
      `football-data.org API error: ${res.status} ${res.statusText} for ${path}`
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Raw API response shapes (partial — only what we need)
// ---------------------------------------------------------------------------

type RawTeam = {
  id: number;
  name: string;
  shortName: string;
  crest: string;
};

type RawFixture = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  season: { startDate: string };
  competition: { id: number; name: string };
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  };
};

type RawCompetition = {
  id: number;
  name: string;
  code: string;
  area: { name: string };
  emblem: string;
};

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function normaliseTeam(raw: RawTeam) {
  return {
    apiId: String(raw.id),
    name: raw.name,
    shortName: raw.shortName ?? raw.name,
    crest: raw.crest ?? "",
  };
}

function normaliseFixture(raw: RawFixture): Fixture {
  const season = raw.season?.startDate?.split("-")[0] ?? "unknown";

  return {
    apiId: String(raw.id),
    homeTeam: normaliseTeam(raw.homeTeam),
    awayTeam: normaliseTeam(raw.awayTeam),
    kickoffAt: new Date(raw.utcDate),
    competition: {
      apiId: String(raw.competition.id),
      name: raw.competition.name,
    },
    season,
    matchday: raw.matchday ?? null,
    status: STATUS_MAP[raw.status] ?? "scheduled",
    score:
      raw.score?.fullTime?.home !== undefined
        ? { home: raw.score.fullTime.home, away: raw.score.fullTime.away }
        : null,
  };
}

function normaliseResult(raw: RawFixture): Result {
  const homeScore = raw.score.fullTime.home ?? 0;
  const awayScore = raw.score.fullTime.away ?? 0;

  let winnerId: string | null = null;
  if (raw.score.winner === "HOME_TEAM") {
    winnerId = String(raw.homeTeam.id);
  } else if (raw.score.winner === "AWAY_TEAM") {
    winnerId = String(raw.awayTeam.id);
  }

  return {
    fixtureApiId: String(raw.id),
    homeScore,
    awayScore,
    winnerId,
    status: "finished",
  };
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export const footballDataOrgAdapter: FootballApiAdapter = {
  async getCompetitions(): Promise<Competition[]> {
    const data = await fetchApi<{ competitions: RawCompetition[] }>(
      "/competitions"
    );
    return data.competitions.map((c) => ({
      apiId: String(c.id),
      name: c.name,
      code: c.code,
      country: c.area.name,
      emblem: c.emblem ?? "",
    }));
  },

  async getFixturesByCompetition(
    competitionId: string,
    season: string
  ): Promise<Fixture[]> {
    const data = await fetchApi<{ matches: RawFixture[] }>(
      `/competitions/${competitionId}/matches?season=${season}`
    );
    return data.matches.map(normaliseFixture);
  },

  async getFixtureById(fixtureId: string): Promise<Fixture> {
    const data = await fetchApi<{ match: RawFixture }>(
      `/matches/${fixtureId}`
    );
    return normaliseFixture(data.match);
  },

  async getResults(fixtureIds: string[]): Promise<Result[]> {
    // football-data.org doesn't support bulk lookup by IDs directly —
    // we fetch each individually and filter finished ones.
    const results = await Promise.allSettled(
      fixtureIds.map((id) =>
        fetchApi<{ match: RawFixture }>(`/matches/${id}`)
      )
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<{ match: RawFixture }> =>
          r.status === "fulfilled" && r.value.match.status === "FINISHED"
      )
      .map((r) => normaliseResult(r.value.match));
  },

  async getTeamsByCompetition(
    competitionId: string,
    season: string
  ): Promise<{ apiId: string; name: string; shortName: string; crest: string }[]> {
    const data = await fetchApi<{ teams: RawTeam[] }>(
      `/competitions/${competitionId}/teams?season=${season}`
    );
    return data.teams.map((raw) => ({
      apiId: String(raw.id),
      name: raw.name,
      shortName: raw.shortName ?? raw.name,
      crest: raw.crest ?? "",
    }));
  },
};
