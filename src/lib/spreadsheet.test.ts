import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { readXlsx } from "./spreadsheet";
import { applyColumns, guessColumns } from "./client-import";

describe("readXlsx", () => {
  it("reads the first sheet, including hyperlinked emails, into the client import", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Clients");
    ws.addRow(["First Name", "Last Name", "Email", "Entity"]);
    ws.addRow(["Jane", "Doe", { text: "jane@x.com", hyperlink: "mailto:jane@x.com" }, "1040"]);
    ws.addRow([]);
    ws.addRow(["Acme", "Inc", "ops@acme.com", "S Corp"]);
    const buf = await wb.xlsx.writeBuffer();
    const table = await readXlsx(buf as ArrayBuffer);
    expect(table).toHaveLength(3);
    expect(applyColumns(table, guessColumns(table)).clients).toEqual([
      { name: "Jane Doe", email: "jane@x.com", checklistHint: "1040" },
      { name: "Acme Inc", email: "ops@acme.com", checklistHint: "S Corp" },
    ]);
  });
});
