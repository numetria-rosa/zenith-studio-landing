import ExcelJS from "exceljs";
import { MAX_IMPORT_ROWS, type Table } from "@/lib/client-import";

/** First sheet of an .xlsx file as rows of plain text, for the client-list import. Hyperlinks, rich text,
    formulas and dates all come out as what the cell shows. Older .xls files aren't readable by exceljs; the
    caller tells the accountant to save as .xlsx or CSV. */
export async function readXlsx(data: ArrayBuffer): Promise<Table> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const sheet = wb.worksheets.find((w) => w.actualRowCount > 0);
  if (!sheet) return [];
  const rows: Table = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    if (rows.length > MAX_IMPORT_ROWS) return;
    const cells: string[] = [];
    for (let i = 1; i <= row.cellCount; i++) cells.push((row.getCell(i).text ?? "").trim());
    if (cells.some(Boolean)) rows.push(cells);
  });
  return rows;
}
