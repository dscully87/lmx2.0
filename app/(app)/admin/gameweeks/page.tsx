import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";

export default async function AdminGameweeksPage() {
  const supabase = await createClient();

  const { data: gameweeks } = await supabase
    .from("gameweeks")
    .select("id, name, number, status, cutoff_at, closes_at, competition_id, competitions(name)")
    .order("competition_id", { ascending: true })
    .order("number", { ascending: true });

  return (
    <div>
      <PageHeader
        label="Admin"
        title="Gameweeks"
        action={
          <Link
            href="/admin/gameweeks/create"
            className="px-5 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
          >
            + Create Gameweek
          </Link>
        }
      />

      {(!gameweeks || gameweeks.length === 0) ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="font-display font-bold text-lg mb-2" style={{ color: "var(--lmx-text)" }}>
            No gameweeks yet
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--lmx-text-muted)" }}>
            Create your first gameweek to get started.
          </p>
          <Link
            href="/admin/gameweeks/create"
            className="inline-block px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
          >
            Create Gameweek →
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
                {["Competition", "Name", "GW#", "Status", "Cutoff", "Closes"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider"
                    style={{ color: "var(--lmx-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gameweeks.map((gw) => {
                const comp = gw.competitions as unknown as { name: string } | null;
                return (
                  <tr
                    key={gw.id}
                    style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                      {comp?.name ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 font-display font-medium"
                      style={{ color: "var(--lmx-text)" }}
                    >
                      {gw.name}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: "var(--lmx-text-muted)", fontFamily: "var(--font-mono)" }}
                    >
                      {gw.number}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={gw.status as "open" | "locked" | "draft" | "processing" | "complete"}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                      {new Date(gw.cutoff_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                      {new Date(gw.closes_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
