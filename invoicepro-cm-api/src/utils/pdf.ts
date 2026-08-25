import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

function money(amount: any) {
  return `FCFA ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(value: any) {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric"
    });
  } catch {
    return "";
  }
}

function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "");
  const three = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h && r) return ones[h] + " Hundred and " + two(r);
    if (h) return ones[h] + " Hundred";
    return r ? two(r) : "";
  };
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];
  const parts: string[] = [];
  let i = 0;
  let n = Math.floor(Math.abs(num));
  while (n > 0 && i < scales.length) {
    const chunk = n % 1000;
    if (chunk) parts.unshift(three(chunk) + (scales[i] ? " " + scales[i] : ""));
    n = Math.floor(n / 1000);
    i++;
  }
  return parts.join(", ") || "Zero";
}

const COLORS = {
  slate900: "#0f172a",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate50: "#f8fafc",
  emerald600: "#059669",
  emerald700: "#047857",
  emerald400: "#34d399",
  red600: "#dc2626",
  white: "#ffffff",
};

// Download remote image to temp file, returns local path
async function resolveImagePath(imgPath: string): Promise<string | null> {
  try {
    if (!imgPath) return null;

    // Base64 data URL â€” write to temp file
    if (imgPath.startsWith("data:image")) {
      const base64Data = imgPath.replace(/^data:image\/\w+;base64,/, "");
      const tmpPath = path.join(__dirname, "../../uploads/tmp-sig-" + Date.now() + ".png");
      const uploadsDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(tmpPath, base64Data, "base64");
      return tmpPath;
    }

    // Remote URL â€” download
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      const tmpPath = path.join(__dirname, "../../uploads/tmp-sig-" + Date.now() + ".png");
      const uploadsDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      
      await new Promise<void>((resolve, reject) => {
        const client = imgPath.startsWith("https") ? https : http;
        const file = fs.createWriteStream(tmpPath);
        client.get(imgPath, (response) => {
          response.pipe(file);
          file.on("finish", () => { file.close(); resolve(); });
        }).on("error", reject);
      });
      return tmpPath;
    }

    // Local /uploads/ path
    if (imgPath.startsWith("/uploads/")) {
      const localPath = path.join(__dirname, "../..", imgPath);
      return fs.existsSync(localPath) ? localPath : null;
    }

    // Absolute path
    if (path.isAbsolute(imgPath)) {
      return fs.existsSync(imgPath) ? imgPath : null;
    }

    // Relative path
    const relPath = path.join(__dirname, "../..", imgPath);
    return fs.existsSync(relPath) ? relPath : null;
  } catch (e) {
    console.error("resolveImagePath failed:", e);
    return null;
  }
}

export async function generateInvoicePdf(
  invoice: any,
  business: any,
  customer: any,
  options: any = {}
) {
  // DEBUG: Log what we receive
  console.log("=== PDF GENERATION DEBUG ===");
  console.log("Business ownerSignatureUrl:", business?.ownerSignatureUrl);
  console.log("Customer signature:", invoice?.customerSignature ? "YES" : "NO");
  console.log("Issue date:", invoice?.issueDate);
  console.log("Due date:", invoice?.dueDate);
  console.log("===========================");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // â•â•â• 1. DARK SLATE HEADER â•â•â•
    doc.rect(0, 0, pageWidth, 130).fill(COLORS.slate900);

    doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.white)
      .text(business?.businessName || "InvoicePro CM", margin, 50, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate400);
    if (business?.phone) doc.text(business.phone, margin, doc.y + 4, { width: contentWidth / 2 });
    if (business?.email) doc.text(business.email, margin, doc.y + 2, { width: contentWidth / 2 });
    if (business?.address) doc.text(business.address, margin, doc.y + 2, { width: contentWidth / 2 });

    doc.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.white)
      .text("INVOICE", margin + contentWidth / 2, 50, { width: contentWidth / 2, align: "right" });
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.emerald400)
      .text(invoice.invoiceNumber, margin + contentWidth / 2, doc.y + 4, { width: contentWidth / 2, align: "right" });

    const badgeText = invoice.status || "DRAFT";
    const badgeWidth = 80;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = doc.y + 10;
    doc.roundedRect(badgeX, badgeY, badgeWidth, 18, 9).fill(COLORS.emerald600);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.white)
      .text(badgeText, badgeX, badgeY + 5, { width: badgeWidth, align: "center" });

    // â•â•â• 2. EMERALD STRIPE â•â•â•
    doc.rect(0, 130, pageWidth, 4).fill(COLORS.emerald600);

    let y = 160;

    // â•â•â• 3. BILLED TO + DATES (FIXED: dates now visible!) â•â•â•
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.emerald600)
      .text("BILLED TO", margin, y);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.slate900)
      .text(customer?.name || "Walk-in Customer", margin, y + 14, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate500);
    if (customer?.email) doc.text(customer.email, margin, doc.y + 2, { width: contentWidth / 2 });
    if (customer?.phone) doc.text(customer.phone, margin, doc.y + 2, { width: contentWidth / 2 });

    // DATES CARD (right) â€” FIXED positioning
    const cardX = pageWidth - margin - 200;
    const cardY = y - 5;
    doc.roundedRect(cardX, cardY, 200, 70, 6).fill(COLORS.slate50);

    // Issue date row â€” label left, value right within SAME 180px width
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("ISSUE DATE", cardX + 10, cardY + 15, { width: 180, align: "left" });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.slate900)
      .text(formatDate(invoice.issueDate || invoice.createdAt), cardX + 10, cardY + 15, { width: 180, align: "right" });

    // Due date row
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("DUE DATE", cardX + 10, cardY + 42, { width: 180, align: "left" });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.red600)
      .text(formatDate(invoice.dueDate), cardX + 10, cardY + 42, { width: 180, align: "right" });

    y += 100;

    // â•â•â• 4. TABLE â•â•â•
    const colDesc = margin;
    const colDescW = contentWidth * 0.5;
    const colQty = margin + contentWidth * 0.5;
    const colQtyW = contentWidth * 0.2;
    const colAmt = margin + contentWidth * 0.7;
    const colAmtW = contentWidth * 0.3;

    doc.roundedRect(margin, y, contentWidth, 30, 4).fill(COLORS.slate900);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.white);
    doc.text("DESCRIPTION", colDesc + 15, y + 11, { width: colDescW - 15 });
    doc.text("QTY", colQty, y + 11, { width: colQtyW, align: "center" });
    doc.text("AMOUNT", colAmt + colAmtW - 15, y + 11, { width: colAmtW - 15, align: "right" });

    y += 35;
    doc.font("Helvetica").fontSize(10);
    invoice.lineItems?.forEach((item: any, idx: number) => {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
      if (idx % 2 === 0) doc.rect(margin, y - 5, contentWidth, 28).fill(COLORS.slate50);
      doc.fillColor(COLORS.slate900)
        .text(item.description || "", colDesc + 15, y + 3, { width: colDescW - 15 });
      doc.text(String(item.quantity || 0), colQty, y + 3, { width: colQtyW, align: "center" });
      doc.font("Helvetica-Bold").text(money(item.amount), colAmt + colAmtW - 15, y + 3, { width: colAmtW - 15, align: "right" });
      doc.font("Helvetica");
      y += 28;
    });

    y += 20;

    // â•â•â• 5. TOTALS â•â•â•
    const totalsX = pageWidth - margin - 220;
    const totalsW = 220;

    const drawTotalsRow = (label: string, value: string, isBold = false, color = COLORS.slate900) => {
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(10)
        .fillColor(COLORS.slate500).text(label, totalsX + 10, y, { width: totalsW - 20 });
      doc.fillColor(color).text(value, totalsX + 10, y, { width: totalsW - 20, align: "right" });
      if (!isBold) {
        doc.moveTo(totalsX + 10, y + 16).lineTo(totalsX + totalsW - 10, y + 16)
          .strokeColor("#e2e8f0").lineWidth(0.5).stroke();
      }
      y += 20;
    };

    drawTotalsRow("Subtotal", money(invoice.subtotal));
    if (Number(invoice.vatAmount || 0) > 0) drawTotalsRow("VAT", money(invoice.vatAmount));
    drawTotalsRow("Amount Paid", money(invoice.amountPaid), false, COLORS.emerald600);

    y += 5;
    doc.roundedRect(totalsX, y, totalsW, 40, 4).fill(COLORS.slate900);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.white)
      .text("BALANCE DUE", totalsX + 10, y + 8);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.emerald400)
      .text(money(invoice.balanceDue), totalsX + 10, y + 22, { width: totalsW - 20, align: "right" });

    y += 60;

    // â•â•â• 6. AMOUNT IN WORDS â•â•â•
    if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
    doc.roundedRect(margin, y, contentWidth, 50, 6).fill(COLORS.slate50);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("AMOUNT IN WORDS", margin + 20, y + 10);
    const wordsText = numberToWords(Math.floor(Number(invoice.total || 0))) + " " + (invoice.currency || "XAF") + " Only";
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.emerald700)
      .text(wordsText.toUpperCase(), margin + 20, y + 24, { width: contentWidth - 40 });

    y += 70;

    // â•â•â• 7. SIGNATURES (ASYNC â€” resolved outside promise) â•â•â•
    // These are placeholders; actual images injected after resolveImagePath completes
    // We'll build the PDF in async wrapper instead
    if (y > doc.page.height - 150) { doc.addPage(); y = 50; }

    const sigW = (contentWidth - 40) / 2;
    const sigStartY = y;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("BUSINESS OWNER", margin, y);
    doc.moveTo(margin, y + 60).lineTo(margin + sigW, y + 60)
      .strokeColor(COLORS.slate400).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.slate400)
      .text("Authorized Signature", margin, y + 65, { width: sigW, align: "center" });

    const custSigX = margin + sigW + 40;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("CUSTOMER", custSigX, y);
    doc.moveTo(custSigX, y + 60).lineTo(custSigX + sigW, y + 60)
      .strokeColor(COLORS.slate400).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.slate400)
      .text("Customer Signature", custSigX, y + 65, { width: sigW, align: "center" });

    // Attach signature images AFTER placeholders (we'll inject via async below)
    (doc as any)._sigInfo = {
      ownerUrl: business?.ownerSignatureUrl,
      customerUrl: invoice?.customerSignature,
      sigStartY,
      sigW,
      margin,
      custSigX,
    };

    y += 90;

    // â•â•â• 8. PAYMENT LINK (admin only) â•â•â•
    if (!options.hidePaymentLink && invoice.publicToken) {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
      const linkY = y;
      doc.roundedRect(margin, linkY, contentWidth, 55, 6).fill(COLORS.slate50).stroke("#cbd5e0");
      doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.slate900)
        .text("PAY ONLINE SECURELY", margin + 20, linkY + 15);
      const linkUrl = `https://invoicepro-cm.vercel.app/i/${invoice.publicToken}`;
      doc.font("Helvetica").fontSize(11).fillColor("#3182ce")
        .text(linkUrl, margin + 20, linkY + 35, { link: linkUrl, underline: true });
    }

    // â•â•â• 9. FOOTER â•â•â•
    const footerY = doc.page.height - 40;
    doc.rect(margin, footerY - 10, contentWidth, 2).fill(COLORS.emerald600);
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.slate400)
      .text("Generated with InvoicePro CM", margin, footerY, { width: contentWidth, align: "center" });

    doc.end();
  }).then(async (pdfBuffer: any) => {
    // Post-process: inject signature images into the completed buffer
    // Actually we need to inject BEFORE doc.end(), so let's restructure
    return pdfBuffer;
  });
}

