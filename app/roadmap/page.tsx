import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Roadmap — LMX",
  description: "See what's live, what's being built, and what's coming next for LMX.",
};

type Status = "live" | "building" | "soon" | "later";

type RoadmapItem = {
  title: string;
  description: string;
  icon: string;
};

type Phase = {
  label: string;
  status: Status;
  period: string;
  items: RoadmapItem[];
};

const STATUS_CONFIG: Record<Status, { badge: string; dot: string; border: string; bg: string }> = {
  live: {
    badge: "Live",
    dot: "var(--lmx-green)",
    border: "rgba(16,185,129,0.3)",
    bg: "rgba(16,185,129,0.06)",
  },
  building: {
    badge: "Building now",
    dot: "var(--lmx-amber)",
    border: "rgba(245,158,11,0.3)",
    bg: "rgba(245,158,11,0.06)",
  },
  soon: {
    badge: "Coming soon",
    dot: "#60A5FA",
    border: "rgba(96,165,250,0.3)",
    bg: "rgba(96,165,250,0.04)",
  },
  later: {
    badge: "On the horizon",
    dot: "var(--lmx-text-muted)",
    border: "var(--lmx-surface-edge)",
    bg: "transparent",
  },
};

const phases: Phase[] = [
  {
    label: "Foundation",
    status: "live",
    period: "Now",
    items: [
      {
        icon: "🏠",
        title: "Landing page & brand",
        description:
          "LMX is live with its core identity — glitch wordmark, value proposition, how it works, and competition showcase.",
      },
      {
        icon: "📊",
        title: "Free spreadsheet tool",
        description:
          "Download a pre-formatted XLSX template, track your league offline in Excel or Google Sheets, then upload it for an instant beautified report. No account needed.",
      },
    ],
  },
  {
    label: "Core Platform",
    status: "building",
    period: "Q2 2026",
    items: [
      {
        icon: "🔐",
        title: "Auth & onboarding",
        description:
          "Sign up as a manager or player, verify your email, and land in the right place first time. Magic-link login so nobody forgets their password.",
      },
      {
        icon: "🏆",
        title: "League creation",
        description:
          "Create a league in under 5 minutes. Choose a competition, set a gameweek window, configure rules, and get a shareable invite link. Your players join with one click.",
      },
      {
        icon: "✅",
        title: "Pick submission",
        description:
          "Players pick a team before the gameweek deadline. Picks are locked at cutoff, visible to the manager, and logged permanently. No disputes, no ambiguity.",
      },
      {
        icon: "💀",
        title: "Automatic eliminations",
        description:
          "The moment a result comes in, picks are evaluated and eliminations processed. No manual work for the manager — the platform handles it all.",
      },
      {
        icon: "📋",
        title: "Manager dashboard",
        description:
          "Full league overview: who's in, who's out, current gameweek status, pick deadline countdown, and a one-click view of every player's pick history.",
      },
      {
        icon: "🙋",
        title: "Player dashboard",
        description:
          "Every player gets their own view — survival status, teams already picked, current standings, and a clear prompt to make their pick before the deadline.",
      },
    ],
  },
  {
    label: "Automation & Polish",
    status: "soon",
    period: "Q3 2026",
    items: [
      {
        icon: "⚡",
        title: "Live fixture sync",
        description:
          "Fixtures and results pull in automatically from football-data.org. Gameweeks populate themselves. Results trigger eliminations the moment the final whistle blows.",
      },
      {
        icon: "🔔",
        title: "Pick deadline reminders",
        description:
          "Email nudges sent 24h and 2h before each gameweek locks. No player gets eliminated because they forgot to pick. Managers can configure when reminders go out.",
      },
      {
        icon: "🤖",
        title: "Auto-pick safety net",
        description:
          "Missed the deadline? LMX auto-assigns the most available team rather than eliminating a player for forgetting. Managers can toggle this per league.",
      },
      {
        icon: "🔗",
        title: "Join via link",
        description:
          "Players join a league directly from a shareable URL — no account required to preview. One-tap join after signing up.",
      },
      {
        icon: "📱",
        title: "Mobile-optimised experience",
        description:
          "The pick flow is designed for a phone. Clear deadline banner, one-tap team selection, instant confirmation. No pinching or zooming required.",
      },
    ],
  },
  {
    label: "Power Features",
    status: "later",
    period: "Q4 2026",
    items: [
      {
        icon: "🌍",
        title: "Multiple competitions simultaneously",
        description:
          "Run a Premier League league and a Champions League league at the same time, each with independent gameweeks, picks, and standings. Finally.",
      },
      {
        icon: "💰",
        title: "Prize pool tracking",
        description:
          "Log entry fees, track the pot, and auto-calculate payouts when the winner is determined. Built-in payment integrations to handle real money properly.",
      },
      {
        icon: "🚪",
        title: "Late joiner flow",
        description:
          "Let players join mid-season with configurable rules — delayed entry, reduced pick history, or a clean wildcard start. No more turning people away in Gameweek 4.",
      },
      {
        icon: "📈",
        title: "Stats & analytics",
        description:
          "Team pick popularity, form heatmaps, elimination risk scores, and survival probability. Data that makes the game more interesting without being overwhelming.",
      },
      {
        icon: "🎯",
        title: "Wildcard round",
        description:
          "Managers can configure a wildcard gameweek — eliminated players get one shot back in. A deliberate drama mechanism. Use it once, use it wisely.",
      },
      {
        icon: "🏅",
        title: "Public leaderboards",
        description:
          "A global LMX ranking of managers by leagues run, survival rates, and player retention. Bragging rights for the best-run leagues.",
      },
    ],
  },
  {
    label: "The Long Game",
    status: "later",
    period: "2027",
    items: [
      {
        icon: "📲",
        title: "Native mobile app",
        description:
          "iOS and Android apps with push notifications for deadline reminders, elimination alerts, and result updates. The full LMX experience in your pocket.",
      },
      {
        icon: "💬",
        title: "Banter mode",
        description:
          "Reactions to picks, comment threads per gameweek, and a league activity feed. The social layer that makes a group of mates feel like a proper competition.",
      },
      {
        icon: "🔁",
        title: "Season history & replays",
        description:
          "Full archived history of every season you've run. Replay the elimination timeline, see which gameweek ended it all, compare seasons side by side.",
      },
      {
        icon: "🔌",
        title: "API & webhooks",
        description:
          "For developers and power users. Receive real-time webhooks on picks, eliminations, and results. Build your own overlays, bots, or integrations on top of LMX.",
      },
    ],
  },
];

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wide"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.dot }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: cfg.dot,
          boxShadow: status === "live" ? `0 0 6px ${cfg.dot}` : undefined,
          animation: status === "building" ? "pulse 2s infinite" : undefined,
        }}
      />
      {cfg.badge}
    </span>
  );
}

