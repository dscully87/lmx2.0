import React from "react";

interface PageHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ label, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        {label && (
          <p
            className="text-xs uppercase tracking-widest font-display mb-2"
            style={{ color: "var(--lmx-green)" }}
          >
            {label}
          </p>
        )}
        <h1
          className="font-display font-bold text-2xl md:text-3xl"
          style={{ color: "var(--lmx-text)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
