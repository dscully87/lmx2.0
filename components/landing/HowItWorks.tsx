const SURVIVOR_ROWS = [
  { label: "Kick-off", aliveCount: 16, aliveIndices: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
  { label: "Week 4", aliveCount: 9, aliveIndices: [0,1,3,5,6,8,9,11,14] },
  { label: "Final week", aliveCount: 1, aliveIndices: [8] },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-6" style={{ background: "var(--lmx-surface-mid)" }}>
      <div className="max-w-md mx-auto flex flex-col items-center gap-6">
        <h2
          className="font-display font-bold text-2xl text-center"
          style={{ color: "var(--lmx-yellow)" }}
        >
          16 Start. 1 Survives.
        </h2>

        <div className="flex flex-col items-center gap-3 w-full">
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
    </section>
  );
}
