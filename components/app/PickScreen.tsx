"use client";

import { useState } from "react";
import Link from "next/link";
import { TeamCrest } from "./TeamCrest";
import { Countdown } from "./Countdown";

interface Team {
  id: string;
  name: string;
  short_name: string;
  crest_url: string | null;
}

interface Fixture {
  id: string;
  kickoff_at: string;
  status: string;
  home_team: Team;
  away_team: Team;
}

interface Props {
  league: { id: string; slug: string; name: string };
  gameweek: { id: string; name: string; cutoff_at: string };
  fixtures: Fixture[];
  usedTeamIds: string[];
  existingPick: { team_id: string } | null;
  isPastCutoff: boolean;
}

export function PickScreen({
  league,
  gameweek,
  fixtures,
  usedTeamIds,
  existingPick,
  isPastCutoff,
}: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    existingPick?.team_id ?? null
  );
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingPick);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selectedTeamId) return;
    setConfirming(true);
    setError(null);

    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_id: league.id,
          gameweek_id: gameweek.id,
          team_id: selectedTeamId,
        }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to submit pick.");
        setConfirming(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  const allTeams = fixtures.flatMap((f) => [f.home_team, f.away_team]);
  const selectedTeam = allTeams.find((t) => t.id === selectedTeamId);

  if (submitted && selectedTeam) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div
          className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4"
          style={{ border: "1px solid rgba(16,185,129,0.4)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            ✓
          </div>
          <h1
            className="font-display font-bold text-2xl"
            style={{ color: "var(--lmx-green)" }}
          >
            Pick Submitted!
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <TeamCrest
              src={selectedTeam.crest_url ?? ""}
              name={selectedTeam.name}
              size={40}
            />
            <div className="text-left">
              <p className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
                {selectedTeam.name}
              </p>
              <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                {gameweek.name}
              </p>
            </div>
          </div>
          {!isPastCutoff && (
            <p className="text-sm mt-2" style={{ color: "var(--lmx-text-muted)" }}>
              You can change your pick until cutoff:{" "}
              <Countdown target={gameweek.cutoff_at} />
            </p>
          )}
          <div className="flex gap-3 mt-4">
            {!isPastCutoff && (
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-lg font-display font-bold text-sm border transition-all hover:opacity-90"
                style={{
                  borderColor: "var(--lmx-surface-edge)",
                  color: "var(--lmx-text-muted)",
                }}
              >
                Change pick
              </button>
            )}
            <Link
              href={`/leagues/${league.slug}`}
              className="px-6 py-2 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              Back to league →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest font-display mb-1"
            style={{ color: "var(--lmx-green)" }}
          >
            {league.name}
          </p>
          <h1
            className="font-display font-bold text-2xl"
            style={{ color: "var(--lmx-text)" }}
          >
            {gameweek.name} — Make your pick
          </h1>
          {!isPastCutoff && (
            <p className="text-sm mt-1" style={{ color: "var(--lmx-text-muted)" }}>
              Cutoff in: <Countdown target={gameweek.cutoff_at} />
            </p>
          )}
        </div>
        <Link
          href={`/leagues/${league.slug}`}
          className="text-sm font-display flex-shrink-0"
          style={{ color: "var(--lmx-text-muted)" }}
        >
          ← Back
        </Link>
      </div>

      {isPastCutoff && (
        <div
          className="rounded-xl px-4 py-3 mb-6 text-sm"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.3)",
            color: "var(--lmx-amber)",
          }}
        >
          The pick window is now closed. Viewing in read-only mode.
        </div>
      )}

      {usedTeamIds.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 mb-6 text-sm"
          style={{
            background: "rgba(148,163,184,0.05)",
            border: "1px solid var(--lmx-surface-edge)",
            color: "var(--lmx-text-muted)",
          }}
        >
          Teams marked <strong>Used</strong> have already been picked in a previous gameweek and cannot be selected again.
        </div>
      )}

      {/* Fixture grid */}
      <div className="flex flex-col gap-4 mb-8">
        {fixtures.map((fixture) => {
          const kickoff = new Date(fixture.kickoff_at);
          const dateStr = kickoff.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          const timeStr = kickoff.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          });

          return (
            <div key={fixture.id} className="glass-card rounded-xl p-4">
              <p
                className="text-xs font-display mb-3 text-center"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                {dateStr} · {timeStr} UTC
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[fixture.home_team, fixture.away_team].map((team) => {
                  const isUsed = usedTeamIds.includes(team.id);
                  const isSelected = selectedTeamId === team.id;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      disabled={isUsed || isPastCutoff}
                      onClick={() => !isUsed && !isPastCutoff && setSelectedTeamId(team.id)}
                      className="relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all text-center"
                      style={{
                        background: isSelected
                          ? "rgba(16,185,129,0.12)"
                          : "var(--lmx-surface)",
                        border: isSelected
                          ? "2px solid var(--lmx-green)"
                          : "1px solid var(--lmx-surface-edge)",
                        opacity: isUsed ? 0.4 : 1,
                        cursor: isUsed || isPastCutoff ? "not-allowed" : "pointer",
                        boxShadow: isSelected
                          ? "0 0 16px rgba(16,185,129,0.2)"
                          : "none",
                      }}
                    >
                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: "var(--lmx-green)",
                            color: "var(--lmx-surface)",
                          }}
                        >
                          ✓
                        </span>
                      )}
                      {isUsed && (
                        <span
                          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-display font-bold"
                          style={{
                            background: "rgba(148,163,184,0.15)",
                            color: "var(--lmx-text-muted)",
                          }}
                        >
                          Used
                        </span>
                      )}
                      <TeamCrest
                        src={team.crest_url ?? ""}
                        name={team.name}
                        size={40}
                      />
                      <span
                        className="font-display font-bold text-sm leading-tight"
                        style={{ color: "var(--lmx-text)" }}
                      >
                        {team.short_name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {fixtures.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: "var(--lmx-text-muted)" }}>
            No fixtures assigned to this gameweek yet.
          </p>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm"
          style={{
            color: "var(--lmx-red)",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}

      {/* Confirm button */}
      {!isPastCutoff && (
        <div
          className="sticky bottom-6 flex justify-center"
        >
          <button
            type="button"
            disabled={!selectedTeamId || confirming}
            onClick={handleConfirm}
            className="px-10 py-3 rounded-xl font-display font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
            style={{
              background: selectedTeamId ? "var(--lmx-green)" : "var(--lmx-surface-edge)",
              color: selectedTeamId ? "var(--lmx-surface)" : "var(--lmx-text-muted)",
            }}
          >
            {confirming
              ? "Confirming…"
              : selectedTeamId
              ? `Confirm: ${allTeams.find((t) => t.id === selectedTeamId)?.short_name ?? "Pick"} →`
              : "Select a team to pick"}
          </button>
        </div>
      )}
    </div>
  );
}
