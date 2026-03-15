"use client";

import { useState } from "react";

interface TeamCrestProps {
  src: string;
  name: string;
  size?: number;
}

const FALLBACK_COLOURS = [
  "#10B981",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

function getColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLOURS[Math.abs(hash) % FALLBACK_COLOURS.length];
}

export function TeamCrest({ src, name, size = 32 }: TeamCrestProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const colour = getColour(name);
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: colour,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.35,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          color: "#0F172A",
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  );
}
