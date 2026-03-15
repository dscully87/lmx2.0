"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const VALUES = [
  {
    icon: "🎯",
    bg: "rgba(239,68,68,0.12)",
    title: "Designed around the drama",
    body: "Last-man-standing is tense by design. LMX leans into it — live survival counts, nail-biting deadlines, and a final showdown every gameweek.",
  },
  {
    icon: "⏱",
    bg: "rgba(16,185,129,0.12)",
    title: "Save hours every month",
    body: "No spreadsheets. No chasing WhatsApp confirmations. LMX automates fixture sync, pick deadlines, and elimination — zero admin.",
  },
  {
    icon: "🔗",
    bg: "rgba(16,185,129,0.12)",
    title: "Invite anyone in seconds",
    body: "Share a link. Players join, pick their team, and the platform handles everything — reminders, results, live standings.",
  },
  {
    icon: "⚡",
    bg: "rgba(245,158,11,0.12)",
    title: "Live results, zero effort",
    body: "Fixture data syncs automatically. When the whistle blows, picks are evaluated instantly — results are live the moment the match ends.",
  },
  {
    icon: "📊",
    bg: "rgba(245,158,11,0.12)",
    title: "Full transparency",
    body: "Every pick is logged, every elimination is auditable. No disputes. The platform is the source of truth — no arguments, just football.",
  },
  {
    icon: "🏆",
    bg: "rgba(16,185,129,0.12)",
    title: "Run multiple leagues",
    body: "LMX handles the heavy lifting so you can run Premier League, Champions League, and more — simultaneously, effortlessly.",
  },
];

export default function ValueCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % VALUES.length), 4000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="flex flex-col gap-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Card area — fixed height prevents layout shift */}
      <div className="relative" style={{ minHeight: "260px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="glass-card p-7 flex flex-col gap-4 absolute inset-0"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: VALUES[index].bg }}
            >
              {VALUES[index].icon}
            </div>
            <h3
              className="font-display font-bold text-lg leading-snug"
              style={{ color: "var(--lmx-text)" }}
            >
              {VALUES[index].title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--lmx-text-muted)" }}
            >
              {VALUES[index].body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot / pill navigation */}
      <div className="flex items-center gap-2">
        {VALUES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`View ${VALUES[i].title}`}
            style={{
              height: "4px",
              width: i === index ? "28px" : "8px",
              borderRadius: "2px",
              background:
                i === index ? "var(--lmx-green)" : "var(--lmx-surface-edge)",
              transition: "all 0.3s ease",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
