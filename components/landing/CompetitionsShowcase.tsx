const leagues = [
  "Premier League",
  "Championship",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Eredivisie",
  "League of Ireland",
];

export default function CompetitionsShowcase() {
  return (
    <section
      className="py-8 px-6 border-y overflow-hidden"
      style={{
        background: "var(--lmx-surface)",
        borderColor: "var(--lmx-surface-edge)",
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span
          className="text-xs uppercase tracking-[0.2em] font-display"
          style={{ color: "var(--lmx-text-muted)" }}
        >
          Supported leagues
        </span>
        {leagues.map((league) => (
          <span
            key={league}
            className="text-sm font-display"
            style={{ color: "var(--lmx-text-muted)", opacity: 0.7 }}
          >
            {league}
          </span>
        ))}
        <span
          className="text-sm font-display"
          style={{ color: "var(--lmx-text-muted)", opacity: 0.5 }}
        >
          + more
        </span>
      </div>
    </section>
  );
}
