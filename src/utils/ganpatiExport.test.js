import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { createAuditWorkbook } from "./ganpatiExport.js";

test("one audit includes separate building tables, expenses and pending with reconciled totals", () => {
  const workbook = createAuditWorkbook([
    { wing: "A", amount: 57716, name: "Resident A", flat: "101" },
    { wing: "B", amount: 9001, anonymous: true },
    { wing: "B", amount: 1000, verificationStatus: "pending" },
    { wing: "A", type: "outgoing", amount: 4715, purpose: "Decorations" },
    { wing: "A", type: "outgoing", amount: 4001, purpose: "Advance" },
  ]);
  const decoded = XLSX.read(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
  assert.deepEqual(decoded.SheetNames, ["Summary", "Building A collections", "Building B collections", "Expenses", "Pending review"]);
  assert.equal(decoded.Sheets.Summary.B3.v, 57716);
  assert.equal(decoded.Sheets.Summary.B4.v, 9001);
  assert.equal(decoded.Sheets.Summary.B5.v, 66717);
  assert.equal(decoded.Sheets.Summary.B6.v, 8716);
  assert.equal(decoded.Sheets.Summary.B7.v, 58001);
  assert.equal(decoded.Sheets.Summary.C4.v, 1000);
  assert.equal(decoded.Sheets.Summary.B7.f, "B5-B6");
  assert.equal(decoded.Sheets["Building B collections"].F2.t, "n");
  assert.equal(decoded.Sheets["Building B collections"]["!autofilter"].ref, "A1:H2");
});

test("empty buildings export valid zero totals", () => {
  const workbook = createAuditWorkbook([]);
  assert.equal(workbook.Sheets.Summary.B7.v, 0);
  assert.equal(workbook.Sheets["Building A collections"].F2.f, "0");
});
