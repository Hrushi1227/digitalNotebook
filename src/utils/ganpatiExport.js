import * as XLSX from "xlsx";

export function createAuditWorkbook(entries) {
  const workbook = XLSX.utils.book_new();
  const sorted = [...entries].sort((a, b) => String(a.wing).localeCompare(String(b.wing)) || String(a.date || "").localeCompare(String(b.date || "")) || String(a.flat || "").localeCompare(String(b.flat || ""), undefined, { numeric: true }));
  const incoming = sorted.filter((item) => !item.type || item.type === "incoming");
  const groups = [
    ["Building A collections", incoming.filter((item) => item.wing === "A" && item.verificationStatus !== "pending")],
    ["Building B collections", incoming.filter((item) => item.wing === "B" && item.verificationStatus !== "pending")],
    ["Expenses", sorted.filter((item) => item.type === "outgoing")],
    ["Pending review", incoming.filter((item) => item.verificationStatus === "pending")],
  ];
  const summary = XLSX.utils.aoa_to_sheet([
    ["Breeza Society - Ganpati Utsav 2026"],
    ["Building", "Collected (INR)", "Pending review (INR)"],
    ["A", 0, 0], ["B", 0, 0], ["Combined collected", 0],
    ["Society expenses", 0], ["Remaining amount", 0],
    ["Collections are before expenses. Pending review is excluded from collected amounts."],
  ]);
  summary["!cols"] = [{ wch: 34 }, { wch: 24 }, { wch: 24 }];
  summary["!merges"] = [XLSX.utils.decode_range("A1:C1"), XLSX.utils.decode_range("A8:C8")];
  XLSX.utils.book_append_sheet(workbook, summary, "Summary");
  for (const [name, rows] of groups) {
    const expense = name === "Expenses";
    const headers = ["No.", "Building", "Date", expense ? "Purpose" : "Flat", expense ? "Remarks" : "Resident / Contributor", "Amount (INR)", "Payment mode", expense ? "Record ID" : "Remarks"];
    const data = rows.map((item, index) => [index + 1, item.wing, item.date || "", expense ? item.purpose || "Expense" : item.anonymous ? "Anonymous" : item.flat || "", expense ? item.remarks || "" : item.name || "Anonymous", Number(item.amount) || 0, item.mode || "", expense ? item.id || "" : item.remarks || ""]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data, ["TOTAL", "", "", "", "", 0]]);
    const totalRow = rows.length + 2;
    sheet[`F${totalRow}`] = { t: "n", f: rows.length ? `SUM(F2:F${totalRow - 1})` : "0", v: rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), z: '"INR "#,##0.00' };
    for (let row = 2; row < totalRow; row++) sheet[`F${row}`].z = '"INR "#,##0.00';
    sheet["!autofilter"] = { ref: `A1:H${Math.max(1, totalRow - 1)}` };
    sheet["!cols"] = [7, 12, 14, 28, 36, 20, 18, 42].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  const formula = (cell, f, v) => { summary[cell] = { t: "n", f, v, z: '"INR "#,##0.00' }; };
  for (const [wing, row] of [["A", 3], ["B", 4]]) {
    for (const [name, col] of [[`Building ${wing} collections`, "B"], ["Pending review", "C"]]) {
      const rows = groups.find(([group]) => group === name)[1];
      const end = Math.max(2, rows.length + 1);
      formula(`${col}${row}`, `SUMIF('${name}'!B2:B${end},A${row},'${name}'!F2:F${end})`, rows.filter((item) => item.wing === wing).reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    }
  }
  formula("B5", "SUM(B3:B4)", summary.B3.v + summary.B4.v);
  const expenses = groups.find(([name]) => name === "Expenses")[1];
  formula("B6", `'Expenses'!F${expenses.length + 2}`, expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  formula("B7", "B5-B6", summary.B5.v - summary.B6.v);
  workbook.Workbook = { CalcPr: { fullCalcOnLoad: true } };
  return workbook;
}

export function downloadAuditExcel(entries) {
  XLSX.writeFile(createAuditWorkbook(entries), "Breeza_Ganpati_2026_Audit.xlsx");
}
