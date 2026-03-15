import type { Competition, Fixture, Result } from "@/types/football";

export interface FootballApiAdapter {
  getCompetitions(): Promise<Competition[]>;
  getFixturesByCompetition(
    competitionId: string,
    season: string
  ): Promise<Fixture[]>;
  getFixtureById(fixtureId: string): Promise<Fixture>;
  getResults(fixtureIds: string[]): Promise<Result[]>;
  getTeamsByCompetition(
    competitionId: string,
    season: string
  ): Promise<{ apiId: string; name: string; shortName: string; crest: string }[]>;
}
