export type FixtureStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type Fixture = {
  apiId: string;
  homeTeam: {
    apiId: string;
    name: string;
    shortName: string;
    crest: string;
  };
  awayTeam: {
    apiId: string;
    name: string;
    shortName: string;
    crest: string;
  };
  kickoffAt: Date;
  competition: {
    apiId: string;
    name: string;
  };
  season: string;
  matchday: number | null;
  status: FixtureStatus;
  score: { home: number | null; away: number | null } | null;
};

export type Competition = {
  apiId: string;
  name: string;
  code: string;
  country: string;
  emblem: string;
};

export type Result = {
  fixtureApiId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string | null; // apiId of winning team, null = draw
  status: "finished";
};
