import type { LeagueData, ParseError, ParseResult, PickRow, PlayerRow } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Normalise week strings like "GW1", "Week 1", "Round 1" → integer
function normaliseGameweek(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (!isNaN(n) && Number.isInteger(n)) return n;
  const match = String(raw).match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return null;
}

function normaliseResult(raw: unknown): "W" | "L" | "D" | null {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === "W" || s === "WIN" || s === "WON") return "W";
  if (s === "L" || s === "LOSS" || s === "LOST") return "L";
  if (s === "D" || s === "DRAW" || s === "DREW") return "D";
  return null;
}

function normaliseStatus(raw: unknown): "active" | "eliminated" {
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "eliminated" ? "eliminated" : "active";
}

function normalisePickType(raw: unknown): "manual" | "auto" | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "auto") return "auto";
  if (s === "manual") return "manual";
  return null;
}

// Find a column header case-insensitively
function findCol(headers: string[], ...candidates: string[]): string | null {
  for (const candidate of candidates) {
    const found = headers.find((h) => h.trim().toLowerCase() === candidate.toLowerCase());
    if (found) return found;
  }
  return null;
}

type RawRow = Record<string, unknown>;

function parsePlayers(rows: RawRow[], errors: ParseError[], warnings: ParseError[]): PlayerRow[] {
  if (rows.length === 0) {
    errors.push({ fatal: true, message: "The players sheet is empty. Add at least one player." });
    return [];
  }

  const headers = Object.keys(rows[0]);
  const nameCol = findCol(headers, "player_name", "playername", "name", "player");
  const entryCol = findCol(headers, "entry_gameweek", "entry gameweek", "entry_gw", "entry");
  const statusCol = findCol(headers, "status");
  const elimGwCol = findCol(headers, "eliminated_gameweek", "eliminated gameweek", "elim_gameweek", "elim_gw");
  const notesCol = findCol(headers, "notes", "note");

  if (!nameCol) {
    errors.push({ fatal: true, message: "Missing required column 'player_name' in the players sheet." });
    return [];
  }

  const players: PlayerRow[] = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-indexed + header row
    const name = String(row[nameCol] ?? "").trim();
    if (!name) return; // skip blank rows silently

    const entryGw = entryCol ? normaliseGameweek(row[entryCol]) : 1;
    const status = statusCol ? normaliseStatus(row[statusCol]) : "active";
    const elimGw = elimGwCol ? normaliseGameweek(row[elimGwCol]) : null;

    if (entryCol && entryGw === null) {
      warnings.push({ fatal: false, message: `Row ${rowNum} (players): 'entry_gameweek' is not a valid number — defaulting to 1.` });
    }

    players.push({
      playerName: name,
      entryGameweek: entryGw ?? 1,
      status,
      eliminatedGameweek: elimGw,
      notes: notesCol ? String(row[notesCol] ?? "").trim() || null : null,
    });
  });

  return players;
}

function parsePicks(
  rows: RawRow[],
  playerNames: Set<string>,
  errors: ParseError[],
  warnings: ParseError[]
): PickRow[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const playerCol = findCol(headers, "player_name", "playername", "name", "player");
  const gwCol = findCol(headers, "gameweek", "gw", "week", "round");
  const teamCol = findCol(headers, "team_picked", "team picked", "team", "pick");
  const resultCol = findCol(headers, "result", "outcome");
  const pickTypeCol = findCol(headers, "pick_type", "pick type", "type");

  const missing: string[] = [];
  if (!playerCol) missing.push("player_name");
  if (!gwCol) missing.push("gameweek");
  if (!teamCol) missing.push("team_picked");

  if (missing.length > 0) {
    errors.push({ fatal: true, message: `Missing required column(s) in the picks sheet: ${missing.join(", ")}.` });
    return [];
  }

  const picks: PickRow[] = [];
  // Track duplicates: key = "player|gw"
  const seen = new Map<string, number>();
  const unknownPlayers = new Set<string>();

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const playerName = String(row[playerCol!] ?? "").trim();
    if (!playerName) return;

    const gw = normaliseGameweek(row[gwCol!]);
    if (gw === null) {
      warnings.push({ fatal: false, message: `Row ${rowNum} (picks): 'gameweek' is not a valid number — row skipped.` });
      return;
    }

    const teamPicked = String(row[teamCol!] ?? "").trim();
    if (!teamPicked) {
      warnings.push({ fatal: false, message: `Row ${rowNum} (picks): 'team_picked' is empty — row skipped.` });
      return;
    }

    if (!playerNames.has(playerName)) {
      unknownPlayers.add(playerName);
    }

    const dupKey = `${playerName}|${gw}`;
    if (seen.has(dupKey)) {
      warnings.push({ fatal: false, message: `Duplicate pick for ${playerName} in Gameweek ${gw} — using the most recent entry.` });
      // Remove the earlier entry
      const prevIdx = seen.get(dupKey)!;
      picks.splice(prevIdx, 1);
      // Re-index seen map after splice
      seen.forEach((idx, key) => { if (idx > prevIdx) seen.set(key, idx - 1); });
    }

    seen.set(dupKey, picks.length);
    picks.push({
      playerName,
      gameweek: gw,
      teamPicked,
      result: resultCol ? normaliseResult(row[resultCol]) : null,
      pickType: pickTypeCol ? normalisePickType(row[pickTypeCol]) : null,
    });
  });

  if (unknownPlayers.size > 0) {
    const names = Array.from(unknownPlayers).join(", ");
    warnings.push({
      fatal: false,
      message: `${unknownPlayers.size} pick(s) reference player(s) not in the players sheet: ${names}. These picks are included but those players won't appear in standings.`,
    });
  }

  return picks;
}

