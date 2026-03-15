type Status =
  | "draft"
  | "open"
  | "locked"
  | "processing"
  | "complete"
  | "pending"
  | "survived"
  | "eliminated"
  | "auto"
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

const STATUS_STYLES: Record<Status, { bg: string; color: string }> = {
  open: { bg: "rgba(16,185,129,0.15)", color: "#10B981" },
  survived: { bg: "rgba(16,185,129,0.15)", color: "#10B981" },
  live: { bg: "rgba(16,185,129,0.15)", color: "#10B981" },
  locked: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  pending: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  scheduled: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  eliminated: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
  cancelled: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
  draft: { bg: "rgba(51,65,85,0.5)", color: "#94A3B8" },
  complete: { bg: "rgba(51,65,85,0.5)", color: "#94A3B8" },
  finished: { bg: "rgba(51,65,85,0.5)", color: "#94A3B8" },
  postponed: { bg: "rgba(51,65,85,0.5)", color: "#94A3B8" },
  processing: { bg: "rgba(51,65,85,0.5)", color: "#94A3B8" },
  auto: { bg: "rgba(51,65,85,0.5)", color: "#94A3B8" },
};

export function StatusBadge({ status }: { status: Status }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-display font-medium uppercase tracking-wider"
      style={{ background: styles.bg, color: styles.color }}
    >
      {status}
    </span>
  );
}
