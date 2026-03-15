# LMX V2 — Product Requirements Document

**Version:** 2.0
**Status:** Draft
**Last Updated:** March 2026

---

## 1. Vision

LMX is a last-man-standing football prediction league — **the cleanest, most addictive way to run a pick-em competition with your mates.**

V2 is a full rebuild on a modern stack. The goal is a product that feels effortless to set up and play, where fixture data flows in automatically, gameweek administration takes minutes not hours, and the experience looks sharp enough that new users trust it immediately.

> "Outwit. Outlast. Outpick."

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Fixture data is **never entered manually** — it is always sourced from a football data API |
| G2 | A league manager can go from sign-up to a live league in under **5 minutes** |
| G3 | Gameweeks are configured as simple **time-boxed windows** with a start, a pick cutoff, and a results close |
| G4 | The product works for **any football competition** the API supports — EPL, League of Ireland, Championship, etc. |
| G5 | The site feels **premium and distinctive** — dark-first, glitched, alive |
| G6 | Zero payment or subscription logic in V2 — the product earns trust first |

## 3. Non-Goals (V2)

- Payment processing or subscriptions
- Native mobile app
- Live score push notifications
- Complex rebuy / buyback flows
- Multi-sport (football only for V2)

---

## 4. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 15 (App Router) + TypeScript | File-based routing, RSC, first-class Vercel support |
| **Styling** | Tailwind CSS v4 | Utility-first; dark-mode native |
| **Animations** | Framer Motion + custom CSS | Glitch FX, page transitions |
| **Database** | Supabase (PostgreSQL) | Managed Postgres, built-in auth, Row Level Security |
| **Auth** | Supabase Auth | Email/password + OAuth (Google), magic links |
| **Realtime** | Supabase Realtime | Live leaderboard updates, pick-lock countdowns |
| **File Storage** | Supabase Storage | League logos, avatars |
| **Backend Logic** | Supabase Edge Functions (Deno) | Fixture sync, pick processing, result webhooks |
| **Cron / Scheduling** | Vercel Cron Jobs | Trigger fixture sync, deadline enforcement, result processing |
| **Football API** | football-data.org (free tier) → api-football.com (paid) | Start free; designed to be API-adapter-agnostic |
| **Hosting** | Vercel | Zero-config deploys, preview URLs, edge network |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking, performance |

### API Adapter Pattern

All football data is consumed through a single internal adapter layer (`/lib/football-api/`). This means swapping from football-data.org to api-football.com or SportMonks requires changing one file, not the whole codebase. The adapter returns a normalised `Fixture` type regardless of source.

---

## 5. Brand & Design System

### 5.1 Identity

The LMX brand evolves from the current clean-but-soft look into something that feels **alive, edgy, and competitive** — like a scoreboard that means business.

- **Name:** LMX (unchanged — Last Man eXperience)
- **Tagline:** Outwit. Outlast. Outpick. (unchanged)
- **Domain:** lmxgame.com (unchanged)

### 5.2 Visual Direction

**Dark-first.** The default experience is a dark interface. Light mode is not a V2 priority.

**Glitch aesthetic.** The landing hero uses CSS/JS glitch effects on the wordmark and key headings — RGB channel splitting, scan lines, brief digital noise on hover/load. Think stadium scoreboard meets terminal. This is restrained to the marketing layer; the app interior is clean.

**Glassmorphism panels.** Cards and panels use `backdrop-blur` with translucent dark backgrounds and a subtle emerald or amber border glow on hover.

**Motion.** Page transitions via Framer Motion. Micro-animations on pick confirmation, elimination events, and countdown timers. Nothing gratuitous.

### 5.3 Colour Palette

Retained from V1 but pushed darker and more electric:

| Token | Hex | Usage |
|-------|-----|-------|
| `--lmx-green` | `#10B981` | Primary action, live state, success |
| `--lmx-green-bright` | `#34D399` | Glitch highlights, hover states |
| `--lmx-amber` | `#F59E0B` | Secondary CTA, warnings, manager role |
| `--lmx-amber-bright` | `#FCD34D` | Pick deadline countdowns |
| `--lmx-surface` | `#0F172A` | Main background (slate-900) |
| `--lmx-surface-mid` | `#1E293B` | Card backgrounds (slate-800) |
| `--lmx-surface-edge` | `#334155` | Borders, dividers (slate-700) |
| `--lmx-text` | `#F1F5F9` | Primary text (slate-100) |
| `--lmx-text-muted` | `#94A3B8` | Secondary text (slate-400) |
| `--lmx-red` | `#EF4444` | Elimination, danger, error |

### 5.4 Typography

| Role | Font | Weight |
|------|------|--------|
| Display / Hero | Space Grotesk | 700 (glitch targets) |
| Body | Inter | 400 / 500 |
| Mono / Stats | JetBrains Mono | 400 |

