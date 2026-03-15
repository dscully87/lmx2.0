import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";

interface Params {
  params: Promise<{ slug: string }>;
}

function pickDot(status: string) {
  if (status === "survived") return { bg: "rgba(16,185,129,0.2)", color: "#10B981" };
  if (status === "eliminated") return { bg: "rgba(239,68,68,0.2)", color: "#EF4444" };
  if (status === "pending" || status === "auto") return { bg: "rgba(245,158,11,0.2)", color: "#F59E0B" };
  return { bg: "rgba(51,65,85,0.3)", color: "#94A3B8" };
}

export default async function HistoryPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, slug, competition_id, competitions(name)")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  // Check membership
  const { data: membership } = await supabase
    .from("league_memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect(`/leagues/${slug}`);

  // Fetch all gameweeks for this competition
  const { data: gameweeks } = await supabase
    .from("gameweeks")
    .select("id, name, number, status")
    .eq("competition_id", league.competition_id)
    .order("number", { ascending: true });

  // Fetch all league members with profiles
  const { data: members } = await supabase
    .from("league_memberships")
    .select("id, user_id, is_eliminated, profiles(display_name)")
    .eq("league_id", league.id)
    .order("is_eliminated", { ascending: true })
    .order("joined_at", { ascending: true });

  // Fetch all picks for this league
  const { data: allPicks } = await supabase
    .from("picks")
    .select("user_id, gameweek_id, status, teams(short_name, crest_url)")
    .eq("league_id", league.id);

  // Build a lookup: [user_id][gameweek_id] -> pick
  const pickMap: Record<string, Record<string, { status: string; team_short: string; crest_url: string | null }>> = {};
  (allPicks ?? []).forEach((p) => {
    const team = p.teams as unknown as { short_name: string; crest_url: string | null } | null;
    if (!pickMap[p.user_id]) pickMap[p.user_id] = {};
    pickMap[p.user_id][p.gameweek_id] = {
      status: p.status,
      team_short: team?.short_name ?? "?",
      crest_url: team?.crest_url ?? null,
    };
  });

  const comp = league.competitions as unknown as { name: string } | null;

  return (
    <div>
      <PageHeader
        label={comp?.name ?? "League"}
        title={`${league.name} — History`}
        action={
          <Link
            href={`/leagues/${slug}`}
            className="text-sm font-display"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            ← Back
          </Link>
        }
      />

      {(!gameweeks || gameweeks.length === 0) ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-lg font-display font-bold mb-2" style={{ color: "var(--lmx-text)" }}>
            No gameweeks yet
          </p>
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            History will appear here once gameweeks have been played.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
                <th
                  className="px-4 py-3 text-left text-xs font-display uppercase tracking-wider sticky left-0 z-10"
                  style={{
                    color: "var(--lmx-text-muted)",
                    background: "var(--lmx-surface-mid)",
                    minWidth: 140,
                  }}
                >
                  Player
                </th>
                {(gameweeks ?? []).map((gw) => (
                  <th
                    key={gw.id}
                    className="px-3 py-3 text-center text-xs font-display uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "var(--lmx-text-muted)", minWidth: 80 }}
                  >
                    <div>GW{gw.number}</div>
                    <div className="mt-0.5">
                      <StatusBadge
                        status={gw.status as "open" | "locked" | "draft" | "processing" | "complete"}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => {
                const profile = member.profiles as unknown as { display_name: string } | null;
                return (
                  <tr
                    key={member.id}
                    style={{
                      borderBottom: "1px solid var(--lmx-surface-edge)",
                      opacity: member.is_eliminated ? 0.6 : 1,
                    }}
                  >
                    <td
                      className="px-4 py-3 font-display font-medium sticky left-0 z-10"
                      style={{
                        color: member.is_eliminated
                          ? "var(--lmx-text-muted)"
                          : "var(--lmx-text)",
                        background: "var(--lmx-surface-mid)",
                        minWidth: 140,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: member.is_eliminated
                              ? "var(--lmx-red)"
                              : "var(--lmx-green)",
                          }}
                        />
                        {profile?.display_name ?? "Unknown"}
                      </div>
                    </td>
                    {(gameweeks ?? []).map((gw) => {
                      const pick = pickMap[member.user_id]?.[gw.id];
                      const dot = pick ? pickDot(pick.status) : null;
                      return (
                        <td key={gw.id} className="px-3 py-3 text-center">
                          {pick ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className="text-xs font-mono font-medium"
                                style={{ color: "var(--lmx-text)" }}
                              >
                                {pick.team_short}
                              </span>
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ background: dot?.bg, border: `1.5px solid ${dot?.color}` }}
                              />
                            </div>
                          ) : (
                            <span style={{ color: "var(--lmx-surface-edge)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {[
          { label: "Survived", ...pickDot("survived") },
          { label: "Eliminated", ...pickDot("eliminated") },
          { label: "Pending / Auto", ...pickDot("pending") },
          { label: "No pick", ...pickDot("none") },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: item.bg, border: `1.5px solid ${item.color}` }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
