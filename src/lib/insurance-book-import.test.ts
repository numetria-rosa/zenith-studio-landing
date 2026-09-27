import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseBookOfBusinessSpreadsheet } from "./insurance-book-import";

const day = (d: Date) => d.toISOString().slice(0, 10);

describe("book of business renewal dates keep their calendar day", () => {
  it("reads ISO and US dates from a CSV without a time-zone shift", async () => {
    const csv = "Client Name,Renewal Date\nA,2027-09-15\nB,09/15/2027\n";
    const r = await parseBookOfBusinessSpreadsheet(Buffer.from(csv), "book.csv", "Agency");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rows.map((x) => day(x.renewalDate))).toEqual(["2027-09-15", "2027-09-15"]);
  });

  it("reads Excel date cells without a time-zone shift", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Book");
    ws.addRow(["Client Name", "Renewal Date"]);
    ws.addRow(["A", new Date(Date.UTC(2027, 8, 15))]);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    const r = await parseBookOfBusinessSpreadsheet(buffer, "book.xlsx", "Agency");
    expect(r.ok).toBe(true);
    if (r.ok) expect(day(r.rows[0].renewalDate)).toBe("2027-09-15");
  });
});