### 5.5 Glitch FX — Landing Screen Spec

The landing hero wordmark ("LMX") renders with:

1. **CSS `@keyframes` glitch** — rapid X/Y translate + `clip-path` slicing on the `::before` and `::after` pseudo-elements, coloured in offset red and cyan channels
2. **Scan line overlay** — a fixed `repeating-linear-gradient` at 2px intervals, 3% opacity, over the full hero
3. **Noise texture** — SVG `feTurbulence` filter applied to the background, subtle static feel
4. **On-load trigger** — glitch plays on page load for 1.2s then settles; re-triggers on wordmark hover
5. **Respect `prefers-reduced-motion`** — if the user has this set, the wordmark renders static with no animation

---

## 6. Data Architecture

All tables live in Supabase (PostgreSQL). Row Level Security (RLS) is enabled on every table.

### 6.1 Core Tables

```
users                   — Supabase Auth users (extended via profiles)
profiles                — display_name, avatar_url, role (player | manager | admin)
competitions            — e.g. "Premier League 24/25", linked to API competition ID
teams                   — clubs within a competition, synced from API
fixtures                — individual matches, synced from API
gameweeks               — admin-defined windows grouping fixtures
gameweek_fixtures       — join: which fixtures belong to which gameweek
leagues                 — user-created competitions
league_memberships      — who is in which league (role: manager | player)
picks                   — a player's team selection for a gameweek within a league
pick_locks              — audit log of when picks were locked
results                 — fixture outcomes (home_score, away_score, winner_team_id)
```

### 6.2 Key Relationships

```
competition → has many → fixtures
competition → has many → gameweeks
gameweek → has many → gameweek_fixtures → fixtures
league → belongs to → competition
league → has many → league_memberships → profiles
league_membership → has many → picks (one per gameweek)
pick → references → team (the chosen team)
pick → references → gameweek
```

### 6.3 Gameweek Model (Central to V2)

The `gameweeks` table is the operational heart of the product:

```sql
gameweeks (
  id              uuid primary key,
  competition_id  uuid references competitions,
  name            text,              -- "Gameweek 1", "Round 1", custom
  number          integer,           -- ordering
  starts_at       timestamptz,       -- when the GW window opens (first KO)
  cutoff_at       timestamptz,       -- pick deadline — no changes after this
  closes_at       timestamptz,       -- when results are processed
  status          text,              -- draft | open | locked | processing | complete
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
)
```

**Status flow:**
`draft` → `open` (at `starts_at`) → `locked` (at `cutoff_at`) → `processing` (admin triggers) → `complete`

The transition from `open` to `locked` is automated by a Vercel Cron job running every 5 minutes. Any pick submitted after `cutoff_at` is rejected server-side regardless of client state.

---

## 7. Fixture API Integration

### 7.1 Adapter Interface

All football data flows through `/lib/football-api/adapter.ts`:

```typescript
interface FootballApiAdapter {
  getCompetitions(): Promise<Competition[]>
  getFixturesByCompetition(competitionId: string, season: string): Promise<Fixture[]>
  getFixtureById(fixtureId: string): Promise<Fixture>
  getResults(fixtureIds: string[]): Promise<Result[]>
}
```

The concrete implementation (`football-data-org.ts` or `api-football.ts`) is set via an environment variable. Swapping providers is a one-line config change.

### 7.2 Normalised Fixture Type

```typescript
type Fixture = {
  apiId: string           // provider's ID
  homeTeam: { apiId: string; name: string; shortName: string; crest: string }
  awayTeam: { apiId: string; name: string; shortName: string; crest: string }
  kickoffAt: Date
  competition: { apiId: string; name: string }
  season: string
  matchday: number | null
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  score: { home: number | null; away: number | null } | null
}
```

### 7.3 Sync Strategy

| Job | Trigger | Action |
|-----|---------|--------|
| **Full season sync** | Manual (admin) or weekly | Pull all fixtures for configured competitions and upsert into `fixtures` table |
| **Upcoming fixtures refresh** | Vercel Cron — every 6 hours | Re-fetch fixtures within next 14 days; update kickoff times, status |
| **Results sync** | Vercel Cron — every 15 min on match days | Pull results for `locked` gameweeks; update `results` table |
| **Gameweek auto-close** | Vercel Cron — every 5 min | Check `closes_at`; if all fixtures in GW have results, mark GW as `processing` and trigger pick resolution |

All sync jobs are idempotent — re-running them is always safe.

### 7.4 Admin Fixture Browser

Admins/managers see a **Fixture Browser** when creating a gameweek:

