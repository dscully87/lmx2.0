# FPL API — Fixtures Integration Guide

Guide for integrating Fantasy Premier League fixture data into an admin panel.
No API key required. All endpoints are public.

---

## Base URL

```
https://fantasy.premierleague.com/api/
```

No authentication headers needed. Add a `User-Agent` header on server-side requests to avoid blocks:

```
User-Agent: Mozilla/5.0 (compatible; your-app-name)
```

> **Important:** Call this API server-side (Node/Python/etc.), not directly from the browser — the FPL API blocks cross-origin browser requests (CORS). Proxy through your own backend.

---

## Key Endpoints

### 1. Bootstrap Static
```
GET https://fantasy.premierleague.com/api/bootstrap-static/
```

The master data endpoint. Returns everything in one call:
- All 38 gameweeks with status flags (`is_current`, `is_next`, `is_previous`)
- All 20 Premier League teams (IDs, names, codes for badge URLs)
- All players (prices, stats, team assignments)

**Use this to:** get the list of gameweeks to populate a dropdown, detect which GW is current/next, get team names to display alongside fixtures.

---

### 2. Fixtures for a Gameweek
```
GET https://fantasy.premierleague.com/api/fixtures/?event={gameweek_number}
```

**Example — GW13:**
```
GET https://fantasy.premierleague.com/api/fixtures/?event=13
```

Returns an array of fixture objects for that gameweek. See response schema below.

---

### 3. All Fixtures (no filter)
```
GET https://fantasy.premierleague.com/api/fixtures/
```

Returns every fixture for the entire season. Large response — use the `?event=` filter unless you need everything.

---

### 4. Live GW Stats (in-progress or finished GW)
```
GET https://fantasy.premierleague.com/api/event/{gameweek_number}/live/
```

Returns per-player stats for that GW (goals, assists, bonus points, minutes, etc.).
Only useful once the GW has started.

---

## Gameweek Object (from bootstrap-static → events array)

```json
{
  "id": 13,
  "name": "Gameweek 13",
  "deadline_time": "2025-11-22T11:00:00Z",
  "deadline_time_epoch": 1732273200,
  "release_time": null,
  "average_entry_score": 52,
  "finished": true,
  "data_checked": true,
  "highest_scoring_entry": 987654,
  "highest_score": 121,
  "is_previous": false,
  "is_current": false,
  "is_next": false,
  "cup_leagues_created": false,
  "h2h_ko_matches_created": false,
  "transfers_made": 8241093
}
```

| Field | Description |
|-------|-------------|
| `id` | Gameweek number (1–38). Use this as the `event` param in fixture requests |
| `name` | Display name e.g. `"Gameweek 13"` |
| `deadline_time` | ISO 8601 UTC — when transfers lock for this GW |
| `finished` | `true` if all matches in the GW are complete |
| `is_previous` | `true` for the most recently completed GW |
| `is_current` | `true` for the GW currently in progress |
| `is_next` | `true` for the upcoming GW |
| `average_entry_score` | FPL avg points scored this GW (available after GW finishes) |
| `highest_score` | Top score in this GW |
| `transfers_made` | Total transfers made by all managers for this GW |

---

## Fixture Object (from /fixtures/?event=N)

```json
{
  "code": 2444470,
  "event": 13,
  "finished": true,
  "finished_provisional": true,
  "id": 91,
  "kickoff_time": "2025-11-23T14:00:00Z",
  "minutes": 90,
  "provisional_start_time": false,
  "started": true,
  "team_a": 8,
  "team_a_score": 1,
  "team_h": 1,
  "team_h_score": 2,
  "team_h_difficulty": 3,
  "team_a_difficulty": 4,
  "pulse_id": 115753
}
```

| Field | Description |
|-------|-------------|
| `id` | Unique fixture ID |
| `event` | Gameweek number this fixture belongs to |
| `kickoff_time` | ISO 8601 UTC kickoff time. `null` if not yet scheduled |
| `started` | `true` once kickoff has passed |
| `finished` | `true` once the match result is confirmed |
| `finished_provisional` | `true` once result is in but before full data check |
| `team_h` | Home team ID — cross-reference with bootstrap teams array |
| `team_a` | Away team ID |
| `team_h_score` | Home goals. `null` if match not started |
| `team_a_score` | Away goals. `null` if match not started |
| `team_h_difficulty` | FPL difficulty rating for the home team (1–5) |
| `team_a_difficulty` | FPL difficulty rating for the away team (1–5) |
| `minutes` | Minutes played (90 when finished) |

> **Note:** The fixture response only contains team IDs, not names. You must fetch bootstrap-static separately and map `team_h`/`team_a` IDs to team names.

---

