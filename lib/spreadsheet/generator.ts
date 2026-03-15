// Generates and downloads the LMX spreadsheet template (XLSX) entirely in the browser.

export async function downloadTemplate(): Promise<void> {
  const XLSX = await import("xlsx");

  // ── Players sheet ──────────────────────────────────────────────────────────
  const playerHeaders = ["player_name", "entry_gameweek", "status", "eliminated_gameweek", "notes"];
  const playerSample = [
    ["Alice Smith", 1, "active", "", ""],
    ["Bob Jones", 1, "eliminated", 4, "Picked Chelsea — Lost"],
    ["Carol White", 1, "active", "", "Captain of the pub"],
    ["Dave Brown", 2, "eliminated", 6, ""],
  ];
  const playersData = [playerHeaders, ...playerSample];

  // ── Picks sheet ────────────────────────────────────────────────────────────
  const pickHeaders = ["player_name", "gameweek", "team_picked", "result", "pick_type"];
  const pickSample = [
    ["Alice Smith", 1, "Arsenal", "W", "manual"],
    ["Alice Smith", 2, "Liverpool", "W", "manual"],
    ["Alice Smith", 3, "Man City", "D", "manual"],
    ["Bob Jones", 1, "Chelsea", "W", "manual"],
    ["Bob Jones", 2, "Tottenham", "W", "auto"],
    ["Bob Jones", 3, "Man Utd", "W", "manual"],
    ["Bob Jones", 4, "Chelsea", "L", "manual"],
    ["Carol White", 1, "Aston Villa", "W", "manual"],
    ["Carol White", 2, "Brighton", "W", "manual"],
    ["Carol White", 3, "Newcastle", "W", "manual"],
    ["Dave Brown", 1, "Everton", "W", "manual"],
    ["Dave Brown", 2, "Wolves", "W", "manual"],
    ["Dave Brown", 3, "Brentford", "W", "manual"],
    ["Dave Brown", 4, "West Ham", "W", "manual"],
    ["Dave Brown", 5, "Crystal Palace", "W", "auto"],
    ["Dave Brown", 6, "Fulham", "L", "manual"],
  ];
  const picksData = [pickHeaders, ...pickSample];

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const playersWs = XLSX.utils.aoa_to_sheet(playersData);
  const picksWs = XLSX.utils.aoa_to_sheet(picksData);

  // Column widths
  playersWs["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 30 }];
  picksWs["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 12 }];

  // Data validation dropdowns
  const resultValidation = {
    type: "list" as const,
    formula1: '"W,L,D"',
    showDropDown: false,
    sqref: "D2:D500",
  };
  const statusValidation = {
    type: "list" as const,
    formula1: '"active,eliminated"',
    showDropDown: false,
    sqref: "C2:C500",
  };
  const pickTypeValidation = {
    type: "list" as const,
    formula1: '"manual,auto"',
    showDropDown: false,
    sqref: "E2:E500",
  };

  if (!picksWs["!dataValidations"]) (picksWs as Record<string, unknown>)["!dataValidations"] = [];
  (picksWs as Record<string, unknown[]>)["!dataValidations"].push(resultValidation, pickTypeValidation);

  if (!playersWs["!dataValidations"]) (playersWs as Record<string, unknown>)["!dataValidations"] = [];
  (playersWs as Record<string, unknown[]>)["!dataValidations"].push(statusValidation);

  XLSX.utils.book_append_sheet(wb, playersWs, "players");
  XLSX.utils.book_append_sheet(wb, picksWs, "picks");

  // ── Download ───────────────────────────────────────────────────────────────
  XLSX.writeFile(wb, "lmx-league-template.xlsx");
}

// CSV fallback — two separate downloads
export async function downloadTemplateCsv(sheet: "players" | "picks"): Promise<void> {
  const XLSX = await import("xlsx");

  const headers =
    sheet === "players"
      ? ["player_name", "entry_gameweek", "status", "eliminated_gameweek", "notes"]
      : ["player_name", "gameweek", "team_picked", "result", "pick_type"];

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lmx-${sheet}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
