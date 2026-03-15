export type PlayerRow = {
  playerName: string;
  entryGameweek: number;
  status: "active" | "eliminated";
  eliminatedGameweek: number | null;
  notes: string | null;
};

export type PickRow = {
  playerName: string;
  gameweek: number;
  teamPicked: string;
  result: "W" | "L" | "D" | null;
  pickType: "manual" | "auto" | null;
};

export type LeagueData = {
  leagueName: string | null;
  players: PlayerRow[];
  picks: PickRow[];
};

export type ParseError = {
  fatal: boolean;
  message: string;
};

export type ParseResult =
  | { ok: true; data: LeagueData; warnings: ParseError[] }
  | { ok: false; errors: ParseError[] };
