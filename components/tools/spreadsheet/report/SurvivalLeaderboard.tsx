"use client";

import type { LeagueData } from "@/lib/spreadsheet/types";

type Props = { data: LeagueData };

export default function SurvivalLeaderboard({ data }: Props) {
  const { players, picks } = data;

  const rows = players.map((p) => {
    const playerPicks = picks.filter((pk) => pk.playerName === p.playerName);
    const survived = playerPicks.filter((pk) => pk.result === "W").length;
    return { ...p, survived, pickCount: playerPicks.length };
  });

  // Sort: active first (by survived desc), then eliminated (by eliminatedGameweek desc)
  rows.sort((a, b) => {
    if (a.status === b.status) {
      if (a.status === "active") return b.survived - a.survived;
      return (b.eliminatedGameweek ?? 0) - (a.eliminatedGameweek ?? 0);
    }
    return a.status === "active" ? -1 : 1;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
            {["#", "Player", "Status", "GWs Survived", "Picks Made"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-display text-xs uppercase tracking-widest"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.playerName}
              style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}
              className="transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3 font-display font-bold" style={{ color: "var(--lmx-text-muted)" }}>
                {i + 1}
              </td>
              <td className="px-4 py-3 font-display font-bold" style={{ color: "var(--lmx-text)" }}>
                {row.playerName}
              </td>
              <td className="px-4 py-3">
                {row.status === "active" ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wide"
                    style={{ background: "rgba(16,185,129,0.12)", color: "var(--lmx-green)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Active
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wide"
                    style={{ background: "rgba(239,68,68,0.12)", color: "var(--lmx-red)" }}
                  >
                    Out GW{row.eliminatedGameweek ?? "?"}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-display" style={{ color: "var(--lmx-text)" }}>
                {row.survived}
              </td>
              <td className="px-4 py-3 font-display" style={{ color: "var(--lmx-text-muted)" }}>
                {row.pickCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