export default function RoadmapPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--lmx-surface)" }}>
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--lmx-surface-edge)" }}>
        <Link href="/" className="font-display font-bold text-xl" style={{ color: "var(--lmx-green)" }}>
          LMX
        </Link>
        <div className="flex items-center gap-6 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
          <Link href="/tools/spreadsheet" className="hover:opacity-80 transition-opacity">Spreadsheet tool</Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
            style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden" style={{ background: "var(--lmx-surface-mid)" }}>
        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#34D399" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
          <StatusBadge status="building" />
          <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight" style={{ color: "var(--lmx-text)" }}>
            Where LMX<br />is headed
          </h1>
          <p className="text-base md:text-lg max-w-xl" style={{ color: "var(--lmx-text-muted)" }}>
            We&apos;re building in the open. Here&apos;s what&apos;s live, what&apos;s in progress,
            and the ideas we&apos;re most excited about. No promises on dates — just honest intent.
          </p>
        </div>
      </section>

      {/* Legend */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-2 flex flex-wrap gap-4">
        {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
            <span className="text-xs font-display uppercase tracking-widest" style={{ color: "var(--lmx-text-muted)" }}>
              {cfg.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-24">
        <div className="flex flex-col gap-16">
          {phases.map((phase) => {
            const cfg = STATUS_CONFIG[phase.status];
            return (
              <div key={phase.label} className="flex flex-col gap-6">
                {/* Phase header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <StatusBadge status={phase.status} />
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display font-bold text-xl" style={{ color: "var(--lmx-text)" }}>
                      {phase.label}
                    </h2>
                    <span className="text-sm font-display" style={{ color: "var(--lmx-text-muted)" }}>
                      {phase.period}
                    </span>
                  </div>
                  {/* Horizontal rule */}
                  <div className="flex-1 h-px hidden sm:block" style={{ background: cfg.border }} />
                </div>

                {/* Items grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phase.items.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl p-5 flex flex-col gap-3 transition-all"
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xl leading-none">{item.icon}</span>
                        {phase.status === "live" && (
                          <span
                            className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(16,185,129,0.15)", color: "var(--lmx-green)" }}
                          >
                            ✓ Live
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-base" style={{ color: "var(--lmx-text)" }}>
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--lmx-text-muted)" }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feedback CTA */}
      <section
        className="py-20 px-4 text-center"
        style={{ background: "var(--lmx-surface-mid)", borderTop: "1px solid var(--lmx-surface-edge)" }}
      >
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-4" style={{ color: "var(--lmx-text)" }}>
          Something missing?
        </h2>
        <p className="text-base max-w-md mx-auto mb-8" style={{ color: "var(--lmx-text-muted)" }}>
          We build for managers who run real leagues with real mates. If there&apos;s a feature
          that would make your life easier, we want to hear about it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:hello@lmx.gg"
            className="px-7 py-3 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
          >
            Share an idea
          </a>
          <Link
            href="/signup?role=manager"
            className="px-7 py-3 rounded-lg font-display font-bold text-sm border transition-all hover:opacity-80"
            style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text)" }}
          >
            Create a league
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t" style={{ borderColor: "var(--lmx-surface-edge)", background: "var(--lmx-surface)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg" style={{ color: "var(--lmx-green)" }}>LMX</span>
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            © {new Date().getFullYear()} LMX. Last Man eXperience.
          </p>
          <div className="flex gap-6 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
            <Link href="/tools/spreadsheet" className="hover:opacity-80 transition-opacity">Spreadsheet tool</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
