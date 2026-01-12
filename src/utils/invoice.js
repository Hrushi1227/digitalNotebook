import jsPDF from "jspdf";

/**
 * Generate payment invoice PDF
 * @param {object} payment - Payment object
 * @param {object} worker - Worker object
 * @param {string} companyName - Company name (default: "Breeza Construction")
 * @returns {string} Base64 PDF data URL
 */
export const generatePaymentInvoice = (
  payment,
  worker,
  companyName = "Breeza Construction"
) => {
  const pdf = new jsPDF();

  // Company header
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text(companyName, 105, 20, { align: "center" });

  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.text("Payment Receipt", 105, 28, { align: "center" });

  // Line separator
  pdf.setLineWidth(0.5);
  pdf.line(20, 32, 190, 32);

  // Receipt details
  const receiptNo = `REC-${
    payment.id?.substring(0, 8).toUpperCase() || "XXXXX"
  }`;
  const date = new Date(payment.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  pdf.setFontSize(10);
  pdf.text(`Receipt No: ${receiptNo}`, 20, 42);
  pdf.text(`Date: ${date}`, 150, 42);

  // Worker details section
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("Paid To:", 20, 55);

  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text(worker.name || "N/A", 20, 63);
  pdf.setFontSize(10);
  pdf.text(`Phone: ${worker.phoneNumber || worker.phone || "N/A"}`, 20, 70);
  pdf.text(`Role: ${worker.role || "Worker"}`, 20, 77);
  if (worker.address) {
    pdf.text(`Address: ${worker.address}`, 20, 84);
  }

  // Payment details box
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, 95, 170, 35, "F");

  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("Payment Details", 25, 105);

  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text(`Amount Paid:`, 25, 115);
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(14);
  pdf.text(`₹${payment.amount?.toLocaleString("en-IN") || "0"}`, 25, 123);

  // Payment method and notes
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  if (payment.note) {
    pdf.text("Note:", 20, 145);
    const noteLines = pdf.splitTextToSize(payment.note, 170);
    pdf.text(noteLines, 20, 152);
  }

  // Footer
  pdf.setLineWidth(0.5);
  pdf.line(20, 270, 190, 270);

  pdf.setFontSize(9);
  pdf.setFont(undefined, "italic");
  pdf.text("Thank you for your work!", 105, 278, { align: "center" });
  pdf.text("This is a computer-generated receipt.", 105, 284, {
    align: "center",
  });

  // Generate base64 data URL
  const pdfData = pdf.output("dataurlstring");

  return pdfData;
};

/**
 * Download invoice PDF
 * @param {object} payment - Payment object
 * @param {object} worker - Worker object
 * @param {string} companyName - Company name
 */
export const downloadInvoice = (
  payment,
  worker,
  companyName = "Breeza Construction"
) => {
  const pdf = new jsPDF();

  // Generate same PDF as above (reuse logic)
  const pdfData = generatePaymentInvoice(payment, worker, companyName);

  // Create download link
  const link = document.createElement("a");
  link.href = pdfData;
  link.download = `Payment_Receipt_${worker.name}_${new Date(payment.date)
    .toLocaleDateString("en-IN")
    .replace(/\//g, "-")}.pdf`;
  link.click();
};

/**
 * Get invoice file size estimate
 * @param {string} pdfDataUrl - Base64 PDF data URL
 * @returns {number} Size in bytes
 */
export const getInvoiceSize = (pdfDataUrl) => {
  const base64 = pdfDataUrl.split(",")[1];
  const bytes = (base64.length * 3) / 4;
  return Math.round(bytes);
};
