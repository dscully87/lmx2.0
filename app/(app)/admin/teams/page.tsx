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

interface DbTeam {
  id: string;
  name: string;
  short_name: string;
  crest_url: string | null;
}

type Stage = "idle" | "fetching" | "preview" | "saving" | "saved";

interface CompState {
  competition: DbCompetition;
  dbTeams: DbTeam[];
  season: string;
  stage: Stage;
  preview: TeamPreview[] | null;
  error: string | null;
  savedCount: number | null;
}

export default function AdminTeamsPage() {
  const [compStates, setCompStates] = useState<CompState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/competitions");
      const data = await res.json() as { competitions?: DbCompetition[] };
      const competitions = data.competitions ?? [];

      const states: CompState[] = await Promise.all(
        competitions.map(async (comp) => {
          const teamsRes = await fetch(`/api/admin/teams?competition_id=${comp.id}`);
          const teamsData = await teamsRes.json() as { teams?: DbTeam[] };
          return {
            competition: comp,
            dbTeams: teamsData.teams ?? [],
            season: new Date().getFullYear().toString(),
            stage: "idle" as Stage,
            preview: null,
            error: null,
            savedCount: null,
          };
        })
      );

      setCompStates(states);
    } finally {
      setLoading(false);
    }
  }

  function updateComp(compId: string, updates: Partial<CompState>) {
    setCompStates((prev) =>
      prev.map((s) => (s.competition.id === compId ? { ...s, ...updates } : s))
    );
  }

  async function previewTeams(state: CompState) {
    updateComp(state.competition.id, { stage: "fetching", error: null, preview: null });
    try {
      const res = await fetch(
        `/api/admin/sync/teams?api_competition_id=${state.competition.api_id}&season=${state.season}`
      );
      const data = await res.json() as { teams?: TeamPreview[]; error?: string };
      if (!res.ok) {
        updateComp(state.competition.id, { stage: "idle", error: data.error ?? "Fetch failed." });
        return;
      }
      updateComp(state.competition.id, { stage: "preview", preview: data.teams ?? [] });
    } catch {
      updateComp(state.competition.id, { stage: "idle", error: "Network error." });
    }
  }

  async function saveTeams(state: CompState) {
    updateComp(state.competition.id, { stage: "saving" });
    try {
      const res = await fetch("/api/admin/sync/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition_id: state.competition.id,
          api_competition_id: state.competition.api_id,
          season: state.season,
        }),
      });
      const data = await res.json() as { count?: number; error?: string };
      if (!res.ok) {
        updateComp(state.competition.id, { stage: "preview", error: data.error ?? "Save failed." });
        return;
      }
      // Refresh DB teams after save
      const teamsRes = await fetch(`/api/admin/teams?competition_id=${state.competition.id}`);
      const teamsData = await teamsRes.json() as { teams?: DbTeam[] };
      updateComp(state.competition.id, {
        stage: "saved",
        savedCount: data.count ?? 0,
        dbTeams: teamsData.teams ?? [],
      });
    } catch {
      updateComp(state.competition.id, { stage: "preview", error: "Network error." });
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader label="Admin" title="Teams" />
        <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (compStates.length === 0) {
    return (
      <div>
        <PageHeader label="Admin" title="Teams" />
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-sm mb-2" style={{ color: "var(--lmx-text-muted)" }}>
            No competitions synced yet.
          </p>
          <a href="/admin/competitions" className="text-sm font-display" style={{ color: "var(--lmx-green)" }}>
            Add competitions first →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader label="Admin" title="Teams" subtitle="Preview teams and badges before saving to the database." />

      <div className="flex flex-col gap-10">
        {compStates.map((state) => (
          <div key={state.competition.id}>
            {/* Competition header row */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                {state.competition.emblem_url && (
                  <img
                    src={state.competition.emblem_url}
                    alt={state.competition.name}
                    width={36}
                    height={36}
                    crossOrigin="anonymous"
                    style={{ width: 36, height: 36, objectFit: "contain" }}
                  />
                )}
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
                    {state.competition.name}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                    {state.dbTeams.length > 0
                      ? `${state.dbTeams.length} teams in database`
                      : "No teams synced yet"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={state.season}
                  onChange={(e) => updateComp(state.competition.id, { season: e.target.value })}
                  className="w-20 rounded-lg px-3 py-1.5 text-sm outline-none"
                  style={{
                    background: "var(--lmx-surface)",
                    border: "1px solid var(--lmx-surface-edge)",
                    color: "var(--lmx-text)",
                  }}
                />

                {state.stage === "idle" && (
                  <button
                    type="button"
                    onClick={() => previewTeams(state)}
                    className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                    style={{ background: "var(--lmx-amber)", color: "var(--lmx-surface)" }}
                  >
                    Preview Teams
                  </button>
                )}
                {state.stage === "fetching" && (
                  <span className="text-xs font-display px-4 py-2" style={{ color: "var(--lmx-text-muted)" }}>
                    Fetching…
                  </span>
                )}
                {state.stage === "preview" && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateComp(state.competition.id, { stage: "idle", preview: null })}
                      className="px-3 py-2 rounded-lg font-display font-bold text-xs border"
                      style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveTeams(state)}
                      className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                      style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
                    >
                      Save {state.preview?.length ?? 0} teams →
                    </button>
                  </>
                )}
                {state.stage === "saving" && (
                  <span className="text-xs font-display px-4 py-2" style={{ color: "var(--lmx-amber)" }}>
                    Saving…
                  </span>
                )}
                {state.stage === "saved" && (
                  <>
                    <span className="text-xs font-display" style={{ color: "var(--lmx-green)" }}>
                      ✓ {state.savedCount} saved
                    </span>
                    <button
                      type="button"
                      onClick={() => updateComp(state.competition.id, { stage: "idle", preview: null, savedCount: null })}
                      className="text-xs underline"
                      style={{ color: "var(--lmx-text-muted)" }}
                    >
                      Re-sync
                    </button>
                  </>
                )}
              </div>
            </div>

            {state.error && (
              <p
                className="text-xs mb-3 px-3 py-2 rounded-lg"
                style={{ color: "var(--lmx-red)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {state.error}
              </p>
            )}

            {/* Preview grid (API data, not yet saved) */}
            {(state.stage === "preview" || state.stage === "saving") && state.preview && state.preview.length > 0 && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest font-display mb-3" style={{ color: "var(--lmx-amber)" }}>
                  Preview — {state.preview.length} teams from API
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {state.preview.map((team) => (
                    <div
                      key={team.apiId}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-center"
                      style={{
                        background: "rgba(245,158,11,0.05)",
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}
                    >
                      {team.crest ? (
                        <img
                          src={team.crest}
                          alt={team.name}
                          width={44}
                          height={44}
                          crossOrigin="anonymous"
                          style={{ width: 44, height: 44, objectFit: "contain" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                        >
                          {team.shortName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-display font-medium leading-tight" style={{ color: "var(--lmx-text)" }}>
                        {team.shortName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved DB teams grid */}
            {state.dbTeams.length > 0 && state.stage !== "preview" && state.stage !== "saving" && (
              <div>
                {state.stage === "saved" && (
                  <p className="text-xs uppercase tracking-widest font-display mb-3" style={{ color: "var(--lmx-green)" }}>
                    Saved to database
                  </p>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {state.dbTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-center glass-card"
                    >
                      {team.crest_url ? (
                        <img
                          src={team.crest_url}
                          alt={team.name}
                          width={44}
                          height={44}
                          crossOrigin="anonymous"
                          style={{ width: 44, height: 44, objectFit: "contain" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                        >
                          {team.short_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-display font-medium leading-tight" style={{ color: "var(--lmx-text)" }}>
                        {team.short_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
