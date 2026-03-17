import Link from "next/link";
import HowItWorks from "@/components/landing/HowItWorks";
import CompetitionsShowcase from "@/components/landing/CompetitionsShowcase";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex flex-col scan-lines overflow-hidden"
        style={{ background: "var(--lmx-surface)" }}
      >
        {/* Noise texture */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>

        {/* Pitch SVG overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
          viewBox="0 0 800 600"
          fill="none"
          aria-hidden="true"
        >
          <rect x="40" y="40" width="720" height="520" stroke="#22C55E" strokeWidth="2" />
          <circle cx="400" cy="300" r="80" stroke="#22C55E" strokeWidth="2" />
          <circle cx="400" cy="300" r="4" fill="#22C55E" />
          <line x1="400" y1="40" x2="400" y2="560" stroke="#22C55E" strokeWidth="2" />
          <rect x="40" y="190" width="120" height="220" stroke="#22C55E" strokeWidth="2" />
          <rect x="640" y="190" width="120" height="220" stroke="#22C55E" strokeWidth="2" />
          <rect x="40" y="255" width="40" height="90" stroke="#22C55E" strokeWidth="2" />
          <rect x="720" y="255" width="40" height="90" stroke="#22C55E" strokeWidth="2" />
        </svg>

        {/* Soft radial glow */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 70% 20%, rgba(250,204,21,0.06) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        {/* ── Top nav bar ── */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 pt-6 pb-2">
          <span
            className="font-display font-bold"
            style={{
              fontSize: "1.5rem",
              color: "var(--lmx-yellow)",
              letterSpacing: "-0.02em",
            }}
          >
            LMX
          </span>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-display hover:opacity-80 transition-opacity"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-md text-sm font-display font-bold transition-all hover:opacity-90"
              style={{ background: "var(--lmx-yellow)", color: "var(--lmx-surface)" }}
            >
              Sign up
            </Link>
          </div>
        </nav>

        {/* ── Centred hero content ── */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
          <h1
            style={{
              fontFamily: "var(--font-stadium)",
              fontSize: "clamp(3.5rem, 10vw, 8rem)",
              lineHeight: 0.9,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: "var(--lmx-text)" }}>Last Man Standing,</span>
            <br />
            <span
              style={{
                background:
                  "linear-gradient(125deg, #FACC15 0%, #FDE047 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Automated.
            </span>
          </h1>

          <p
            className="mt-6 text-lg md:text-xl font-display max-w-xl"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            Stop chasing picks in WhatsApp. Create a league in 60 seconds and let LMX handle the spreadsheets, deadlines, and results.
          </p>

          <Link
            href="/signup"
            className="mt-8 px-10 py-4 rounded-lg font-display font-bold text-base transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
            style={{ background: "var(--lmx-yellow)", color: "var(--lmx-surface)" }}
          >
            Start a League (Free)
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-20 flex flex-col items-center pb-8 opacity-40">
          <svg
            width="16"
            height="24"
            viewBox="0 0 16 24"
            fill="none"
            className="animate-bounce"
          >
            <path
              d="M8 4v16M2 14l6 6 6-6"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* ── Section 2: The "Why" — 3 Icon Grid ── */}
      <section className="py-20 px-6" style={{ background: "var(--lmx-surface)" }}>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "\u26A1",
              title: "Invite",
              body: "Share a link, mates join in seconds.",
              accent: "var(--lmx-yellow)",
              bg: "rgba(250,204,21,0.1)",
            },
            {
              icon: "\uD83E\uDD16",
              title: "Automate",
              body: "Live fixture sync & auto-eliminations.",
              accent: "var(--lmx-green)",
              bg: "rgba(34,197,94,0.1)",
            },
            {
              icon: "\uD83C\uDFC6",
              title: "Archive",
              body: "Full pick history. No more \u201Cwho-picked-who\u201D rows.",
              accent: "var(--lmx-yellow)",
              bg: "rgba(250,204,21,0.1)",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass-card rounded-xl p-8 flex flex-col items-center text-center gap-3"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: card.bg }}
              >
                {card.icon}
              </div>
              <h3
                className="font-display font-bold text-lg"
                style={{ color: card.accent }}
              >
                {card.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: The Proof — Survival Funnel ── */}
      <HowItWorks />

      {/* ── Supported Leagues Marquee ── */}
      <CompetitionsShowcase />

      {/* ── Section 4: Footer with Spreadsheet CTA ── */}
      <footer
        className="py-10 px-6 border-t"
        style={{
          borderColor: "var(--lmx-surface-edge)",
          background: "var(--lmx-surface)",
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Spreadsheet upsell */}
          <div
            className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10"
          >
            <p className="text-sm font-display" style={{ color: "var(--lmx-text-muted)" }}>
              Already mid-season?
            </p>
            <Link
              href="/tools/spreadsheet"
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm border transition-all hover:opacity-90"
              style={{ borderColor: "var(--lmx-yellow)", color: "var(--lmx-yellow)" }}
            >
              Upload Spreadsheet
            </Link>
            <p className="text-xs" style={{ color: "var(--lmx-text-muted)", opacity: 0.7 }}>
              We&apos;ll generate your standings instantly.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span
              className="font-display font-bold text-lg"
              style={{ color: "var(--lmx-yellow)" }}
            >
              LMX
            </span>
            <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              &copy; {new Date().getFullYear()} LMX. Last Man eXperience.
            </p>
            <div className="flex gap-6 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              <Link href="/roadmap" className="hover:opacity-80 transition-opacity">
                Roadmap
              </Link>
              <Link href="/login" className="hover:opacity-80 transition-opacity">
                Login
              </Link>
              <Link href="/signup" className="hover:opacity-80 transition-opacity">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