// ── XLSX parser ──────────────────────────────────────────────────────────────

async function parseXlsx(file: File, leagueName: string | null): Promise<ParseResult> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  let workbook: ReturnType<typeof XLSX.read>;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return { ok: false, errors: [{ fatal: true, message: "This file couldn't be read. Make sure it's a valid .xlsx file." }] };
  }

  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  // Find sheets case-insensitively
  const sheetNames = workbook.SheetNames;
  const playersSheetName = sheetNames.find((n) => n.trim().toLowerCase() === "players");
  const picksSheetName = sheetNames.find((n) => n.trim().toLowerCase() === "picks");

  if (!playersSheetName) {
    errors.push({ fatal: true, message: "Could not find a sheet named 'players'. Make sure you're using the LMX template." });
  }
  if (!picksSheetName) {
    errors.push({ fatal: true, message: "Could not find a sheet named 'picks'. Make sure you're using the LMX template." });
  }
  if (errors.length > 0) return { ok: false, errors };

  const toRows = (sheetName: string): RawRow[] =>
    XLSX.utils.sheet_to_json<RawRow>(workbook.Sheets[sheetName], { defval: "" });

  const playerRows = toRows(playersSheetName!);
  const pickRows = toRows(picksSheetName!);

  const players = parsePlayers(playerRows, errors, warnings);
  if (errors.some((e) => e.fatal)) return { ok: false, errors };

  const playerNames = new Set(players.map((p) => p.playerName));
  const picks = parsePicks(pickRows, playerNames, errors, warnings);
  if (errors.some((e) => e.fatal)) return { ok: false, errors };

  return { ok: true, data: { leagueName, players, picks }, warnings };
}

// ── CSV parser (two files: players + picks) ───────────────────────────────────

async function parseCsvPair(
  playersFile: File,
  picksFile: File,
  leagueName: string | null
): Promise<ParseResult> {
  const Papa = await import("papaparse");
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  const parseFile = (f: File): Promise<RawRow[]> =>
    new Promise((resolve, reject) => {
      Papa.parse<RawRow>(f, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => resolve(r.data),
        error: (e: Error) => reject(e),
      });
    });

  let playerRows: RawRow[] = [];
  let pickRows: RawRow[] = [];

  try {
    [playerRows, pickRows] = await Promise.all([parseFile(playersFile), parseFile(picksFile)]);
  } catch {
    return { ok: false, errors: [{ fatal: true, message: "One or more CSV files couldn't be read." }] };
  }

  const players = parsePlayers(playerRows, errors, warnings);
  if (errors.some((e) => e.fatal)) return { ok: false, errors };

  const playerNames = new Set(players.map((p) => p.playerName));
  const picks = parsePicks(pickRows, playerNames, errors, warnings);
  if (errors.some((e) => e.fatal)) return { ok: false, errors };

  return { ok: true, data: { leagueName, players, picks }, warnings };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      errors: [{ fatal: true, message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.` }],
    };
  }

  const leagueName = file.name.replace(/\.(xlsx|csv)$/i, "").replace(/[-_]/g, " ").trim() || null;
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx") return parseXlsx(file, leagueName);

  return {
    ok: false,
    errors: [{ fatal: true, message: "Please upload an .xlsx file (or use the two-CSV upload for CSV files)." }],
  };
}

export async function parseCsvFiles(playersFile: File, picksFile: File): Promise<ParseResult> {
  const leagueName = playersFile.name.replace(/[-_]?players?\.csv$/i, "").replace(/[-_]/g, " ").trim() || null;
  return parseCsvPair(playersFile, picksFile, leagueName);
}
