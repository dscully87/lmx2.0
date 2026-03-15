"use client";

import type { LeagueData } from "@/lib/spreadsheet/types";

type Props = { data: LeagueData };

export default function LeagueSummary({ data }: Props) {
  const { players, picks } = data;

  const active = players.filter((p) => p.status === "active").length;
  const eliminated = players.filter((p) => p.status === "eliminated").length;
  const gameweeks = picks.length > 0 ? Math.max(...picks.map((p) => p.gameweek)) : 0;

  // Leaders: active players with the most gameweeks survived (most picks with a result)
  const survivedCounts = new Map<string, number>();
  for (const p of players.filter((p) => p.status === "active")) {
    const count = picks.filter((pk) => pk.playerName === p.playerName && pk.result === "W").length;
    survivedCounts.set(p.playerName, count);
  }
  const maxSurvived = Math.max(0, ...Array.from(survivedCounts.values()));
  const leaders = Array.from(survivedCounts.entries())
    .filter(([, count]) => count === maxSurvived)
    .map(([name]) => name);

  const stats = [
    { label: "Total Players", value: players.length },
    { label: "Still Active", value: active, color: "var(--lmx-green)" },
    { label: "Eliminated", value: eliminated, color: "var(--lmx-red)" },
    { label: "Gameweeks Played", value: gameweeks },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-5 text-center">
            <p
              className="font-display font-bold text-3xl"
              style={{ color: s.color ?? "var(--lmx-text)" }}
            >
              {s.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: "var(--lmx-text-muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {leaders.length > 0 && (
        <div
          className="glass-card p-5 flex items-center gap-4"
          style={{ borderColor: "var(--lmx-green)", borderWidth: 1 }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-display font-bold text-sm uppercase tracking-widest" style={{ color: "var(--lmx-green)" }}>
              {leaders.length === 1 ? "Current Leader" : "Current Leaders"}
            </p>
            <p className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
              {leaders.join(", ")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--lmx-text-muted)" }}>
              {maxSurvived} gameweek{maxSurvived !== 1 ? "s" : ""} survived
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
