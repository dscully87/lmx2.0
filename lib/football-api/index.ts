/**
 * Returns the configured football API adapter.
 * Set FOOTBALL_API_PROVIDER env var to switch providers:
 *   "football-data-org" (default) | "api-football"
 */

import type { FootballApiAdapter } from "./adapter";
import { footballDataOrgAdapter } from "./football-data-org";

export function getFootballAdapter(): FootballApiAdapter {
  const provider = process.env.FOOTBALL_API_PROVIDER ?? "football-data-org";

  switch (provider) {
    case "football-data-org":
      return footballDataOrgAdapter;
    default:
      throw new Error(`Unknown FOOTBALL_API_PROVIDER: "${provider}"`);
  }
}

export type { FootballApiAdapter } from "./adapter";
