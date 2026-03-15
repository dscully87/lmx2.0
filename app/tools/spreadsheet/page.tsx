import type { Metadata } from "next";
import SpreadsheetToolPage from "@/components/tools/spreadsheet/SpreadsheetToolPage";

export const metadata: Metadata = {
  title: "Spreadsheet Tool — LMX",
  description:
    "Download the LMX template, track your last-man-standing league offline in Excel or Google Sheets, then upload for an instant beautified report.",
};

export default function Page() {
  return <SpreadsheetToolPage />;
}
