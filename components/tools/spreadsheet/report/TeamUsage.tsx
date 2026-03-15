"use client";

import type { LeagueData } from "@/lib/spreadsheet/types";

type Props = { data: LeagueData };

export default function TeamUsage({ data }: Props) {
  const { picks } = data;

  if (picks.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
        No picks have been entered yet.
      </p>
    );
  }

  const counts = new Map<string, { total: number; wins: number; losses: number; draws: number }>();
  for (const pick of picks) {
    const team = pick.teamPicked;
    if (!counts.has(team)) counts.set(team, { total: 0, wins: 0, losses: 0, draws: 0 });
    const entry = counts.get(team)!;
    entry.total++;
    if (pick.result === "W") entry.wins++;
    else if (pick.result === "L") entry.losses++;
    else if (pick.result === "D") entry.draws++;
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1].total - a[1].total);
  const max = sorted[0]?.[1].total ?? 1;

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([team, stats]) => {
        const winPct = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
        const barWidth = (stats.total / max) * 100;

        return (
          <div key={team} className="flex items-center gap-4">
            <div className="w-32 text-sm font-display font-bold truncate flex-shrink-0" style={{ color: "var(--lmx-text)" }}>
              {team}
            </div>
            <div className="flex-1 flex items-center gap-3">
              {/* Bar */}
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--lmx-surface-edge)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    background: winPct >= 60
                      ? "var(--lmx-green)"
                      : winPct >= 40
                      ? "var(--lmx-amber)"
                      : "var(--lmx-red)",
                  }}
                />
              </div>
              <span
                className="text-xs font-display font-bold w-6 text-right"
                style={{ color: "var(--lmx-text)" }}
              >
                {stats.total}
              </span>
              <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--lmx-text-muted)" }}>
                {stats.wins}W {stats.draws}D {stats.losses}L
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