## Team Object (from bootstrap-static → teams array)

```json
{
  "code": 3,
  "draw": 0,
  "form": null,
  "id": 1,
  "loss": 0,
  "name": "Arsenal",
  "played": 0,
  "points": 0,
  "position": 0,
  "short_name": "ARS",
  "strength": 4,
  "team_division": null,
  "unavailable": false,
  "win": 0,
  "strength_overall_home": 1270,
  "strength_overall_away": 1300,
  "strength_attack_home": 1300,
  "strength_attack_away": 1320,
  "strength_defence_home": 1240,
  "strength_defence_away": 1260,
  "pulse_id": 1
}
```

| Field | Description |
|-------|-------------|
| `id` | Team ID — matches `team_h` / `team_a` in fixture objects |
| `name` | Full name e.g. `"Arsenal"` |
| `short_name` | 3-letter abbreviation e.g. `"ARS"` |
| `code` | Used to build the badge URL (see below) |

---

## Team Badge URLs

FPL hosts badge images publicly. Use the `code` field from the team object:

```
https://resources.premierleague.com/premierleague/badges/t{code}.png

# Example — Arsenal (code: 3)
https://resources.premierleague.com/premierleague/badges/t3.png

# High-res version (100x100)
https://resources.premierleague.com/premierleague/badges/100/t{code}.png
```

---

## How to Detect Current / Next / Previous Gameweek

```javascript
const bootstrap = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/').then(r => r.json());
const events = bootstrap.events;

const currentGW  = events.find(e => e.is_current);   // GW in progress right now
const nextGW     = events.find(e => e.is_next);       // upcoming GW
const previousGW = events.find(e => e.is_previous);  // most recently completed GW
```

> Between gameweeks, `is_current` will be `null` — handle this case in your UI.

---

## Building the Team Lookup Map

Before displaying fixtures, build a map from the bootstrap data so you can resolve team IDs to names and badges:

```javascript
const bootstrap = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/').then(r => r.json());

const teamMap = {};
bootstrap.teams.forEach(team => {
  teamMap[team.id] = {
    name:      team.name,
    shortName: team.short_name,
    badge:     `https://resources.premierleague.com/premierleague/badges/t${team.code}.png`,
  };
});
```

Then when displaying a fixture:
```javascript
const homeTeam = teamMap[fixture.team_h]; // { name, shortName, badge }
const awayTeam = teamMap[fixture.team_a];
```

---

## Admin Panel Implementation

### Recommended Approach

1. On page load, call `/api/bootstrap-static/` to populate the gameweek dropdown
2. Admin selects a gameweek number from the dropdown (pre-select current/next GW)
3. On click of "Pull FPL Fixtures for Gameweek N", call `/api/fixtures/?event=N`
4. Save the fixtures to your database, mapping team IDs to team names using the bootstrap data

### Node.js / Express Example

```javascript
const axios = require('axios');

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const HEADERS  = { 'User-Agent': 'Mozilla/5.0 (compatible; your-app)' };

// ── Fetch bootstrap data (teams + gameweeks) ──────────────────────────────
async function getFPLBootstrap() {
  const { data } = await axios.get(`${FPL_BASE}/bootstrap-static/`, { headers: HEADERS });
  return data;
}

// ── Build team lookup map ──────────────────────────────────────────────────
function buildTeamMap(bootstrap) {
  const map = {};
  bootstrap.teams.forEach(t => {
    map[t.id] = {
      name:      t.name,
      shortName: t.short_name,
      badge:     `https://resources.premierleague.com/premierleague/badges/t${t.code}.png`,
    };
  });
  return map;
}

// ── Fetch fixtures for a specific gameweek ────────────────────────────────
async function getFixturesForGameweek(gwNumber) {
  const bootstrap = await getFPLBootstrap();
  const teamMap   = buildTeamMap(bootstrap);

  const { data: fixtures } = await axios.get(`${FPL_BASE}/fixtures/`, {
    headers: HEADERS,
    params: { event: gwNumber },
  });

  // Enrich fixtures with team names and badges
  return fixtures.map(f => ({
    fixtureId:     f.id,
    gameweek:      f.event,
    kickoffTime:   f.kickoff_time,
    started:       f.started,
    finished:      f.finished,
    homeTeam:      teamMap[f.team_h],
    awayTeam:      teamMap[f.team_a],
    homeScore:     f.team_h_score,  // null until started
    awayScore:     f.team_a_score,  // null until started
    homeDifficulty: f.team_h_difficulty,
    awayDifficulty: f.team_a_difficulty,
  }));
}

