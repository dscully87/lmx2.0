export type GameweekStatus =
  | "draft"
  | "open"
  | "locked"
  | "processing"
  | "complete";

export type UserRole = "user" | "admin";
export type LeagueMemberRole = "owner" | "member";
export type PickStatus = "pending" | "survived" | "eliminated" | "auto";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type DbCompetition = {
  id: string;
  api_id: string;
  name: string;
  code: string;
  country: string;
  emblem_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  competition_id: string;
  api_id: string;
  name: string;
  short_name: string;
  crest_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbFixture = {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  api_id: string;
  kickoff_at: string;
  season: string;
  matchday: number | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  updated_at: string;
};

export type Gameweek = {
  id: string;
  competition_id: string;
  name: string;
  number: number;
  starts_at: string;
  cutoff_at: string;
  closes_at: string;
  status: GameweekStatus;
  created_at: string;
  updated_at: string;
};

export type League = {
  id: string;
  competition_id: string;
  name: string;
  slug: string;
  invite_code: string;
  is_public: boolean;
  auto_pick_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type LeagueMembership = {
  id: string;
  league_id: string;
  user_id: string;
  role: LeagueMemberRole;
  is_eliminated: boolean;
  eliminated_gameweek_id: string | null;
  joined_at: string;
};

export type Pick = {
  id: string;
  league_id: string;
  gameweek_id: string;
  user_id: string;
  team_id: string;
  status: PickStatus;
  is_auto: boolean;
  submitted_at: string;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};
