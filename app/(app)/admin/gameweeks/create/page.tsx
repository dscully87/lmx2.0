"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";

interface DbCompetition {
  id: string;
  api_id: string;
  name: string;
}

interface DbFixture {
  id: string;
  kickoff_at: string;
  home_team: { name: string; short_name: string } | null;
  away_team: { name: string; short_name: string } | null;
}

const STEPS = ["Competition", "Details", "Fixtures", "Dates", "Review"];

export default function CreateGameweekPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(0);

  // Step 1 — Competition
  const [competitions, setCompetitions] = useState<DbCompetition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState("");

  // Step 2 — Details
  const [gwName, setGwName] = useState("");
  const [gwNumber, setGwNumber] = useState(1);

  // Step 3 — Fixtures
  const [fixtures, setFixtures] = useState<DbFixture[]>([]);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set());
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  // Step 4 — Dates
  const [startsAt, setStartsAt] = useState("");
  const [cutoffAt, setCutoffAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [status, setStatus] = useState<"draft" | "open">("draft");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load competitions
  useEffect(() => {
    fetch("/api/admin/competitions")
      .then((r) => r.json())
      .then((d: { competitions?: DbCompetition[] }) => {
        setCompetitions(d.competitions ?? []);
        if (d.competitions && d.competitions.length > 0) {
          setSelectedCompId(d.competitions[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load fixtures when competition is selected
  async function loadFixtures(compId: string) {
    setLoadingFixtures(true);
    setFixtures([]);
    setSelectedFixtureIds(new Set());
    try {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `/api/admin/fixtures?competition_id=${compId}&from=${now}&to=${future}`
      );
      const data = await res.json() as { fixtures?: DbFixture[] };
      setFixtures(data.fixtures ?? []);
    } finally {
      setLoadingFixtures(false);
    }
  }

  // Load GW number suggestion when competition is selected
  async function loadGwNumber(compId: string) {
    const res = await fetch(`/api/admin/gameweeks/next-number?competition_id=${compId}`);
    const data = await res.json() as { number?: number };
    const num = data.number ?? 1;
    setGwNumber(num);
    setGwName(`Gameweek ${num}`);
  }

  async function handleCompetitionNext() {
    await Promise.all([loadFixtures(selectedCompId), loadGwNumber(selectedCompId)]);
    setStep(1);
  }

  function handleFixtureToggle(id: string) {
    setSelectedFixtureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFixturesNext() {
    // Auto-set dates from selected fixtures
    const selected = fixtures.filter((f) => selectedFixtureIds.has(f.id));
    if (selected.length > 0) {
      const kickoffs = selected.map((f) => new Date(f.kickoff_at).getTime()).sort();
      const earliest = new Date(kickoffs[0]);
      const latest = new Date(kickoffs[kickoffs.length - 1]);

      const cutoff = new Date(earliest.getTime() - 60 * 60 * 1000);
      const closes = new Date(latest.getTime() + 24 * 60 * 60 * 1000);
      const starts = new Date(earliest.getTime() - 7 * 24 * 60 * 60 * 1000);

      const toLocal = (d: Date) => {
        const s = d.toISOString().slice(0, 16);
        return s;
      };

      setStartsAt(toLocal(starts));
      setCutoffAt(toLocal(cutoff));
      setClosesAt(toLocal(closes));
    }
    setStep(3);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/gameweeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition_id: selectedCompId,
          name: gwName,
          number: gwNumber,
          starts_at: new Date(startsAt).toISOString(),
          cutoff_at: new Date(cutoffAt).toISOString(),
          closes_at: new Date(closesAt).toISOString(),
          status,
          fixture_ids: Array.from(selectedFixtureIds),
        }),
      });

      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create gameweek.");
        setSubmitting(false);
        return;
      }

      router.push("/admin/gameweeks");
    } catch {
      setError("Something went wrong.");
      setSubmitting(false);
    }
  }

  const selectedComp = competitions.find((c) => c.id === selectedCompId);
  const selectedFixtures = fixtures.filter((f) => selectedFixtureIds.has(f.id));

  return (
    <div className="max-w-2xl">
      <PageHeader label="Admin / Gameweeks" title="Create Gameweek" />

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
              style={{
                background:
                  i === step
                    ? "var(--lmx-green)"
                    : i < step
                    ? "rgba(16,185,129,0.2)"
                    : "var(--lmx-surface-edge)",
                color:
                  i === step
                    ? "var(--lmx-surface)"
                    : i < step
                    ? "var(--lmx-green)"
                    : "var(--lmx-text-muted)",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className="text-xs font-display hidden sm:block"
              style={{
                color: i === step ? "var(--lmx-text)" : "var(--lmx-text-muted)",
              }}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className="w-6 h-0.5"
                style={{
                  background: i < step ? "var(--lmx-green)" : "var(--lmx-surface-edge)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Competition */}
      {step === 0 && (
        <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
            Select Competition
          </h2>
          {competitions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              No competitions available. Add them in the Competitions section first.
            </p>
          ) : (
            <>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--lmx-surface)",
                  border: "1px solid var(--lmx-surface-edge)",
                  color: "var(--lmx-text)",
                }}
              >
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCompetitionNext}
                disabled={!selectedCompId}
                className="self-start px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
              >
                Next →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
            Gameweek Details
          </h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-display uppercase tracking-widest" style={{ color: "var(--lmx-text-muted)" }}>
              Gameweek Name
            </label>
            <input
              type="text"
              value={gwName}
              onChange={(e) => setGwName(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                background: "var(--lmx-surface)",
                border: "1px solid var(--lmx-surface-edge)",
                color: "var(--lmx-text)",
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-display uppercase tracking-widest" style={{ color: "var(--lmx-text-muted)" }}>
              Gameweek Number
            </label>
            <input
              type="number"
              value={gwNumber}
              onChange={(e) => setGwNumber(Number(e.target.value))}
              className="w-32 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                background: "var(--lmx-surface)",
                border: "1px solid var(--lmx-surface-edge)",
                color: "var(--lmx-text)",
              }}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="px-4 py-2 rounded-lg font-display font-bold text-sm border"
              style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!gwName.trim()}
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Fixtures */}
      {step === 2 && (
        <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
            Pick Fixtures
          </h2>
          <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
            Scheduled fixtures for {selectedComp?.name} in the next 60 days
          </p>
          {loadingFixtures ? (
            <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>Loading fixtures…</p>
          ) : fixtures.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--lmx-text-muted)" }}>
              No upcoming fixtures found. Sync fixtures first in the Sync section.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {fixtures.map((f) => {
                const checked = selectedFixtureIds.has(f.id);
                return (
                  <label
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      background: checked ? "rgba(16,185,129,0.08)" : "var(--lmx-surface)",
                      border: checked ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--lmx-surface-edge)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleFixtureToggle(f.id)}
                      className="w-4 h-4 accent-green-500"
                    />
                    <span className="flex-1 text-sm" style={{ color: "var(--lmx-text)" }}>
                      {f.home_team?.short_name ?? "?"} vs {f.away_team?.short_name ?? "?"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
                      {new Date(f.kickoff_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-xs" style={{ color: "var(--lmx-text-muted)" }}>
            {selectedFixtureIds.size} fixtures selected
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg font-display font-bold text-sm border"
              style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleFixturesNext}
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Dates */}
      {step === 3 && (
        <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
            Set Dates
          </h2>
          {[
            { label: "Opens At", value: startsAt, setter: setStartsAt, key: "starts" },
            { label: "Cutoff At", value: cutoffAt, setter: setCutoffAt, key: "cutoff" },
            { label: "Closes At", value: closesAt, setter: setClosesAt, key: "closes" },
          ].map(({ label, value, setter, key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-display uppercase tracking-widest" style={{ color: "var(--lmx-text-muted)" }}>
                {label}
              </label>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--lmx-surface)",
                  border: "1px solid var(--lmx-surface-edge)",
                  color: "var(--lmx-text)",
                  colorScheme: "dark",
                }}
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-display uppercase tracking-widest" style={{ color: "var(--lmx-text-muted)" }}>
              Initial Status
            </label>
            <div className="flex gap-3">
              {(["draft", "open"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-green-500"
                  />
                  <span className="text-sm font-display capitalize" style={{ color: "var(--lmx-text)" }}>
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg font-display font-bold text-sm border"
              style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!cutoffAt || !closesAt || !startsAt}
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--lmx-text)" }}>
            Review & Create
          </h2>

          <div className="flex flex-col gap-3 text-sm">
            {[
              { label: "Competition", value: selectedComp?.name },
              { label: "Name", value: gwName },
              { label: "Number", value: `GW${gwNumber}` },
              { label: "Status", value: status },
              { label: "Opens", value: startsAt ? new Date(startsAt).toLocaleString() : "—" },
              { label: "Cutoff", value: cutoffAt ? new Date(cutoffAt).toLocaleString() : "—" },
              { label: "Closes", value: closesAt ? new Date(closesAt).toLocaleString() : "—" },
              { label: "Fixtures", value: `${selectedFixtureIds.size} selected` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between gap-4 pb-2"
                style={{ borderBottom: "1px solid var(--lmx-surface-edge)" }}
              >
                <span style={{ color: "var(--lmx-text-muted)" }}>{label}</span>
                <span className="font-display font-medium text-right" style={{ color: "var(--lmx-text)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {selectedFixtures.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider font-display mb-2" style={{ color: "var(--lmx-text-muted)" }}>
                Fixtures
              </p>
              <div className="flex flex-col gap-1">
                {selectedFixtures.map((f) => (
                  <p key={f.id} className="text-xs" style={{ color: "var(--lmx-text)" }}>
                    {f.home_team?.short_name ?? "?"} vs {f.away_team?.short_name ?? "?"} —{" "}
                    {new Date(f.kickoff_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                    })}
                  </p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p
              className="text-sm rounded-lg px-4 py-2.5"
              style={{
                color: "var(--lmx-red)",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg font-display font-bold text-sm border"
              style={{ borderColor: "var(--lmx-surface-edge)", color: "var(--lmx-text-muted)" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--lmx-green)", color: "var(--lmx-surface)" }}
            >
              {submitting ? "Creating…" : "Create Gameweek →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
