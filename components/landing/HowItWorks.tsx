const SURVIVOR_ROWS = [
  { label: "Kick-off", aliveCount: 16, aliveIndices: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
  { label: "Week 4", aliveCount: 9, aliveIndices: [0,1,3,5,6,8,9,11,14] },
  { label: "Final week", aliveCount: 1, aliveIndices: [8] },
];

function SurvivalFunnel() {
  return (
    <div
      className="flex flex-col items-center gap-5 mb-16 py-8 px-6 rounded-2xl"
      style={{ background: "rgba(15,23,42,0.7)", border: "1px solid var(--lmx-surface-edge)" }}
    >
      <p
        className="text-xs tracking-[0.3em] uppercase font-display"
        style={{ color: "var(--lmx-text-muted)" }}
      >
        The brutal maths
      </p>
      <div className="flex flex-col items-center gap-3">
        {SURVIVOR_ROWS.map((row, rowIndex) => {
          const isFinal = rowIndex === SURVIVOR_ROWS.length - 1;
          return (
            <div key={row.label} className="flex flex-col items-center gap-2">
              <div className="flex gap-1.5 flex-wrap justify-center" style={{ maxWidth: "220px" }}>
                {Array.from({ length: 16 }).map((_, i) => {
                  const alive = row.aliveIndices.includes(i);
                  return (
                    <div
                      key={i}
                      className={alive && isFinal ? "live-dot-green" : alive ? undefined : "live-dot-red"}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: alive
                          ? isFinal
                            ? "var(--lmx-green-bright)"
                            : "var(--lmx-green)"
                          : "var(--lmx-red)",
                        opacity: alive ? 1 : 0.3,
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--lmx-text-muted)",
                }}
              >
                {row.label} —{" "}
                <span
                  style={{
                    color: isFinal
                      ? "var(--lmx-green-bright)"
                      : row.aliveCount < 16
                      ? "var(--lmx-text)"
                      : "var(--lmx-text-muted)",
                  }}
                >
                  {row.aliveCount}
                </span>{" "}
                {row.aliveCount === 1 ? "survivor" : "alive"}
              </span>
              {rowIndex < SURVIVOR_ROWS.length - 1 && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M7 2v10M3 8l4 4 4-4"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Burn a Bridge",
    description:
      "Choose one team to win this gameweek. Sounds simple — until you remember you can only use each team once all season. Choose wisely. You can't go back.",
    accent: "var(--lmx-green)",
    cardClass: "glass-card",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" stroke="#10B981" strokeWidth="2" />
        <path d="M16 8l2.5 5.5H24l-4.5 3.5 1.7 5.5L16 19l-5.2 3.5 1.7-5.5L8 13.5h5.5z" fill="#10B981" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Pray for the Clean Sheet",
    description:
      "Win and you're through. Draw or lose — you're sent packing. It doesn't matter that it was a last-minute pen. It doesn't matter that the ref was blind. You're still out.",
    accent: "var(--lmx-red)",
    cardClass: "glass-card-red",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 10l12 12M22 10L10 22" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Claim the Bragging Rights",
    description:
      "Keep surviving round after round until everyone else has been knocked out. The group chat is yours. The glory is yours. Don't blow it.",
    accent: "var(--lmx-green-bright)",
    cardClass: "glass-card",
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
        <p className="text-center mb-12" style={{ color: "var(--lmx-text-muted)" }}>
          Brutal by design. Three steps. One survivor.
        </p>

        <SurvivalFunnel />

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`${step.cardClass} rounded-xl p-8 flex flex-col gap-4`}
            >
              <div className="flex items-start justify-between">
                {step.icon}
                <span
                  className="font-bold opacity-25"
                  style={{
                    fontFamily: "var(--font-stadium)",
                    fontSize: "3rem",
                    lineHeight: 1,
                    color: step.accent,
                  }}
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
