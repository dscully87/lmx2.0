"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";

interface DbCompetition {
  id: string;
  api_id: string;
  name: string;
  code: string;
  emblem_url: string | null;
}

interface TeamPreview {
  apiId: string;
  name: string;
  shortName: string;
  crest: string;
}

interface FixturePreviewSample {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  matchday: number | null;
}

interface FixturePreview {
  count: number;
  from: string | null;
  to: string | null;
  sample: FixturePreviewSample[];
}

type TeamSyncStage = "idle" | "fetching" | "preview" | "saving" | "saved";
type FixtureSyncStage = "idle" | "fetching" | "preview" | "saving" | "saved";

interface CompSync {
  season: string;
  teamStage: TeamSyncStage;
  teamPreview: TeamPreview[] | null;
  teamError: string | null;
  teamSavedCount: number | null;
  fixtureStage: FixtureSyncStage;
  fixturePreview: FixturePreview | null;
  fixtureError: string | null;
  fixtureSavedCount: number | null;
  fixtureSavedSkipped: number | null;
}

export default function AdminSyncPage() {
  const [competitions, setCompetitions] = useState<DbCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<Record<string, CompSync>>({});

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/competitions");
      const data = await res.json() as { competitions?: DbCompetition[] };
      const comps = data.competitions ?? [];
      setCompetitions(comps);
      const initial: Record<string, CompSync> = {};
      comps.forEach((c) => {
        initial[c.id] = {
          season: new Date().getFullYear().toString(),
          teamStage: "idle",
          teamPreview: null,
          teamError: null,
          teamSavedCount: null,
          fixtureStage: "idle",
          fixturePreview: null,
          fixtureError: null,
          fixtureSavedCount: null,
          fixtureSavedSkipped: null,
        };
      });
      setSyncState(initial);
    } finally {
      setLoading(false);
    }
  }

  function update(id: string, updates: Partial<CompSync>) {
    setSyncState((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  }

  async function previewTeams(comp: DbCompetition) {
    const state = syncState[comp.id];
    update(comp.id, { teamStage: "fetching", teamError: null, teamPreview: null });
    try {
      const res = await fetch(
        `/api/admin/sync/teams?api_competition_id=${comp.api_id}&season=${state.season}`
      );
      const data = await res.json() as { teams?: TeamPreview[]; error?: string };
      if (!res.ok) {
        update(comp.id, { teamStage: "idle", teamError: data.error ?? "Fetch failed." });
        return;
      }
      update(comp.id, { teamStage: "preview", teamPreview: data.teams ?? [] });
    } catch {
      update(comp.id, { teamStage: "idle", teamError: "Network error." });
    }
  }

  async function saveTeams(comp: DbCompetition) {
    const state = syncState[comp.id];
    update(comp.id, { teamStage: "saving" });
    try {
      const res = await fetch("/api/admin/sync/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition_id: comp.id,
          api_competition_id: comp.api_id,
          season: state.season,
        }),
      });
      const data = await res.json() as { count?: number; error?: string };
      if (!res.ok) {
        update(comp.id, { teamStage: "preview", teamError: data.error ?? "Save failed." });
        return;
      }
      update(comp.id, { teamStage: "saved", teamSavedCount: data.count ?? 0 });
    } catch {
      update(comp.id, { teamStage: "preview", teamError: "Network error." });
    }
  }

  async function previewFixtures(comp: DbCompetition) {
    const state = syncState[comp.id];
    update(comp.id, { fixtureStage: "fetching", fixtureError: null, fixturePreview: null });
    try {
      const res = await fetch(
        `/api/admin/sync/fixtures?api_competition_id=${comp.api_id}&season=${state.season}`
      );
      const data = await res.json() as { count?: number; from?: string; to?: string; sample?: FixturePreviewSample[]; error?: string };
      if (!res.ok) {
        update(comp.id, { fixtureStage: "idle", fixtureError: data.error ?? "Fetch failed." });
        return;
      }
      update(comp.id, {
        fixtureStage: "preview",
        fixturePreview: {
          count: data.count ?? 0,
          from: data.from ?? null,
          to: data.to ?? null,
          sample: data.sample ?? [],
        },
      });
    } catch {
      update(comp.id, { fixtureStage: "idle", fixtureError: "Network error." });
    }
  }

  async function saveFixtures(comp: DbCompetition) {
    const state = syncState[comp.id];
    update(comp.id, { fixtureStage: "saving" });
    try {
      const res = await fetch("/api/admin/sync/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition_id: comp.id,
          api_competition_id: comp.api_id,
          season: state.season,
        }),
      });
      const data = await res.json() as { count?: number; skipped?: number; error?: string };
      if (!res.ok) {
        update(comp.id, { fixtureStage: "preview", fixtureError: data.error ?? "Save failed." });
        return;
      }
      update(comp.id, {
        fixtureStage: "saved",
        fixtureSavedCount: data.count ?? 0,
        fixtureSavedSkipped: data.skipped ?? 0,
      });
    } catch {
      update(comp.id, { fixtureStage: "preview", fixtureError: "Network error." });
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader label="Admin" title="Sync" />
        <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div>
        <PageHeader label="Admin" title="Sync" />
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-sm mb-2" style={{ color: "var(--lmx-text-muted)" }}>
            No competitions to sync. Add competitions first.
          </p>
          <a href="/admin/competitions" className="text-sm font-display" style={{ color: "var(--lmx-green)" }}>
            Add competitions →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        label="Admin"
        title="Sync"
        subtitle="Preview data from the API before saving anything to the database."
      />

      <div className="flex flex-col gap-8">
        {competitions.map((comp) => {
          const state = syncState[comp.id] ?? {
            season: new Date().getFullYear().toString(),
            teamStage: "idle" as TeamSyncStage,
            teamPreview: null, teamError: null, teamSavedCount: null,
            fixtureStage: "idle" as FixtureSyncStage,
            fixturePreview: null, fixtureError: null,
            fixtureSavedCount: null, fixtureSavedSkipped: null,
          };

          return (
            <div key={comp.id} className="glass-card rounded-xl p-6">
              {/* Competition header */}
              <div className="flex items-center gap-3 mb-5">
                {comp.emblem_url && (
                  <img
                    src={comp.emblem_url}
                    alt={comp.name}
                    width={36}
                    height={36}
                    crossOrigin="anonymous"
                    style={{ width: 36, height: 36, objectFit: "contain" }}
                  />
                )}
                <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
                  {comp.name}
                </h2>
              </div>

              {/* Season */}
              <div className="flex items-center gap-3 mb-6">
                <label className="text-xs font-display uppercase tracking-wider" style={{ color: "var(--lmx-text-muted)" }}>
                  Season
                </label>
                <input
                  type="number"
                  value={state.season}
                  onChange={(e) => update(comp.id, { season: e.target.value })}
                  className="w-24 rounded-lg px-3 py-1.5 text-sm outline-none"
                  style={{
                    background: "var(--lmx-surface)",
                    border: "1px solid var(--lmx-surface-edge)",
                    color: "var(--lmx-text)",
                  }}
                />
              </div>

              <div className="flex flex-col gap-6">
                {/* ── TEAMS ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-bold text-sm" style={{ color: "var(--lmx-text)" }}>Teams</p>
                      <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>Pull team names and badges from the API</p>
                    </div>

                    {state.teamStage === "idle" && (
                      <button
                        type="button"
                        onClick={() => previewTeams(comp)}
                        className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                        style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
                      >
                        Preview Teams
                      </button>
                    )}
                    {state.teamStage === "fetching" && (
                      <span className="text-xs font-display" style={{ color: "var(--lmx-text-muted)" }}>Fetching…</span>
                    )}
                    {state.teamStage === "preview" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => update(comp.id, { teamStage: "idle", teamPreview: null })}
                          className="px-3 py-1.5 rounded-lg font-display font-bold text-xs border"
                          style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveTeams(comp)}
                          className="px-4 py-1.5 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                          style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
                        >
                          Save {state.teamPreview?.length ?? 0} teams →
                        </button>
                      </div>
                    )}
                    {state.teamStage === "saving" && (
                      <span className="text-xs font-display" style={{ color: "var(--lmx-amber)" }}>Saving…</span>
                    )}
                    {state.teamStage === "saved" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-display" style={{ color: "var(--lmx-green)" }}>
                          ✓ {state.teamSavedCount} teams saved
                        </span>
                        <button
                          type="button"
                          onClick={() => update(comp.id, { teamStage: "idle", teamPreview: null, teamSavedCount: null })}
                          className="text-xs underline"
                          style={{ color: "var(--lmx-text-muted)" }}
                        >
                          Re-sync
                        </button>
                      </div>
                    )}
                  </div>

                  {state.teamError && (
                    <p className="text-xs mb-3 px-3 py-2 rounded-lg"
                      style={{ color: "var(--lmx-red)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {state.teamError}
                    </p>
                  )}

                  {/* Team preview grid with logos */}
                  {(state.teamStage === "preview" || state.teamStage === "saving") && state.teamPreview && state.teamPreview.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-3">
                      {state.teamPreview.map((team) => (
                        <div
                          key={team.apiId}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-center"
                          style={{ background: "var(--lmx-surface)", border: "1px solid var(--lmx-surface-edge)" }}
                        >
                          {team.crest ? (
                            <img
                              src={team.crest}
                              alt={team.name}
                              width={40}
                              height={40}
                              crossOrigin="anonymous"
                              style={{ width: 40, height: 40, objectFit: "contain" }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                            >
                              {team.shortName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className="text-xs font-display font-medium leading-tight"
                            style={{ color: "var(--lmx-text)" }}
                          >
                            {team.shortName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid var(--lmx-surface-edge)" }} />

                {/* ── FIXTURES ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-bold text-sm" style={{ color: "var(--lmx-text)" }}>Fixtures</p>
                      <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>Pull all matches for the selected season</p>
                    </div>

                    {state.fixtureStage === "idle" && (
                      <button
                        type="button"
                        onClick={() => previewFixtures(comp)}
                        className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                        style={{ background: "var(--lmx-amber)", color: "var(--lmx-surface)" }}
                      >
                        Preview Fixtures
                      </button>
                    )}
                    {state.fixtureStage === "fetching" && (
                      <span className="text-xs font-display" style={{ color: "var(--lmx-text-muted)" }}>Fetching…</span>
                    )}
                    {state.fixtureStage === "preview" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => update(comp.id, { fixtureStage: "idle", fixturePreview: null })}
                          className="px-3 py-1.5 rounded-lg font-display font-bold text-xs border"
                          style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveFixtures(comp)}
                          className="px-4 py-1.5 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                          style={{ background: "var(--lmx-amber)", color: "var(--lmx-surface)" }}
                        >
                          Save {state.fixturePreview?.count ?? 0} fixtures →
                        </button>
                      </div>
                    )}
                    {state.fixtureStage === "saving" && (
                      <span className="text-xs font-display" style={{ color: "var(--lmx-amber)" }}>Saving…</span>
                    )}
                    {state.fixtureStage === "saved" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-display" style={{ color: "var(--lmx-green)" }}>
                          ✓ {state.fixtureSavedCount} saved{state.fixtureSavedSkipped ? `, ${state.fixtureSavedSkipped} skipped` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => update(comp.id, { fixtureStage: "idle", fixturePreview: null, fixtureSavedCount: null })}
                          className="text-xs underline"
                          style={{ color: "var(--lmx-text-muted)" }}
                        >
                          Re-sync
                        </button>
                      </div>
                    )}
                  </div>

                  {state.fixtureError && (
                    <p className="text-xs mb-3 px-3 py-2 rounded-lg"
                      style={{ color: "var(--lmx-red)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {state.fixtureError}
                    </p>
                  )}

                  {/* Fixture preview summary */}
                  {(state.fixtureStage === "preview" || state.fixtureStage === "saving") && state.fixturePreview && (
                    <div
                      className="mt-3 rounded-xl p-4"
                      style={{ background: "var(--lmx-surface)", border: "1px solid var(--lmx-surface-edge)" }}
                    >
                      <div className="flex items-center gap-6 mb-4 flex-wrap">
                        <div>
                          <p className="text-xs uppercase tracking-wider font-display mb-0.5" style={{ color: "var(--lmx-text-muted)" }}>Total</p>
                          <p className="font-display font-bold text-2xl" style={{ color: "var(--lmx-amber)" }}>
                            {state.fixturePreview.count}
                          </p>
                        </div>
                        {state.fixturePreview.from && (
                          <div>
                            <p className="text-xs uppercase tracking-wider font-display mb-0.5" style={{ color: "var(--lmx-text-muted)" }}>From</p>
                            <p className="text-sm font-display" style={{ color: "var(--lmx-text)" }}>
                              {new Date(state.fixturePreview.from).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        )}
                        {state.fixturePreview.to && (
                          <div>
                            <p className="text-xs uppercase tracking-wider font-display mb-0.5" style={{ color: "var(--lmx-text-muted)" }}>To</p>
                            <p className="text-sm font-display" style={{ color: "var(--lmx-text)" }}>
                              {new Date(state.fixturePreview.to).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        )}
                      </div>

                      {state.fixturePreview.sample.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider font-display mb-2" style={{ color: "var(--lmx-text-muted)" }}>
                            First {state.fixturePreview.sample.length} fixtures
                          </p>
                          <div className="flex flex-col gap-1">
                            {state.fixturePreview.sample.map((f, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
                                style={{ background: "rgba(51,65,85,0.3)" }}
                              >
                                <span style={{ color: "var(--lmx-text)" }}>
                                  {f.homeTeam} <span style={{ color: "var(--lmx-text-muted)" }}>vs</span> {f.awayTeam}
                                </span>
                                <span style={{ color: "var(--lmx-text-muted)" }}>
                                  {new Date(f.kickoffAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                  {f.matchday != null && ` · GW${f.matchday}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