- Filter by competition and date range
- Fixtures display team names, crests, and kickoff time (user's local timezone via `Intl.DateTimeFormat`)
- Multi-select fixtures to add to a gameweek
- Gameweek cutoff defaults to **1 hour before the earliest selected fixture's kickoff** but is fully editable

---

## 8. Gameweek Management (Admin UX)

This is the most important workflow to get right. The entire flow must take under 3 minutes.

### 8.1 Create Gameweek Flow

1. **Choose Competition** — dropdown of synced competitions
2. **Name the Gameweek** — auto-fills as "Gameweek N" (editable)
3. **Pick Fixtures** — calendar/list view of available fixtures; click to add/remove
4. **Set Dates** — three datetime pickers:
   - **Opens at** — when players can start submitting picks (defaults to now or 1 week prior)
   - **Cutoff** — pick deadline (defaults to 1hr before earliest fixture; adjustable to minute)
   - **Closes at** — when results will be processed (defaults to 24hrs after latest fixture)
5. **Review & Publish** — summary card; toggle `draft` → `open`

All times are stored as UTC. The UI shows the manager's local timezone with the UTC offset displayed, e.g. `Sat 22 Feb, 14:00 GMT` or `Sat 22 Feb, 15:00 CET`.

### 8.2 Edit / Adjust Gameweek

- Cutoff can be moved **earlier** at any time when GW is `open`
- Cutoff can only be moved **later** if no picks have been submitted yet
- Fixtures can be added/removed while GW is `draft`; locked once `open`
- Postponed fixtures flagged automatically by the sync job — manager is notified and can remove or leave (players who picked that team are auto-resolved as survived for the round)

### 8.3 Gameweek Dashboard (Manager View)

At a glance:

- Status badge + time to cutoff (live countdown)
- Fixture list with scores / live status
- Picks submitted vs. total players
- Players who haven't picked (with optional "nudge" button — sends reminder email)
- One-click "Process Results" once all fixtures complete

---

## 9. Core Features & Screens

### 9.1 Landing Page

**Above the fold:**
- Full-viewport dark hero
- Glitch wordmark ("LMX") per §5.5
- Tagline: "Outwit. Outlast. Outpick."
- Two CTAs: **Get Started** (→ sign up) and **See How It Works** (→ smooth scroll)
- Subtle animated pitch SVG overlay (retained from V1 but inverted/dark)

**Below the fold:**
- "How it works" — 3-step explainer (Pick a team → Survive the gameweek → Last one standing wins)
- "Any league, any competition" — showcase supported competitions with logos
- League creation pitch for managers
- Footer with links

### 9.2 Auth

Supabase Auth handles everything. Flows:

- **Sign up** — email + password; confirm email (magic link)
- **Log in** — email/password or Google OAuth
- **Magic link** — one-click email login for frictionless return
- On first login: role selection screen (Player or Manager) — saves to `profiles.role`

No username system. Users are identified by `display_name` (set on onboarding, editable in profile).

### 9.3 Dashboard

Post-login home. Sections:

1. **My Active Leagues** — card per league with:
   - Current gameweek status
   - Pick status for this GW ("Pick submitted ✓" / "Pick needed — X hrs left" with countdown)
   - Surviving players count vs. started
   - League position

2. **Upcoming Gameweeks** — across all leagues, what's coming up

3. **Public Leagues** — discoverable leagues accepting new players

4. **Create a League** (manager only) — prominent CTA

### 9.4 Pick Screen

The most-used screen in the app. Requirements:

- Shows all fixtures in the current gameweek
- Each fixture displays: home crest, home name, score/time, away name, away crest
- Player selects **one team** — clicking a team card highlights it
- Teams the player has **already picked in this league** are greyed out and unselectable (with tooltip "Already used in GW X")
- Live countdown to cutoff — turns amber at 2 hours, red at 30 minutes
- Confirmation step before submitting ("You're picking [Team]. This cannot be changed after cutoff.")
- If cutoff has passed: screen shows submitted pick (read-only) or "No pick submitted — auto-pick will be assigned"
- Auto-pick rule (if enabled on league): lowest-seeded unused team is assigned at cutoff

### 9.5 League Detail

- Leaderboard: surviving players list, eliminated players greyed out with their round of elimination
- Current gameweek picks table (revealed after cutoff)
- Pick history — full table of every player's picks across all GWs, colour-coded (win/loss/auto)
- League settings (manager only): name, invite code, public/private toggle, auto-pick on/off

### 9.6 Invite & Join

- Every league has a **6-character alphanumeric invite code**
- Share link: `lmxgame.com/join/[code]`
- Joining requires an account — unauthenticated users are taken to sign up, then redirected back

### 9.7 Results Processing

When a manager clicks "Process Results" (or the cron job triggers it):

1. System fetches results for all fixtures in the gameweek
2. For each league in the competition:
   - Check each player's pick against the result
   - Mark players who picked a **losing or drawing team** as eliminated
   - Players who picked the **winning team** survive
   - Players with no pick (and auto-pick disabled) are eliminated
3. Gameweek status → `complete`
4. Players receive an email/in-app notification of their result

### 9.8 Manager Tools

- **Fixture browser** (§7.4)
- **Gameweek creator** (§8.1)
- **Gameweek dashboard** (§8.3)
- **League settings**
- **Player list** with elimination status
- **Nudge unsubmitted pickers** — sends reminder email

---

## 10. Roles & Permissions

| Permission | Player | Manager | Admin |
|-----------|--------|---------|-------|
| Join a league | ✓ | ✓ | ✓ |
| Submit a pick | ✓ | ✓ | ✓ |
| Create a league | — | ✓ | ✓ |
| Create gameweeks | — | ✓ (own leagues) | ✓ |
| Trigger result processing | — | ✓ (own leagues) | ✓ |
| Add competitions | — | — | ✓ |
| Trigger fixture sync | — | — | ✓ |
| Impersonate users | — | — | ✓ |

RLS policies in Supabase enforce this at the database level — not just at the application layer.

---

## 11. Notifications

V2 uses **Supabase Edge Functions** + **Resend** (transactional email) for:

| Trigger | Recipient | Message |
|---------|-----------|---------|
| League joined | Player | Welcome + how to pick |
| Gameweek opens | All league members | Gameweek open, fixtures, cutoff time |
| 2 hours to cutoff | Players who haven't picked | Reminder with pick link |
| Pick submitted | Player | Confirmation |
| Cutoff passed | All players | Picks locked, fixture list |
| Results processed | All players | Survived / eliminated notification |

Email uses a dark-themed HTML template consistent with the app's aesthetic. No third-party marketing platform for V2 — just transactional emails.

---

## 12. URL Structure

```
/                          — Landing
/login                     — Auth
/signup                    — Auth
/dashboard                 — Authenticated home
/leagues/create            — Create league (manager)
/leagues/[slug]            — League detail / leaderboard
/leagues/[slug]/pick       — Pick submission for current GW
/leagues/[slug]/history    — Full pick history
/leagues/[slug]/manage     — Manager tools
/join/[code]               — Public join link
/admin                     — Admin panel (Supabase Studio + custom Next.js admin routes)
/gameweeks/[id]            — Gameweek detail
```

---

## 13. Supabase Edge Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `sync-fixtures` | Cron / HTTP | Pull fixtures from API, upsert to DB |
| `sync-results` | Cron / HTTP | Pull results for locked GWs |
| `lock-gameweek` | Cron (every 5 min) | Transition GW to `locked` at `cutoff_at` |
| `process-gameweek` | HTTP (manager) / Cron | Resolve picks against results, mark eliminations |
| `auto-pick` | Cron | Assign auto-picks at cutoff for leagues with auto-pick enabled |
| `send-notification` | DB webhook | Fire email on relevant DB events |

---

## 14. Performance & Non-Functional Requirements

- **Page load:** Core pages (dashboard, pick screen) < 2s on 4G
- **Pick submission:** < 500ms round trip (optimistic UI update, confirmed server-side)
- **Cutoff enforcement:** Server-side only — client countdown is UX, not security
- **Fixture sync:** Eventual consistency acceptable; data is at most 6 hours stale outside matchdays
- **Uptime:** Vercel + Supabase free/pro tier — target 99.5%

---

## 15. Out of Scope — Planned for V3

| Feature | Notes |
|---------|-------|
| Payments & subscriptions | Stripe integration, per-league entry fees |
| Buyback / rebuy system | Week 1 buyback for eliminated players |
| Mobile app | React Native or PWA |
| Multi-sport | Extend adapter to rugby, GAA etc. |
| Analytics dashboard | Upset rates, elimination waves, pick diversity |
| Public API | Let third parties build on LMX data |
| Live score updates | Supabase Realtime + websocket push to pick screen |

---

## 16. Open Questions

| # | Question | Owner |
|---|----------|-------|
| OQ1 | Which football API to start with — football-data.org (free, limited) or api-football.com (paid, broader)? | Product |
| OQ2 | Does V2 support multiple active competitions simultaneously or one at a time? | Product |
| OQ3 | What is the invite/join flow if the league has already started — can late joiners enter? | Product |
| OQ4 | Is the manager always a player in their own league, or can they be observer-only? | Product |
| OQ5 | How is a league "won"? Last survivor, or if everyone is eliminated the last gameweek's survivors share? | Product |

---

*Built with Next.js + Supabase + Vercel. Designed to scale from a WhatsApp group to thousands.*
