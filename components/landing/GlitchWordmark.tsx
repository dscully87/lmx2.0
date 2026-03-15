"use client";

import { useEffect, useState } from "react";

export default function GlitchWordmark() {
  const [active, setActive] = useState(true);

  // Auto-trigger on load for 1.2s, then stop. Re-trigger on hover.
  useEffect(() => {
    const timer = setTimeout(() => setActive(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <h1
      className={`glitch-text font-display font-bold select-none cursor-default ${
        active ? "glitch-active" : ""
      }`}
      data-text="LMX"
      style={{
        fontSize: "clamp(5rem, 18vw, 14rem)",
        lineHeight: 1,
        color: "var(--lmx-text)",
        letterSpacing: "-0.02em",
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      LMX
    </h1>
  );
}
