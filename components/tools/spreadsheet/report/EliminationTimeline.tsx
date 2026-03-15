"use client";

import type { LeagueData } from "@/lib/spreadsheet/types";

type Props = { data: LeagueData };

export default function EliminationTimeline({ data }: Props) {
  const { players, picks } = data;

  const eliminated = players.filter((p) => p.status === "eliminated" && p.eliminatedGameweek !== null);

  if (eliminated.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
        No eliminations recorded yet.
      </p>
    );
  }

  // Group by gameweek
  const byGameweek = new Map<number, typeof eliminated>();
  for (const player of eliminated) {
    const gw = player.eliminatedGameweek!;
    if (!byGameweek.has(gw)) byGameweek.set(gw, []);
    byGameweek.get(gw)!.push(player);
  }

  const sortedGws = Array.from(byGameweek.keys()).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4">
      {sortedGws.map((gw) => {
        const group = byGameweek.get(gw)!;
        return (
          <div key={gw} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)", color: "var(--lmx-red)" }}
              >
                {gw}
              </div>
              <div className="w-px flex-1 mt-1" style={{ background: "var(--lmx-surface-edge)" }} />
            </div>

            <div className="pb-4 flex-1">
              <p
                className="text-xs uppercase tracking-widest font-display mb-2"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                Gameweek {gw}
              </p>
              <div className="flex flex-col gap-2">
                {group.map((player) => {
                  const elimPick = picks.find(
                    (pk) => pk.playerName === player.playerName && pk.gameweek === gw
                  );
                  return (
                    <div
                      key={player.playerName}
                      className="glass-card px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <span className="font-display font-bold text-sm" style={{ color: "var(--lmx-text)" }}>
                        {player.playerName}
                      </span>
                      {elimPick && (
                        <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                          Picked{" "}
                          <span className="font-display font-bold" style={{ color: "var(--lmx-text)" }}>
                            {elimPick.teamPicked}
                          </span>
                          {elimPick.result && (
                            <>
                              {" "}—{" "}
                              <span style={{ color: elimPick.result === "W" ? "var(--lmx-green)" : "var(--lmx-red)" }}>
                                {elimPick.result === "L" ? "Lost" : elimPick.result === "D" ? "Drew" : "Won"}
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