// Real async generator that handles signatures properly
export async function generateInvoicePdfAsync(
  invoice: any,
  business: any,
  customer: any,
  options: any = {}
): Promise<Buffer> {
  console.log("=== PDF GENERATION DEBUG ===");
  console.log("Business ownerSignatureUrl:", business?.ownerSignatureUrl);
  console.log("Customer signature:", invoice?.customerSignature ? "YES (" + invoice.customerSignature.substring(0, 50) + "...)" : "NO");
  console.log("Issue date:", invoice?.issueDate);
  console.log("Due date:", invoice?.dueDate);

  // Pre-resolve signature images
  const ownerSigPath = await resolveImagePath(business?.ownerSignatureUrl);
  const customerSigPath = await resolveImagePath(invoice?.customerSignature);
  console.log("Owner sig resolved to:", ownerSigPath);
  console.log("Customer sig resolved to:", customerSigPath);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // â•â•â• 1. HEADER â•â•â•
    doc.rect(0, 0, pageWidth, 130).fill(COLORS.slate900);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.white)
      .text(business?.businessName || "InvoicePro CM", margin, 50, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate400);
    if (business?.phone) doc.text(business.phone, margin, doc.y + 4, { width: contentWidth / 2 });
    if (business?.email) doc.text(business.email, margin, doc.y + 2, { width: contentWidth / 2 });
    if (business?.address) doc.text(business.address, margin, doc.y + 2, { width: contentWidth / 2 });

    doc.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.white)
      .text("INVOICE", margin + contentWidth / 2, 50, { width: contentWidth / 2, align: "right" });
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.emerald400)
      .text(invoice.invoiceNumber, margin + contentWidth / 2, doc.y + 4, { width: contentWidth / 2, align: "right" });

    const badgeText = invoice.status || "DRAFT";
    const badgeWidth = 80;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = doc.y + 10;
    doc.roundedRect(badgeX, badgeY, badgeWidth, 18, 9).fill(COLORS.emerald600);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.white)
      .text(badgeText, badgeX, badgeY + 5, { width: badgeWidth, align: "center" });

    doc.rect(0, 130, pageWidth, 4).fill(COLORS.emerald600);
    let y = 160;

    // â•â•â• 3. BILLED TO + DATES (FIXED!) â•â•â•
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.emerald600)
      .text("BILLED TO", margin, y);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.slate900)
      .text(customer?.name || "Walk-in Customer", margin, y + 14, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate500);
    if (customer?.email) doc.text(customer.email, margin, doc.y + 2, { width: contentWidth / 2 });
    if (customer?.phone) doc.text(customer.phone, margin, doc.y + 2, { width: contentWidth / 2 });

    const cardX = pageWidth - margin - 200;
    const cardY = y - 5;
    doc.roundedRect(cardX, cardY, 200, 70, 6).fill(COLORS.slate50);

    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("ISSUE DATE", cardX + 10, cardY + 15, { width: 180, align: "left" });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.slate900)
      .text(formatDate(invoice.issueDate || invoice.createdAt), cardX + 10, cardY + 15, { width: 180, align: "right" });

    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("DUE DATE", cardX + 10, cardY + 42, { width: 180, align: "left" });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.red600)
      .text(formatDate(invoice.dueDate), cardX + 10, cardY + 42, { width: 180, align: "right" });

    y += 100;

    // â•â•â• 4. TABLE â•â•â•
    const colDesc = margin, colDescW = contentWidth * 0.5;
    const colQty = margin + contentWidth * 0.5, colQtyW = contentWidth * 0.2;
    const colAmt = margin + contentWidth * 0.7, colAmtW = contentWidth * 0.3;

    doc.roundedRect(margin, y, contentWidth, 30, 4).fill(COLORS.slate900);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.white);
    doc.text("DESCRIPTION", colDesc + 15, y + 11, { width: colDescW - 15 });
    doc.text("QTY", colQty, y + 11, { width: colQtyW, align: "center" });
    doc.text("AMOUNT", colAmt + colAmtW - 15, y + 11, { width: colAmtW - 15, align: "right" });

    y += 35;
    doc.font("Helvetica").fontSize(10);
    invoice.lineItems?.forEach((item: any, idx: number) => {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
      if (idx % 2 === 0) doc.rect(margin, y - 5, contentWidth, 28).fill(COLORS.slate50);
      doc.fillColor(COLORS.slate900)
        .text(item.description || "", colDesc + 15, y + 3, { width: colDescW - 15 });
      doc.text(String(item.quantity || 0), colQty, y + 3, { width: colQtyW, align: "center" });
      doc.font("Helvetica-Bold").text(money(item.amount), colAmt + colAmtW - 15, y + 3, { width: colAmtW - 15, align: "right" });
      doc.font("Helvetica");
      y += 28;
    });

    y += 20;

    // â•â•â• 5. TOTALS â•â•â•
    const totalsX = pageWidth - margin - 220;
    const totalsW = 220;

    const drawTotalsRow = (label: string, value: string, isBold = false, color = COLORS.slate900) => {
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(10)
        .fillColor(COLORS.slate500).text(label, totalsX + 10, y, { width: totalsW - 20 });
      doc.fillColor(color).text(value, totalsX + 10, y, { width: totalsW - 20, align: "right" });
      if (!isBold) {
        doc.moveTo(totalsX + 10, y + 16).lineTo(totalsX + totalsW - 10, y + 16)
          .strokeColor("#e2e8f0").lineWidth(0.5).stroke();
      }
      y += 20;
    };

    drawTotalsRow("Subtotal", money(invoice.subtotal));
    if (Number(invoice.vatAmount || 0) > 0) drawTotalsRow("VAT", money(invoice.vatAmount));
    drawTotalsRow("Amount Paid", money(invoice.amountPaid), false, COLORS.emerald600);

    y += 5;
    doc.roundedRect(totalsX, y, totalsW, 40, 4).fill(COLORS.slate900);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.white)
      .text("BALANCE DUE", totalsX + 10, y + 8);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.emerald400)
      .text(money(invoice.balanceDue), totalsX + 10, y + 22, { width: totalsW - 20, align: "right" });

    y += 60;

    // â•â•â• 6. AMOUNT IN WORDS â•â•â•
    if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
    doc.roundedRect(margin, y, contentWidth, 50, 6).fill(COLORS.slate50);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("AMOUNT IN WORDS", margin + 20, y + 10);
    const wordsText = numberToWords(Math.floor(Number(invoice.total || 0))) + " " + (invoice.currency || "XAF") + " Only";
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.emerald700)
      .text(wordsText.toUpperCase(), margin + 20, y + 24, { width: contentWidth - 40 });

    y += 70;

    // â•â•â• 7. SIGNATURES WITH IMAGES â•â•â•
    if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
    const sigW = (contentWidth - 40) / 2;

    // Business owner (left)
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("BUSINESS OWNER", margin, y);
    if (ownerSigPath) {
      try {
        doc.image(ownerSigPath, margin + 20, y + 25, { width: sigW - 40, height: 30 });
        console.log("âœ… Owner signature drawn from:", ownerSigPath);
      } catch (e) { console.error("Owner sig draw failed:", e); }
    }
    doc.moveTo(margin, y + 60).lineTo(margin + sigW, y + 60)
      .strokeColor(COLORS.slate400).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.slate400)
      .text("Authorized Signature", margin, y + 65, { width: sigW, align: "center" });

    // Customer (right)
    const custSigX = margin + sigW + 40;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("CUSTOMER", custSigX, y);
    if (customerSigPath) {
      try {
        doc.image(customerSigPath, custSigX + 20, y + 25, { width: sigW - 40, height: 30 });
        console.log("âœ… Customer signature drawn from:", customerSigPath);
      } catch (e) { console.error("Customer sig draw failed:", e); }
    }
    doc.moveTo(custSigX, y + 60).lineTo(custSigX + sigW, y + 60)
      .strokeColor(COLORS.slate400).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.slate400)
      .text("Customer Signature", custSigX, y + 65, { width: sigW, align: "center" });

    y += 90;

    // â•â•â• 8. PAYMENT LINK (admin only) â•â•â•
    if (!options.hidePaymentLink && invoice.publicToken) {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
      const linkY = y;
      doc.roundedRect(margin, linkY, contentWidth, 55, 6).fill(COLORS.slate50).stroke("#cbd5e0");
      doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.slate900)
        .text("PAY ONLINE SECURELY", margin + 20, linkY + 15);
      const linkUrl = `https://invoicepro-cm.vercel.app/i/${invoice.publicToken}`;
      doc.font("Helvetica").fontSize(11).fillColor("#3182ce")
        .text(linkUrl, margin + 20, linkY + 35, { link: linkUrl, underline: true });
    }

    // â•â•â• 9. FOOTER â•â•â•
    const footerY = doc.page.height - 40;
    doc.rect(margin, footerY - 10, contentWidth, 2).fill(COLORS.emerald600);
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.slate400)
      .text("Generated with InvoicePro CM", margin, footerY, { width: contentWidth, align: "center" });

    doc.end();
  });
}