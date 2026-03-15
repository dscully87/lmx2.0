const steps = [
  {
    number: "01",
    title: "Pick a Team",
    description:
      "Each gameweek, choose one team you think will win. Simple. One pick per round.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" stroke="#10B981" strokeWidth="2" />
        <path d="M16 8l2.5 5.5H24l-4.5 3.5 1.7 5.5L16 19l-5.2 3.5 1.7-5.5L8 13.5h5.5z" fill="#10B981" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Survive the Gameweek",
    description:
      "If your team wins, you survive. If they draw or lose — you're eliminated. No second chances.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Last One Standing Wins",
    description:
      "Keep surviving round after round. Every team can only be picked once. The last player standing takes the glory.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M8 4h16v14a8 8 0 01-16 0V4z" stroke="#34D399" strokeWidth="2" />
        <path d="M8 8H4v6a4 4 0 004 4M24 8h4v6a4 4 0 01-4 4" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 26v4M12 30h8" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4" style={{ background: "var(--lmx-surface)" }}>
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display font-bold text-3xl md:text-4xl text-center mb-4"
          style={{ color: "var(--lmx-text)" }}
        >
          How It Works
        </h2>
        <p className="text-center mb-16" style={{ color: "var(--lmx-text-muted)" }}>
          Three simple steps. One winner.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="glass-card rounded-xl p-8 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                {step.icon}
                <span
                  className="font-mono text-4xl font-bold opacity-20"
                  style={{ color: "var(--lmx-green)" }}
                >
                  {step.number}
                </span>
              </div>
              <h3
                className="font-display font-bold text-xl"
                style={{ color: "var(--lmx-text)" }}
              >
                {step.title}
              </h3>
              <p style={{ color: "var(--lmx-text-muted)" }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
