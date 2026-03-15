const competitions = [
  { name: "Premier League", country: "England" },
  { name: "Championship", country: "England" },
  { name: "League of Ireland", country: "Ireland" },
  { name: "Bundesliga", country: "Germany" },
  { name: "La Liga", country: "Spain" },
  { name: "Serie A", country: "Italy" },
  { name: "Ligue 1", country: "France" },
  { name: "Eredivisie", country: "Netherlands" },
];

export default function CompetitionsShowcase() {
  return (
    <section
      className="py-24 px-4"
      style={{ background: "var(--lmx-surface-mid)" }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display font-bold text-3xl md:text-4xl text-center mb-4"
          style={{ color: "var(--lmx-text)" }}
        >
          Any League. Any Competition.
        </h2>
        <p className="text-center mb-16" style={{ color: "var(--lmx-text-muted)" }}>
          Run your league across any competition supported by our football data provider.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {competitions.map((comp) => (
            <div
              key={comp.name}
              className="glass-card rounded-lg p-4 text-center"
            >
              <p
                className="font-display font-medium text-sm"
                style={{ color: "var(--lmx-text)" }}
              >
                {comp.name}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--lmx-text-muted)" }}
              >
                {comp.country}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
          ...and many more. If the API supports it, LMX supports it.
        </p>
      </div>
    </section>
  );
}
