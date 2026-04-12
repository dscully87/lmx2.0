import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ManageLeagueForm } from "./ManageLeagueForm";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function ManagePage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: league } = await supabase
    .from("leagues")
    .select("*, competitions(name)")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  // Check user is league owner or admin
  const { data: membership } = await supabase
    .from("league_memberships")
    .select("id, role")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  const canManage =
    membership?.role === "owner" || profile?.role === "admin";

  if (!canManage) {
    redirect(`/leagues/${slug}`);
  }

  // Fetch all members with profiles and gameweek info
  const { data: members } = await supabase
    .from("league_memberships")
    .select("id, user_id, role, is_eliminated, joined_at, profiles(display_name)")
    .eq("league_id", league.id)
    .order("is_eliminated", { ascending: true })
    .order("joined_at", { ascending: true });

  // Fetch gameweeks for this competition
  const { data: gameweeks } = await supabase
    .from("gameweeks")
    .select("id, name, number, status, cutoff_at")
    .eq("competition_id", league.competition_id)
    .order("number", { ascending: true });

  // Figure out who hasn't picked for the current open GW
  const openGw = (gameweeks ?? []).find((gw) => gw.status === "open");
  const unpickedUserIds: Set<string> = new Set();
  if (openGw) {
    const { data: picks } = await supabase
      .from("picks")
      .select("user_id")
      .eq("league_id", league.id)
      .eq("gameweek_id", openGw.id);

    const pickedIds = new Set((picks ?? []).map((p) => p.user_id));
    (members ?? []).forEach((m) => {
      if (!m.is_eliminated && !pickedIds.has(m.user_id)) {
        unpickedUserIds.add(m.user_id);
      }
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lmxgame.com";
  const comp = league.competitions as unknown as { name: string } | null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        label={comp?.name ?? "League"}
        title={`Manage: ${league.name}`}
        action={
          <Link
            href={`/leagues/${slug}`}
            className="text-sm font-display"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            ← Back to league
          </Link>
        }
      />

      <div className="flex flex-col gap-8">
        {/* League Settings */}
        <section>
          <h2
            className="font-display font-bold text-lg mb-4"
            style={{ color: "var(--lmx-text)" }}
          >
            League Settings
          </h2>
          <ManageLeagueForm
            slug={slug}
            initialName={league.name}
            initialIsPublic={league.is_public}
            initialAutoPickEnabled={league.auto_pick_enabled}
          />
        </section>

        {/* Invite Code */}
        <section>
          <h2
            className="font-display font-bold text-lg mb-4"
            style={{ color: "var(--lmx-text)" }}
          >
            Invite Code
          </h2>
          <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span
                className="font-mono text-3xl font-bold tracking-widest"
                style={{ color: "var(--lmx-green)", fontFamily: "var(--font-mono)" }}
              >
                {league.invite_code}
              </span>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--lmx-text-muted)" }}>
                Share link
              </p>
              <code
                className="text-sm rounded-lg px-3 py-2 block"
                style={{
                  background: "var(--lmx-surface)",
                  border: "1px solid var(--lmx-surface-edge)",
                  color: "var(--lmx-text)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {appUrl}/join/{league.invite_code}
              </code>
            </div>
          </div>
        </section>

        {/* Players */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-display font-bold text-lg"
              style={{ color: "var(--lmx-text)" }}
            >
              Players ({(members ?? []).length})
            </h2>
            {openGw && unpickedUserIds.size > 0 && (
              <span className="text-xs font-display" style={{ color: "var(--lmx-amber)" }}>
                {unpickedUserIds.size} unpicked
              </span>
            )}
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
                  <th
                    className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider"
                    style={{ color: "var(--lmx-text-muted)" }}
                  >
                    Player
                  </th>
                  <th
                    className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider"
                    style={{ color: "var(--lmx-text-muted)" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider"
                    style={{ color: "var(--lmx-text-muted)" }}
                  >
                    Joined
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {(members ?? []).map((m) => {
                  const profile = m.profiles as unknown as { display_name: string } | null;
                  const needsPick = unpickedUserIds.has(m.user_id);
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: "1px solid var(--lmx-surface-edge)",
                        opacity: m.is_eliminated ? 0.6 : 1,
                      }}
                    >
                      <td className="px-4 py-3" style={{ color: "var(--lmx-text)" }}>
                        <div className="flex items-center gap-2">
                          {profile?.display_name ?? "Unknown"}
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
                      <td className="px-4 py-3">
                        {m.is_eliminated ? (
                          <StatusBadge status="eliminated" />
                        ) : (
                          <StatusBadge status="survived" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                        {new Date(m.joined_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {needsPick && (
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              disabled
                              className="text-xs px-3 py-1 rounded-lg font-display opacity-50 cursor-not-allowed"
                              style={{
                                background: "rgba(245,158,11,0.1)",
                                color: "var(--lmx-amber)",
                                border: "1px solid rgba(245,158,11,0.2)",
                              }}
                            >
                              Nudge
                            </button>
                            <div
                              className="absolute right-0 bottom-full mb-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                              style={{
                                background: "var(--lmx-surface-mid)",
                                border: "1px solid var(--lmx-surface-edge)",
                                color: "var(--lmx-text-muted)",
                              }}
                            >
                              Email coming soon
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Gameweeks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-display font-bold text-lg"
              style={{ color: "var(--lmx-text)" }}
            >
              Gameweeks
            </h2>
            {profile?.role === "admin" ? (
              <Link
                href="/admin/gameweeks/create"
                className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
              >
                + Create Gameweek
              </Link>
            ) : (
              <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                Ask admin to create gameweeks
              </p>
            )}
          </div>
          {(!gameweeks || gameweeks.length === 0) ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                No gameweeks created yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(gameweeks ?? []).map((gw) => (
                <div
                  key={gw.id}
                  className="glass-card rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-display font-medium text-sm" style={{ color: "var(--lmx-text)" }}>
                      {gw.name}
                    </span>
                    <span className="text-xs ml-2" style={{ color: "var(--lmx-text-muted)" }}>
                      Cutoff{" "}
                      {new Date(gw.cutoff_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <StatusBadge
                    status={gw.status as "open" | "locked" | "draft" | "processing" | "complete"}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
