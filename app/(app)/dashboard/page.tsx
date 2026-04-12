import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";

function getGreeting(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user's league memberships with league + competition info
  const { data: memberships } = await supabase
    .from("league_memberships")
    .select(
      `
      id, role, is_eliminated, joined_at,
      leagues (
        id, name, slug, invite_code, is_public, competition_id,
        competitions ( name )
      )
    `
    )
    .eq("user_id", user.id);

  // For each league, fetch current active gameweek and user's pick
  const membershipData = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const league = m.leagues as unknown as {
        id: string;
        name: string;
        slug: string;
        invite_code: string;
        is_public: boolean;
        competition_id: string;
        competitions: { name: string } | null;
      } | null;

      if (!league) return null;

      // Current active gameweek
      const { data: gameweek } = await supabase
        .from("gameweeks")
        .select("id, name, status, cutoff_at, number")
        .eq("competition_id", league.competition_id)
        .in("status", ["open", "locked"])
        .order("number", { ascending: true })
        .limit(1)
        .single();

      // User's pick for this gameweek in this league
      let pick: { status: string; team_id: string } | null = null;
      if (gameweek) {
        const { data: pickData } = await supabase
          .from("picks")
          .select("status, team_id")
          .eq("league_id", league.id)
          .eq("gameweek_id", gameweek.id)
          .eq("user_id", user.id)
          .single();
        pick = pickData;
      }

      // Surviving player count
      const { count: survivingCount } = await supabase
        .from("league_memberships")
        .select("id", { count: "exact", head: true })
        .eq("league_id", league.id)
        .eq("is_eliminated", false);

      return {
        membership: m,
        league,
        gameweek,
        pick,
        survivingCount: survivingCount ?? 0,
      };
    })
  );

  const validMemberships = membershipData.filter(Boolean) as NonNullable<
    (typeof membershipData)[number]
  >[];

  // Fetch public leagues user is NOT a member of
  const memberLeagueIds = validMemberships.map((m) => m.league.id);
  const { data: publicLeagues } = await supabase
    .from("leagues")
    .select("id, name, slug, competition_id, competitions ( name )")
    .eq("is_public", true)
    .not("id", "in", memberLeagueIds.length > 0 ? `(${memberLeagueIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
    .limit(3);

  const isAdmin = profile?.role === "admin";
  const greeting = getGreeting();

  return (
    <div>
      <PageHeader
        label="Dashboard"
        title={`Good ${greeting}, ${profile?.display_name ?? "there"}`}
        subtitle="Your league overview for today."
      />

      {/* My Leagues */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-display font-bold text-lg"
            style={{ color: "var(--lmx-text)" }}
          >
            My Leagues
          </h2>
          <Link
            href="/leagues/create"
            className="text-xs font-display uppercase tracking-wider"
            style={{ color: "var(--lmx-green)" }}
          >
            + Create
          </Link>
        </div>

        {validMemberships.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p
              className="font-display font-bold text-lg mb-2"
              style={{ color: "var(--lmx-text)" }}
            >
              No leagues yet
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--lmx-text-muted)" }}>
              Join one with an invite code or create your own.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/leagues/create"
                className="px-5 py-2 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
                style={{
                  background: "var(--lmx-green)",
                  color: "var(--lmx-surface)",
                }}
              >
                Create a League
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {validMemberships.map(
              ({ membership, league, gameweek, pick, survivingCount }) => (
                <Link
                  key={membership.id}
                  href={`/leagues/${league.slug}`}
                  className="glass-card rounded-xl p-5 flex flex-col gap-3 hover:no-underline"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className="font-display font-bold text-base"
                        style={{ color: "var(--lmx-text)" }}
                      >
                        {league.name}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--lmx-text-muted)" }}
                      >
                        {(league.competitions as unknown as { name: string } | null)?.name ?? "\u2014"}
                      </p>
                    </div>
                    {membership.is_eliminated && (
                      <StatusBadge status="eliminated" />
                    )}
                  </div>

                  {gameweek ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs"
                          style={{ color: "var(--lmx-text-muted)" }}
                        >
                          {gameweek.name}
                        </span>
                        <StatusBadge
                          status={
                            gameweek.status as
                              | "open"
                              | "locked"
                              | "draft"
                              | "processing"
                              | "complete"
                          }
                        />
                      </div>
                      {!membership.is_eliminated && (
                        <div>
                          {pick ? (
                            <span
                              className="text-xs font-display font-medium"
                              style={{ color: "var(--lmx-green)" }}
                            >
                              Pick submitted
                            </span>
                          ) : gameweek.status === "open" ? (
                            <span
                              className="text-xs font-display font-medium"
                              style={{ color: "var(--lmx-amber)" }}
                            >
                              Pick needed
                            </span>
                          ) : (
                            <span
                              className="text-xs"
                              style={{ color: "var(--lmx-text-muted)" }}
                            >
                              No pick submitted
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                      No active gameweek
                    </p>
                  )}

                  <div
                    className="flex items-center gap-1 pt-1 text-xs border-t"
                    style={{
                      borderColor: "var(--lmx-surface-edge)",
                      color: "var(--lmx-text-muted)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--lmx-green)",
                        display: "inline-block",
                      }}
                    />
                    {survivingCount} surviving
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </section>

      {/* Discover Leagues */}
      {(publicLeagues ?? []).length > 0 && (
        <section className="mb-10">
          <h2
            className="font-display font-bold text-lg mb-4"
            style={{ color: "var(--lmx-text)" }}
          >
            Discover Leagues
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(publicLeagues ?? []).map((league) => (
              <div key={league.id} className="glass-card rounded-xl p-5 flex flex-col gap-3">
                <div>
                  <p
                    className="font-display font-bold text-base"
                    style={{ color: "var(--lmx-text)" }}
                  >
                    {league.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--lmx-text-muted)" }}
                  >
                    {(league.competitions as unknown as { name: string } | null)?.name ?? "\u2014"}
                  </p>
                </div>
                <Link
                  href={`/leagues/${league.slug}`}
                  className="mt-auto inline-block text-center px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    color: "var(--lmx-green)",
                    border: "1px solid rgba(16,185,129,0.3)",
                  }}
                >
                  View League
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Admin quick link */}
      {isAdmin && (
        <section>
          <h2
            className="font-display font-bold text-lg mb-4"
            style={{ color: "var(--lmx-text)" }}
          >
            Admin
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
              style={{
                background: "var(--lmx-surface-mid)",
                color: "var(--lmx-text)",
                border: "1px solid var(--lmx-surface-edge)",
              }}
            >
              Admin Panel
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
