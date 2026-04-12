import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { TeamCrest } from "@/components/app/TeamCrest";
import { CountdownWrapper } from "./CountdownWrapper";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function LeaguePage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch league
  const { data: league } = await supabase
    .from("leagues")
    .select("*, competitions(name, code)")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  // Fetch user's membership
  const { data: myMembership } = await supabase
    .from("league_memberships")
    .select("id, role, is_eliminated")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  // Fetch all memberships with profiles
  const { data: memberships } = await supabase
    .from("league_memberships")
    .select("id, role, is_eliminated, eliminated_gameweek_id, joined_at, profiles(display_name)")
    .eq("league_id", league.id)
    .order("is_eliminated", { ascending: true })
    .order("joined_at", { ascending: true });

  // Fetch current/latest gameweek
  const { data: gameweek } = await supabase
    .from("gameweeks")
    .select("id, name, number, status, cutoff_at, closes_at")
    .eq("competition_id", league.competition_id)
    .order("number", { ascending: false })
    .limit(1)
    .single();

  // Fetch picks for current gameweek
  let picks: Array<{
    id: string;
    user_id: string;
    status: string;
    teams: { name: string; short_name: string; crest_url: string | null } | null;
    profiles: { display_name: string } | null;
  }> = [];

  if (gameweek) {
    const { data: picksData } = await supabase
      .from("picks")
      .select(
        "id, user_id, status, teams(name, short_name, crest_url), profiles(display_name)"
      )
      .eq("league_id", league.id)
      .eq("gameweek_id", gameweek.id);
    picks = (picksData ?? []) as unknown as typeof picks;
  }

  // User's own pick
  const myPick = picks.find((p) => p.user_id === user.id);

  const isOwner =
    myMembership?.role === "owner" ||
    (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => data?.role === "admin"));

  const isPastCutoff = gameweek
    ? new Date(gameweek.cutoff_at) < new Date()
    : true;

  const comp = league.competitions as unknown as { name: string; code: string } | null;

  // Fetch eliminated gameweek numbers for eliminated members
  const eliminatedGwIds = (memberships ?? [])
    .filter((m) => m.eliminated_gameweek_id)
    .map((m) => m.eliminated_gameweek_id as string);

  const eliminatedGwMap: Record<string, number> = {};
  if (eliminatedGwIds.length > 0) {
    const { data: elimGws } = await supabase
      .from("gameweeks")
      .select("id, number")
      .in("id", eliminatedGwIds);
    (elimGws ?? []).forEach((gw) => {
      eliminatedGwMap[gw.id] = gw.number;
    });
  }

  return (
    <div>
      <PageHeader
        label={comp?.name ?? "League"}
        title={league.name}
        subtitle={`Invite code: ${league.invite_code}`}
        action={
          isOwner ? (
            <Link
              href={`/leagues/${slug}/manage`}
              className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
              style={{
                background: "var(--lmx-surface-mid)",
                color: "var(--lmx-amber)",
                border: "1px solid var(--lmx-surface-edge)",
              }}
            >
              Manage League
            </Link>
          ) : undefined
        }
      />

      {/* Invite code block */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-display mb-1" style={{ color: "var(--lmx-text-muted)" }}>
            Invite Code
          </p>
          <span
            className="font-mono text-2xl font-bold tracking-widest"
            style={{ color: "var(--lmx-green)", fontFamily: "var(--font-mono)" }}
          >
            {league.invite_code}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
            Share this code for others to join
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--lmx-text-muted)" }}>
            or send them to{" "}
            <span style={{ color: "var(--lmx-green)" }}>
              /join/{league.invite_code}
            </span>
          </p>
        </div>
      </div>

      {/* Current Gameweek */}
      {gameweek && (
        <div className="glass-card rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-base" style={{ color: "var(--lmx-text)" }}>
                {gameweek.name}
              </span>
              <StatusBadge
                status={gameweek.status as "open" | "locked" | "draft" | "processing" | "complete"}
              />
            </div>
            {gameweek.status === "open" && (
              <div className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                Cutoff:{" "}
                <CountdownWrapper target={gameweek.cutoff_at} />
              </div>
            )}
          </div>

          {/* CTA: Pick needed */}
          {gameweek.status === "open" &&
            !isPastCutoff &&
            !myPick &&
            myMembership &&
            !myMembership.is_eliminated && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--lmx-surface-edge)" }}>
                <Link
                  href={`/leagues/${slug}/pick`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
                  style={{
                    background: "var(--lmx-amber)",
                    color: "var(--lmx-surface)",
                  }}
                >
                  ⚡ Make your pick →
                </Link>
              </div>
            )}

          {myPick && (
            <div
              className="mt-4 pt-4 text-sm font-display font-medium"
              style={{
                borderTop: "1px solid var(--lmx-surface-edge)",
                color: "var(--lmx-green)",
              }}
            >
              ✓ Pick submitted
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leaderboard */}
        <div>
          <h2
            className="font-display font-bold text-lg mb-3"
            style={{ color: "var(--lmx-text)" }}
          >
            Players
          </h2>
          <div className="glass-card rounded-xl overflow-hidden">
            {(memberships ?? []).length === 0 ? (
              <p className="p-6 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                No members yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(memberships ?? []).map((m, i) => {
                    const profile = m.profiles as unknown as { display_name: string } | null;
                    const isMe = memberships?.findIndex(
                      (x) =>
                        (x.profiles as unknown as { display_name: string } | null)
                          ?.display_name === profile?.display_name
                    ) === i;
                    void isMe;
                    const elimGwNum = m.eliminated_gameweek_id
                      ? eliminatedGwMap[m.eliminated_gameweek_id]
                      : null;

                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: "1px solid var(--lmx-surface-edge)",
                          opacity: m.is_eliminated ? 0.5 : 1,
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                background: m.is_eliminated
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(16,185,129,0.15)",
                                color: m.is_eliminated
                                  ? "var(--lmx-red)"
                                  : "var(--lmx-green)",
                              }}
                            >
                              {m.is_eliminated ? "✕" : "✓"}
                            </span>
                            <span style={{ color: "var(--lmx-text)" }}>
                              {profile?.display_name ?? "Unknown"}
                            </span>
                            {m.role === "owner" && (
                              <span
                                className="text-xs rounded px-1.5 py-0.5 font-display"
                                style={{
                                  background: "rgba(245,158,11,0.15)",
                                  color: "var(--lmx-amber)",
                                }}
                              >
                                Owner
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {m.is_eliminated && elimGwNum ? (
                            <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                              Eliminated GW {elimGwNum}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--lmx-green)" }}>
                              Surviving
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Current GW Picks */}
        {gameweek && (isPastCutoff || gameweek.status === "locked" || gameweek.status === "complete") && (
          <div>
            <h2
              className="font-display font-bold text-lg mb-3"
              style={{ color: "var(--lmx-text)" }}
            >
              Picks — {gameweek.name}
            </h2>
            <div className="glass-card rounded-xl overflow-hidden">
              {picks.length === 0 ? (
                <p className="p-6 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                  No picks submitted yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
                      <th className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider" style={{ color: "var(--lmx-text-muted)" }}>
                        Player
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider" style={{ color: "var(--lmx-text-muted)" }}>
                        Team Picked
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-display uppercase tracking-wider" style={{ color: "var(--lmx-text-muted)" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {picks.map((pick) => {
                      const team = pick.teams;
                      return (
                        <tr
                          key={pick.id}
                          style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}
                        >
                          <td className="px-4 py-3" style={{ color: "var(--lmx-text)" }}>
                            {pick.profiles?.display_name ?? "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            {team ? (
                              <div className="flex items-center gap-2">
                                <TeamCrest
                                  src={team.crest_url ?? ""}
                                  name={team.name}
                                  size={20}
                                />
                                <span style={{ color: "var(--lmx-text)" }}>
                                  {team.short_name}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--lmx-text-muted)" }}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge
                              status={pick.status as "pending" | "survived" | "eliminated" | "auto"}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <div className="flex gap-4 mt-8 flex-wrap">
        <Link
          href={`/leagues/${slug}/history`}
          className="text-sm font-display"
          style={{ color: "var(--lmx-text-muted)" }}
        >
          View full history →
        </Link>
      </div>
    </div>
  );
}
