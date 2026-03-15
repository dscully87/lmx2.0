"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  target: string;
  className?: string;
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return { d, h, m, s, totalMs: diff };
}

export function Countdown({ target, className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!timeLeft) {
    return (
      <span
        className={className}
        style={{ color: "var(--lmx-red)", fontFamily: "var(--font-mono)" }}
      >
        Pick window closed
      </span>
    );
  }

  const { d, h, m, s, totalMs } = timeLeft;

  let colour = "var(--lmx-text)";
  if (totalMs < 30 * 60 * 1000) {
    colour = "var(--lmx-red)";
  } else if (totalMs < 2 * 60 * 60 * 1000) {
    colour = "var(--lmx-amber)";
  }

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  parts.push(`${h}h`);
  parts.push(`${m}m`);
  parts.push(`${s}s`);

  return (
    <span
      className={className}
      style={{ color: colour, fontFamily: "var(--font-mono)" }}
    >
      {parts.join(" ")}
    </span>
  );
}
