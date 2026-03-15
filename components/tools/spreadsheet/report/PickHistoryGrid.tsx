"use client";

import type { LeagueData } from "@/lib/spreadsheet/types";

type Props = { data: LeagueData };

const RESULT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  W: { bg: "rgba(16,185,129,0.15)", text: "var(--lmx-green)", label: "W" },
  L: { bg: "rgba(239,68,68,0.15)", text: "var(--lmx-red)", label: "L" },
  D: { bg: "rgba(239,68,68,0.15)", text: "var(--lmx-red)", label: "D" },
  pending: { bg: "rgba(148,163,184,0.08)", text: "var(--lmx-text-muted)", label: "—" },
  none: { bg: "transparent", text: "var(--lmx-text-muted)", label: "" },
};

export default function PickHistoryGrid({ data }: Props) {
  const { players, picks } = data;

  const gameweeks =
    picks.length > 0
      ? Array.from({ length: Math.max(...picks.map((p) => p.gameweek)) }, (_, i) => i + 1)
      : [];

  if (gameweeks.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
        No picks have been entered yet.
      </p>
    );
  }

  // Sort players same as leaderboard: active first, then by survived desc
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.status === b.status) {
      if (a.status === "active") {
        const aS = picks.filter((pk) => pk.playerName === a.playerName && pk.result === "W").length;
        const bS = picks.filter((pk) => pk.playerName === b.playerName && pk.result === "W").length;
        return bS - aS;
      }
      return (b.eliminatedGameweek ?? 0) - (a.eliminatedGameweek ?? 0);
    }
    return a.status === "active" ? -1 : 1;
  });

  return (
    <div className="overflow-x-auto">
      <table className="text-xs" style={{ borderCollapse: "separate", borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th
              className="px-3 py-2 text-left font-display uppercase tracking-widest text-xs min-w-[140px]"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Player
            </th>
            {gameweeks.map((gw) => (
              <th
                key={gw}
                className="px-2 py-2 text-center font-display uppercase tracking-widest min-w-[72px]"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                GW{gw}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.playerName}>
              <td
                className="px-3 py-2 font-display font-bold whitespace-nowrap"
                style={{ color: player.status === "active" ? "var(--lmx-text)" : "var(--lmx-text-muted)" }}
              >
                {player.playerName}
              </td>
              {gameweeks.map((gw) => {
                const pick = picks.find(
                  (pk) => pk.playerName === player.playerName && pk.gameweek === gw
                );

                const enteredThisGw = gw >= player.entryGameweek;
                const eliminatedBefore =
                  player.eliminatedGameweek !== null && gw > player.eliminatedGameweek;

                if (!enteredThisGw || eliminatedBefore) {
                  return (
                    <td key={gw} className="px-2 py-1">
                      <div
                        className="rounded px-2 py-1.5 text-center"
                        style={{ background: "transparent", minWidth: "64px" }}
                      />
                    </td>
                  );
                }

                const style =
                  !pick
                    ? RESULT_STYLES.none
                    : pick.result
                    ? RESULT_STYLES[pick.result]
                    : RESULT_STYLES.pending;

                return (
                  <td key={gw} className="px-2 py-1">
                    <div
                      className="rounded px-2 py-1.5 text-center"
                      style={{
                        background: style.bg,
                        color: style.text,
                        minWidth: "64px",
                      }}
                    >
                      <div className="font-display font-bold leading-tight truncate max-w-[64px]">
                        {pick?.teamPicked ?? ""}
                      </div>
                      <div className="font-display font-bold text-[10px] mt-0.5 opacity-80">
                        {style.label}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
