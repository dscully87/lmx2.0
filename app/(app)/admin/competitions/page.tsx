"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";

interface DbCompetition {
  id: string;
  api_id: string;
  name: string;
  code: string;
  country: string;
  emblem_url: string | null;
}

interface ApiCompetition {
  apiId: string;
  name: string;
  code: string;
  country: string;
  emblem: string;
}

export default function AdminCompetitionsPage() {
  const [dbCompetitions, setDbCompetitions] = useState<DbCompetition[]>([]);
  const [apiCompetitions, setApiCompetitions] = useState<ApiCompetition[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDbCompetitions();
  }, []);

  async function fetchDbCompetitions() {
    setLoadingDb(true);
    try {
      const res = await fetch("/api/admin/competitions");
      const data = await res.json() as { competitions?: DbCompetition[] };
      setDbCompetitions(data.competitions ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingDb(false);
    }
  }

  async function fetchApiCompetitions() {
    setLoadingApi(true);
    setApiError(null);
    setApiKeyMissing(false);

    try {
      const res = await fetch("/api/admin/competitions/available");
      const data = await res.json() as {
        competitions?: ApiCompetition[];
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (data.error === "API_KEY_MISSING") {
          setApiKeyMissing(true);
        } else {
          setApiError(data.message ?? "Failed to fetch from API.");
        }
        return;
      }

      setApiCompetitions(data.competitions ?? []);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoadingApi(false);
    }
  }

  async function addCompetition(comp: ApiCompetition) {
    setAddingIds((prev) => new Set(prev).add(comp.apiId));

    try {
      const res = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_id: comp.apiId,
          name: comp.name,
          code: comp.code,
          country: comp.country,
          emblem_url: comp.emblem,
        }),
      });

      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(comp.apiId));
        await fetchDbCompetitions();
      }
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(comp.apiId);
        return next;
      });
    }
  }

  const dbApiIds = new Set(dbCompetitions.map((c) => c.api_id));

  return (
    <div>
      <PageHeader label="Admin" title="Competitions" />

      {/* Synced Competitions */}
      <section className="mb-10">
        <h2
          className="font-display font-bold text-lg mb-4"
          style={{ color: "var(--lmx-text)" }}
        >
          Synced Competitions
        </h2>

        {loadingDb ? (
          <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
            Loading…
          </p>
        ) : dbCompetitions.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              No competitions synced yet. Use the section below to add them from the API.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
                  {["", "Name", "Code", "Country"].map((h) => (
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
                {dbCompetitions.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}
                  >
                    <td className="px-4 py-3">
                      {c.emblem_url ? (
                        <img
                          src={c.emblem_url}
                          alt={c.name}
                          width={28}
                          height={28}
                          crossOrigin="anonymous"
                          style={{ width: 28, height: 28, objectFit: "contain" }}
                        />
                      ) : (
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                        >
                          {c.code?.[0] ?? "?"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-display font-medium" style={{ color: "var(--lmx-text)" }}>
                      {c.name}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: "var(--lmx-text-muted)", fontFamily: "var(--font-mono)" }}
                    >
                      {c.code}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                      {c.country}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add from API */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-display font-bold text-lg"
            style={{ color: "var(--lmx-text)" }}
          >
            Add from API
          </h2>
          <button
            type="button"
            onClick={fetchApiCompetitions}
            disabled={loadingApi}
            className="px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
          >
            {loadingApi ? "Fetching…" : "Fetch from football-data.org"}
          </button>
        </div>

        {apiKeyMissing && (
          <div
            className="rounded-xl px-5 py-4 mb-4 flex items-start gap-3"
            style={{
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <span style={{ color: "var(--lmx-amber)", fontSize: 18 }}>⚠</span>
            <div>
              <p className="text-sm font-display font-bold mb-1" style={{ color: "var(--lmx-amber)" }}>
                API Key Missing
              </p>
              <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
                Set <code className="font-mono px-1" style={{ fontFamily: "var(--font-mono)" }}>FOOTBALL_DATA_API_KEY</code> in{" "}
                <code className="font-mono px-1" style={{ fontFamily: "var(--font-mono)" }}>.env.local</code> to enable this feature.
              </p>
            </div>
          </div>
        )}

        {apiError && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm"
            style={{
              color: "var(--lmx-red)",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {apiError}
          </div>
        )}

        {apiCompetitions.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}>
                  {["", "Name", "Code", "Country", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2.5 text-left text-xs font-display uppercase tracking-wider"
                      style={{ color: "var(--lmx-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiCompetitions.map((c) => {
                  const alreadyAdded = dbApiIds.has(c.apiId) || addedIds.has(c.apiId);
                  const isAdding = addingIds.has(c.apiId);

                  return (
                    <tr
                      key={c.apiId}
                      style={{
                        borderBottom: "1px solid var(--lmx-surface-edge)",
                        opacity: alreadyAdded ? 0.5 : 1,
                      }}
                    >
                      <td className="px-4 py-3">
                        {c.emblem ? (
                          <img
                            src={c.emblem}
                            alt={c.name}
                            width={28}
                            height={28}
                            crossOrigin="anonymous"
                            style={{ width: 28, height: 28, objectFit: "contain" }}
                          />
                        ) : (
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                            style={{ background: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                          >
                            {c.code?.[0] ?? "?"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-display font-medium" style={{ color: "var(--lmx-text)" }}>
                        {c.name}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs"
                        style={{ color: "var(--lmx-text-muted)", fontFamily: "var(--font-mono)" }}
                      >
                        {c.code}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                        {c.country}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {alreadyAdded ? (
                          <span className="text-xs" style={{ color: "var(--lmx-green)" }}>
                            ✓ Added
                          </span>
                        ) : confirmingId === c.apiId ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>Add {c.name}?</span>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(null)}
                              className="px-2 py-1 rounded text-xs border font-display"
                              style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConfirmingId(null); addCompetition(c); }}
                              disabled={isAdding}
                              className="px-3 py-1 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
                            >
                              {isAdding ? "Adding…" : "Confirm"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(c.apiId)}
                            className="px-3 py-1 rounded-lg font-display font-bold text-xs transition-all hover:opacity-90"
                            style={{ background: "var(--lmx-surface-edge)", color: "var(--lmx-text)" }}
                          >
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
