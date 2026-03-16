import Link from "next/link";
import ValueCarousel from "@/components/landing/ValueCarousel";
import HowItWorks from "@/components/landing/HowItWorks";
import CompetitionsShowcase from "@/components/landing/CompetitionsShowcase";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col scan-lines overflow-hidden"
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
          <rect x="40" y="40" width="720" height="520" stroke="#34D399" strokeWidth="2" />
          <circle cx="400" cy="300" r="80" stroke="#34D399" strokeWidth="2" />
          <circle cx="400" cy="300" r="4" fill="#34D399" />
          <line x1="400" y1="40" x2="400" y2="560" stroke="#34D399" strokeWidth="2" />
          <rect x="40" y="190" width="120" height="220" stroke="#34D399" strokeWidth="2" />
          <rect x="640" y="190" width="120" height="220" stroke="#34D399" strokeWidth="2" />
          <rect x="40" y="255" width="40" height="90" stroke="#34D399" strokeWidth="2" />
          <rect x="720" y="255" width="40" height="90" stroke="#34D399" strokeWidth="2" />
        </svg>

        {/* Soft green radial glow */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 70% 20%, rgba(16,185,129,0.09) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        {/* ── Top nav bar ── */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <span
              className="font-display font-bold"
              style={{
                fontSize: "1.5rem",
                color: "var(--lmx-green)",
                letterSpacing: "-0.02em",
              }}
            >
              LMX
            </span>
            <span
              className="hidden sm:block text-xs tracking-[0.25em] uppercase font-display"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Last Man eXperience
            </span>
          </div>

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
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              Sign up
            </Link>
          </div>
        </nav>

        {/* ── Main split layout ── */}
        <div className="relative z-20 flex-1 flex flex-col md:flex-row items-center gap-10 lg:gap-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto w-full py-10 md:py-0">

          {/* Left: Last Man Standing */}
          <div className="flex flex-col gap-6 flex-1 max-w-2xl">
            <p
              className="text-xs tracking-[0.35em] uppercase font-display font-semibold"
              style={{ color: "var(--lmx-green)" }}
            >
              The Ultimate Survival Game for Your Mates
            </p>

            <h1
              style={{
                fontFamily: "var(--font-stadium)",
                fontSize: "clamp(4rem, 10vw, 8.5rem)",
                lineHeight: 0.88,
                letterSpacing: "0.02em",
              }}
            >
              <span style={{ color: "var(--lmx-text)" }}>Last Man</span>
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(125deg, #34D399 0%, #10B981 55%, #059669 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Standing
              </span>
            </h1>

            <p
              className="text-lg font-display font-medium"
              style={{ color: "var(--lmx-text)" }}
            >
              It&apos;s the simplest game in the world — until you&apos;ve already used City and Arsenal and you&apos;re forced to pin your hopes on Everton away at Anfield.
            </p>

            <p
              className="text-base leading-relaxed max-w-md"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Sweat through the 90th minute while your mate&apos;s &quot;banker&quot; pick hits the post. One lapse in judgment and you&apos;re done. Run a league with your mates and let LMX handle everything — picks, deadlines, results, who got sent packing.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-lg font-display font-bold text-sm transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 text-center"
                style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
              >
                Start a League (and take your mates&apos; money)
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-3.5 rounded-lg font-display font-bold text-sm border transition-all duration-200 text-center"
                style={{
                  borderColor: "var(--lmx-surface-edge)",
                  color: "var(--lmx-text)",
                }}
              >
                How it works
              </a>
            </div>
          </div>

          {/* Right: Value carousel */}
          <div className="w-full md:w-[400px] lg:w-[440px] flex-shrink-0">
            <p
              className="text-xs tracking-[0.3em] uppercase font-display mb-4"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              Why it works
            </p>
            <ValueCarousel />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-20 flex flex-col items-center pb-8 opacity-40">
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            Scroll
          </span>
          <svg
            width="16"
            height="24"
            viewBox="0 0 16 24"
            fill="none"
            className="animate-bounce mt-1"
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

      {/* How it works */}
      <HowItWorks />

      {/* Death Toll Counter */}
      <section
        className="py-16 px-4 border-y"
        style={{
          background: "var(--lmx-surface)",
          borderColor: "var(--lmx-surface-edge)",
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.3em] font-display mb-8"
            style={{ color: "var(--lmx-text-muted)" }}
          >
            Example league · Season 1
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <div className="flex flex-col items-center gap-1.5">
              <span
                style={{
                  fontFamily: "var(--font-stadium)",
                  fontSize: "clamp(3rem, 8vw, 5rem)",
                  lineHeight: 1,
                  color: "var(--lmx-text)",
                }}
              >
                2,847
              </span>
              <span
                className="text-xs font-display uppercase tracking-widest"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                Players entered
              </span>
            </div>
            <div
              className="text-2xl opacity-20 rotate-90 sm:rotate-0"
              style={{ color: "var(--lmx-text)" }}
            >
              →
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span
                style={{
                  fontFamily: "var(--font-stadium)",
                  fontSize: "clamp(3rem, 8vw, 5rem)",
                  lineHeight: 1,
                  color: "var(--lmx-red)",
                }}
              >
                2,814
              </span>
              <span
                className="text-xs font-display uppercase tracking-widest"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                Sent packing
              </span>
            </div>
            <div
              className="text-2xl opacity-20 rotate-90 sm:rotate-0"
              style={{ color: "var(--lmx-text)" }}
            >
              →
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span
                style={{
                  fontFamily: "var(--font-stadium)",
                  fontSize: "clamp(3rem, 8vw, 5rem)",
                  lineHeight: 1,
                  color: "var(--lmx-green-bright)",
                  textShadow: "0 0 20px rgba(52,211,153,0.6)",
                }}
              >
                33
              </span>
              <span
                className="text-xs font-display uppercase tracking-widest"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                Still standing
              </span>
            </div>
          </div>
          <p className="mt-8 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            Your league. Your numbers. Your shot at being the last one left.
          </p>
        </div>
      </section>

      {/* Competitions showcase */}
      <CompetitionsShowcase />

      {/* Spreadsheet tool teaser */}
      <section className="py-16 px-4" style={{ background: "var(--lmx-surface)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-lg">
            <p
              className="text-xs uppercase tracking-[0.3em] font-display"
              style={{ color: "var(--lmx-amber)" }}
            >
              Free tool
            </p>
            <h2
              className="font-display font-bold text-2xl md:text-3xl"
              style={{ color: "var(--lmx-text)" }}
            >
              Still chasing your mates for picks on a Friday night?
            </h2>
            <p className="text-base" style={{ color: "var(--lmx-text-muted)" }}>
              Delete that messy Excel sheet and let us do the heavy lifting. Upload your existing spreadsheet for an instant standings report — pick history, elimination timeline, the lot. No account needed. Or just start fresh and never touch a spreadsheet again.
            </p>
          </div>
          <Link
            href="/tools/spreadsheet"
            className="flex-shrink-0 px-7 py-3 rounded-lg font-display font-bold text-sm border transition-all hover:border-lmx-amber"
            style={{ borderColor: "var(--lmx-amber)", color: "var(--lmx-amber)" }}
          >
            Try the free tool →
          </Link>
        </div>
      </section>

      {/* Manager CTA */}
      <section className="py-24 px-4" style={{ background: "var(--lmx-surface-mid)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="font-display font-bold text-3xl md:text-4xl"
            style={{ color: "var(--lmx-text)" }}
          >
            Running a league with your mates?
          </h2>
          <p className="mt-4 text-lg" style={{ color: "var(--lmx-text-muted)" }}>
            Create a league in under 5 minutes. Fixture data pulls in automatically. Set a deadline, share a link, and watch your mates agonise over their picks every single gameweek.
          </p>
          <p className="mt-3 text-sm" style={{ color: "var(--lmx-text-muted)", opacity: 0.6 }}>
            Built by people who got knocked out in Week 2 because of a VAR decision.
          </p>
          <Link
            href="/signup?role=manager"
            className="mt-8 inline-block px-8 py-3 rounded-lg font-display font-bold text-base transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--lmx-amber)", color: "var(--lmx-surface)" }}
          >
            Start a League (it&apos;s free)
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-4 border-t"
        style={{
          borderColor: "var(--lmx-surface-edge)",
          background: "var(--lmx-surface)",
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="font-display font-bold text-lg"
            style={{ color: "var(--lmx-green)" }}
          >
            LMX
          </span>
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            © {new Date().getFullYear()} LMX. Last Man eXperience.
          </p>
          <div className="flex gap-6 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            <Link href="/roadmap" className="hover:opacity-80 transition-opacity">
              Roadmap
            </Link>
            <Link
              href="/tools/spreadsheet"
              className="hover:opacity-80 transition-opacity"
            >
              Spreadsheet tool
            </Link>
            <Link href="/login" className="hover:opacity-80 transition-opacity">
              Login
            </Link>
            <Link href="/signup" className="hover:opacity-80 transition-opacity">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