// ── Admin panel route ─────────────────────────────────────────────────────
// GET /admin/fpl/gameweeks  → returns list of GWs for dropdown
app.get('/admin/fpl/gameweeks', async (req, res) => {
  try {
    const bootstrap = await getFPLBootstrap();
    const gameweeks = bootstrap.events.map(e => ({
      id:          e.id,
      name:        e.name,
      deadline:    e.deadline_time,
      finished:    e.finished,
      isCurrent:   e.is_current,
      isNext:      e.is_next,
      isPrevious:  e.is_previous,
    }));
    res.json(gameweeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/fpl/pull-fixtures  → body: { gameweek: 13 }
app.post('/admin/fpl/pull-fixtures', async (req, res) => {
  try {
    const { gameweek } = req.body;
    if (!gameweek || gameweek < 1 || gameweek > 38) {
      return res.status(400).json({ error: 'gameweek must be 1–38' });
    }

    const fixtures = await getFixturesForGameweek(gameweek);

    // TODO: save fixtures to your database here
    // await db.fixtures.upsertMany(fixtures);

    res.json({ success: true, gameweek, count: fixtures.length, fixtures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Admin Panel Frontend (minimal example)

```html
<!-- Gameweek selector -->
<select id="gw-select"></select>
<button onclick="pullFixtures()">Pull FPL Fixtures</button>
<div id="pull-result"></div>

<script>
// Populate dropdown on load
fetch('/admin/fpl/gameweeks')
  .then(r => r.json())
  .then(gameweeks => {
    const sel = document.getElementById('gw-select');
    gameweeks.forEach(gw => {
      const opt = document.createElement('option');
      opt.value = gw.id;
      opt.textContent = `${gw.name}${gw.isCurrent ? ' (current)' : gw.isNext ? ' (next)' : ''}`;
      if (gw.isNext || gw.isCurrent) opt.selected = true;
      sel.appendChild(opt);
    });
  });

async function pullFixtures() {
  const gameweek = parseInt(document.getElementById('gw-select').value);
  const res = await fetch('/admin/fpl/pull-fixtures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameweek }),
  });
  const data = await res.json();
  document.getElementById('pull-result').textContent =
    data.success ? `Pulled ${data.count} fixtures for GW${gameweek}` : `Error: ${data.error}`;
}
</script>
```

---

## Enriched Fixture Shape (what your DB should store)

```json
{
  "fixtureId": 91,
  "gameweek": 13,
  "kickoffTime": "2025-11-23T14:00:00Z",
  "started": true,
  "finished": true,
  "homeTeam": {
    "name": "Arsenal",
    "shortName": "ARS",
    "badge": "https://resources.premierleague.com/premierleague/badges/t3.png"
  },
  "awayTeam": {
    "name": "Chelsea",
    "shortName": "CHE",
    "badge": "https://resources.premierleague.com/premierleague/badges/t8.png"
  },
  "homeScore": 2,
  "awayScore": 1,
  "homeDifficulty": 3,
  "awayDifficulty": 4
}
```

---

## Rate Limits & Caching

- No official rate limit is published, but FPL will throttle aggressive polling
- Bootstrap-static changes infrequently — **cache it for at least 5 minutes** (or longer outside of transfer windows)
- Fixture results update in real-time during a GW — poll `/fixtures/?event=N` every 60–120 seconds if you need live scores
- The `/event/{gw}/live/` endpoint updates roughly every 2 minutes during matches

### Simple in-memory cache (Node.js)

```javascript
let bootstrapCache = null;
let bootstrapCachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getFPLBootstrap() {
  if (bootstrapCache && Date.now() - bootstrapCachedAt < CACHE_TTL) {
    return bootstrapCache;
  }
  const { data } = await axios.get(`${FPL_BASE}/bootstrap-static/`, { headers: HEADERS });
  bootstrapCache = data;
  bootstrapCachedAt = Date.now();
  return data;
}
```

---

## Full URL Reference

| What | URL |
|------|-----|
| All season data (teams, players, GWs) | `https://fantasy.premierleague.com/api/bootstrap-static/` |
| Fixtures for one GW | `https://fantasy.premierleague.com/api/fixtures/?event={gw}` |
| All season fixtures | `https://fantasy.premierleague.com/api/fixtures/` |
| Live GW player stats | `https://fantasy.premierleague.com/api/event/{gw}/live/` |
| Individual player history | `https://fantasy.premierleague.com/api/element-summary/{player_id}/` |
| Classic league standings | `https://fantasy.premierleague.com/api/leagues-classic/{league_id}/standings/` |
| Team badge (standard) | `https://resources.premierleague.com/premierleague/badges/t{team_code}.png` |
| Team badge (100px) | `https://resources.premierleague.com/premierleague/badges/100/t{team_code}.png` |
