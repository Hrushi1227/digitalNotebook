import { jsPDF } from "jspdf";
import { ledgerTotals, combinedTotals } from "./ganpatiTotals.js";

export function createAuditPdf(entries, report = "audit") {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14, width = 182, bottom = 278;
  const currency = (amount) => `Rs. ${Number(amount).toLocaleString("en-IN")}`;
  const totalsA = ledgerTotals(entries.filter((item) => item.wing === "A"));
  const totalsB = ledgerTotals(entries.filter((item) => item.wing === "B"));
  const totals = combinedTotals({ A: totalsA, B: totalsB });
  const green = [35, 112, 83], blue = [40, 91, 139], orange = [173, 78, 37], gold = [150, 105, 23];
  let y = 0;
  function pageHeader() {
    pdf.setFillColor(83, 46, 35); pdf.rect(0, 0, 210, 31, "F");
    pdf.setFillColor(223, 166, 65); pdf.rect(0, 31, 210, 1.5, "F");
    pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(17);
    pdf.text("BREEZA SOCIETY", margin, 12);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
    pdf.text(`Ganpati Utsav 2026 | ${report === "expenses" ? "Expenses report" : "Combined financial audit"}`, margin, 19);
    pdf.setFontSize(7); pdf.text(`Building A + B | Generated ${new Date().toLocaleString("en-IN")}`, margin, 26);
    y = 40;
  }
  function newPage() { pdf.addPage(); pageHeader(); }
  function ensure(height) { if (y + height > bottom) newPage(); }
  pageHeader();
  const cards = [["TOTAL COLLECTED", totals.received, green], ["SOCIETY EXPENSES", totals.spent, orange], ["REMAINING AMOUNT", totals.balance, blue]];
  cards.forEach(([label, value, color], index) => {
    const x = margin + index * 62;
    pdf.setFillColor(...color); pdf.roundedRect(x, y, 58, 22, 2, 2, "F");
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.text(label, x + 4, y + 7);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text(currency(value), x + 4, y + 16);
  });
  y += 30;
  pdf.setTextColor(100, 88, 78); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
  pdf.text("Building collections are shown in full. Expenses are deducted only from the combined total.", margin, y);
  y += 9;

  function table(title, color, headers, widths, rows, total) {
    function heading(continued = false) {
      pdf.setFillColor(...color); pdf.roundedRect(margin, y, width, 9, 1.5, 1.5, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
      pdf.text(`${title}${continued ? " (continued)" : ""}`, margin + 3, y + 6);
      y += 10;
      pdf.setFillColor(236, 231, 222); pdf.rect(margin, y, width, 8, "F");
      pdf.setTextColor(64, 53, 44); pdf.setFontSize(7);
      let x = margin;
      headers.forEach((label, col) => { pdf.text(label, x + 2, y + 5); x += widths[col]; });
      y += 8;
    }
    ensure(37); heading();
    if (!rows.length) {
      pdf.setFillColor(247, 245, 240); pdf.rect(margin, y, width, 10, "F");
      pdf.setTextColor(100, 88, 78); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
      pdf.text("No records in this section.", margin + 3, y + 6); y += 10;
    }
    const content = rows;
    content.forEach((row, index) => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5);
      const lines = row.map((value, col) => pdf.splitTextToSize(String(value ?? ""), widths[col] - 4));
      let offset = 0;
      const count = Math.max(...lines.map((cell) => cell.length));
      while (offset < count) {
        if (y + 8 > bottom) { newPage(); heading(true); }
        const available = Math.max(1, Math.floor((bottom - y - 4) / 3.5));
        const chunk = Math.min(count - offset, available);
        const height = Math.max(8, chunk * 3.5 + 4);
        pdf.setFillColor(...(index % 2 ? [247, 245, 240] : [255, 255, 255]));
        pdf.setDrawColor(224, 220, 211); pdf.rect(margin, y, width, height, "FD");
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(51, 48, 44);
        let x = margin;
        lines.forEach((cell, col) => {
          const part = cell.slice(offset, offset + chunk);
          if (part.length) pdf.text(part, col === headers.length - 1 ? x + widths[col] - 2 : x + 2, y + 5, { align: col === headers.length - 1 ? "right" : "left", lineHeightFactor: 1.32 });
          x += widths[col];
        });
        y += height; offset += chunk;
      }
    });
    if (y + 10 > bottom) { newPage(); heading(true); }
    pdf.setFillColor(...color); pdf.rect(margin, y, width, 9, "F");
    pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
    pdf.text("SECTION TOTAL", margin + 3, y + 6); pdf.text(currency(total), margin + width - 3, y + 6, { align: "right" });
    y += 17;
  }
  const sorted = [...entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.flat || "").localeCompare(String(b.flat || ""), undefined, { numeric: true }));
  const incoming = sorted.filter((item) => !item.type || item.type === "incoming");
  const contributionRow = (item, index) => [index + 1, item.anonymous ? "Anonymous" : `${item.wing}-${item.flat || "-"}`, item.name || "Anonymous", item.date || "-", item.mode || "-", item.remarks || "-", currency(Number(item.amount) || 0)];
  const headers = ["No.", "Building / Flat", "Contributor", "Date", "Mode", "Remarks", "Amount (INR)"];
  const widths = [9, 24, 40, 22, 18, 39, 30];
  if (report !== "expenses") {
    for (const [wing, color, summary] of [["A", green, totalsA], ["B", blue, totalsB]]) {
      table(`Building ${wing} - Collections`, color, headers, widths, incoming.filter((item) => item.wing === wing && item.verificationStatus !== "pending").map(contributionRow), summary.received);
    }
  }
  const expenses = sorted.filter((item) => item.type === "outgoing");
  table("Society expenses - A + B", orange, ["No.", "Building", "Purpose", "Date", "Mode", "Remarks", "Amount (INR)"], widths, expenses.map((item, index) => [index + 1, item.wing, item.purpose || "Expense", item.date || "-", item.mode || "-", item.remarks || "-", currency(Number(item.amount) || 0)]), totals.spent);
  if (report !== "expenses") {
    table("Pending review - Excluded from collections", gold, headers, widths, incoming.filter((item) => item.verificationStatus === "pending").map(contributionRow), totalsA.pendingReview + totalsB.pendingReview);
  }
  ensure(65);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(83, 46, 35); pdf.text("FINAL RECONCILIATION", margin, y + 5); y += 10;
  for (const [label, value] of [["Building A collected", totalsA.received], ["Building B collected", totalsB.received], ["Combined collected (A + B)", totals.received], ["Less: society expenses", totals.spent], ["Remaining amount", totals.balance]]) {
    const last = label === "Remaining amount";
    pdf.setFillColor(...(last ? green : [244, 241, 234])); pdf.rect(margin, y, width, 9, "F");
    pdf.setTextColor(...(last ? [255, 255, 255] : [62, 53, 44])); pdf.setFontSize(9);
    pdf.text(label, margin + 3, y + 6); pdf.text(currency(value), margin + width - 3, y + 6, { align: "right" }); y += 9;
  }
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page); pdf.setDrawColor(222, 214, 200); pdf.line(margin, 285, 196, 285);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(113, 100, 89);
    pdf.text("Private admin audit | Breeza Society", margin, 290);
    pdf.text(`Page ${page} of ${pdf.getNumberOfPages()}`, 196, 290, { align: "right" });
  }
  return pdf;
}
