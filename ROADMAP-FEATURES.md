# LMX Feature Ideas — Planned Engagement Features

Two high-impact engagement features planned for the Power Features phase (Q4 2026).
Both are documented here for design and technical reference.

---

## 1. Live Results Ticker

**Status:** Planned — Q4 2026
**Phase:** Power Features

### What it is

A scrolling horizontal ticker that displays live match scores and LMX elimination
events in real time across the platform during matchdays.

### Why it matters

Right now the site looks and feels like a league management tool. With a live ticker
running during Saturday's 3pm kick-offs, it transforms into something that feels
*alive* — plugged into the actual football, not just a database that updates overnight.

The ticker creates a reason to have the LMX tab open during games, which is exactly
when the emotional stakes of the platform are highest.

### What it shows

- Live scores for fixtures in the active gameweek (e.g. `Arsenal 2–1 Chelsea · 67'`)
- Elimination events as they happen (e.g. `💀 @dave_fc eliminated — Wolves drew 0–0`)
- Survival confirmations (e.g. `✅ @sarah_lms survives on Man City · FT`)
- Countdown to the next deadline if no live games are active

### Placement

- Sticky bar at the top of the dashboard (manager and player views)
- Optional: subtle ticker across the bottom of the landing page during live matchdays
- Hidden outside of matchday windows to avoid feeling stale

### Technical notes

- Requires polling or WebSocket connection to the football data provider (football-data.org)
- Elimination events triggered server-side as results land; push to connected clients via
  Supabase Realtime or a lightweight broadcast channel
- Ticker animation via CSS `marquee`-style scroll (use `animation: scroll` not `<marquee>`)
- Must respect `prefers-reduced-motion` — collapse to static list for accessibility

---

## 2. Death Toll Counter

**Status:** Planned — Q4 2026
**Phase:** Power Features

### What it is

A bold, real-time counter displayed prominently on the landing page showing:

- Total players who have entered LMX leagues (ever or this season)
- Total players eliminated
- Total players still surviving

Example display:

```
2,847 entered   →   2,814 sent packing   →   33 still standing
```

### Why it matters

Last Man Standing is fun because it is unforgiving. The counter makes that
brutality visceral and immediate for anyone visiting the landing page for the
first time. It creates instant FOMO: *2,814 people have already been knocked
out — am I next?*

It also signals legitimacy. Real numbers from real leagues mean real people
play this. An empty platform has no counter.

### Behaviour

- Numbers animate up on page load (count-up animation, ~800ms)
- "Sent packing" counter uses `--lmx-red` colour treatment
- "Still standing" counter uses `--lmx-green-bright` with a subtle text-shadow glow
- All three numbers are live: they update as leagues run and eliminations occur
- Falls back to static placeholder numbers during pre-launch ("example league" label)

### Technical notes

- Aggregate counts stored in a lightweight Supabase view or materialised summary table
- Page fetches the three counts on SSR (or ISR with a 60-second revalidation)
- Count-up animation implemented client-side with `requestAnimationFrame`
- For launch: seed with illustrative example-league numbers and label clearly as such
  until real data accumulates

---

*Both features are tracked on the public roadmap at `/roadmap`.*
