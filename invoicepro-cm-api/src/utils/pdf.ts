import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

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

// CRITICAL: Always resolve to local filesystem path
function resolveLocalImagePath(imgPath: string): string | null {
  try {
    if (!imgPath) return null;
    console.log("resolveLocalImagePath input:", imgPath);

    // Strip any domain (frontend URLs like https://invoicepro-cm.vercel.app/uploads/...)
    let localPath = imgPath;
    if (localPath.startsWith("http://") || localPath.startsWith("https://")) {
      try {
        const url = new URL(localPath);
        localPath = url.pathname;
        console.log("Stripped domain, localPath now:", localPath);
      } catch (e) {
        console.error("URL parse failed:", e);
        return null;
      }
    }

    // Strip data URL prefix (shouldn't happen for signatures, but safe)
    if (localPath.startsWith("data:image")) {
      console.log("Base64 data URL - not supported for signatures");
      return null;
    }

    // Build absolute path
    let fullPath: string;
    if (path.isAbsolute(localPath)) {
      fullPath = localPath;
    } else if (localPath.startsWith("/")) {
      fullPath = path.join(__dirname, "../..", localPath);
    } else {
      fullPath = path.join(__dirname, "../..", "/" + localPath);
    }

    console.log("Final absolute path:", fullPath);
    console.log("File exists:", fs.existsSync(fullPath));

    if (!fs.existsSync(fullPath)) {
      console.log("❌ File does NOT exist at:", fullPath);
      return null;
    }

    // Validate magic bytes
    const buffer = fs.readFileSync(fullPath);
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    
    console.log("File size:", buffer.length, "bytes");
    console.log("Is PNG:", isPng, "Is JPEG:", isJpeg);
    console.log("First 8 bytes:", buffer.slice(0, 8).toString("hex"));

    if (!isPng && !isJpeg) {
      console.log("❌ Not a valid PNG or JPEG");
      return null;
    }

    console.log("✅ Valid image, returning:", fullPath);
    return fullPath;
  } catch (e) {
    console.error("resolveLocalImagePath error:", e);
    return null;
  }
}

export async function generateInvoicePdf(
  invoice: any,
  business: any,
  customer: any,
  options: any = {}
): Promise<Buffer> {
  console.log("=== PDF GENERATION ===");
  console.log("Owner sig URL:", business?.ownerSignatureUrl);
  console.log("Customer sig:", invoice?.customerSignature ? "YES" : "NO");
  console.log("Hide payment link:", options.hidePaymentLink);
  console.log("======================");

  // Resolve both signatures BEFORE building PDF
  const ownerSigPath = resolveLocalImagePath(business?.ownerSignatureUrl);
  const customerSigPath = resolveLocalImagePath(invoice?.customerSignature);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // ═══ 1. HEADER ═══
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

    // ═══ 2. BILLED TO + DATES ═══
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

    // ═══ 3. TABLE ═══
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

    // ═══ 4. TOTALS ═══
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

    // ═══ 5. AMOUNT IN WORDS ═══
    if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
    doc.roundedRect(margin, y, contentWidth, 50, 6).fill(COLORS.slate50);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("AMOUNT IN WORDS", margin + 20, y + 10);
    const wordsText = numberToWords(Math.floor(Number(invoice.total || 0))) + " " + (invoice.currency || "XAF") + " Only";
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.emerald700)
      .text(wordsText.toUpperCase(), margin + 20, y + 24, { width: contentWidth - 40 });

    y += 70;

    // ═══ 6. SIGNATURES (pre-resolved) ═══
    if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
    const sigW = (contentWidth - 40) / 2;

    // Business owner (left)
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate400)
      .text("BUSINESS OWNER", margin, y);
    if (ownerSigPath) {
      try {
        doc.image(ownerSigPath, margin + 20, y + 25, { width: sigW - 40, height: 30 });
        console.log("✅ Owner sig drawn");
      } catch (e) { console.error("Owner sig draw error:", e.message); }
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
        console.log("✅ Customer sig drawn");
      } catch (e) { console.error("Customer sig draw error:", e.message); }
    }
    doc.moveTo(custSigX, y + 60).lineTo(custSigX + sigW, y + 60)
      .strokeColor(COLORS.slate400).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.slate400)
      .text("Customer Signature", custSigX, y + 65, { width: sigW, align: "center" });

    y += 90;

    // ═══ 7. PAYMENT LINK (admin only) ═══
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

    // ═══ 8. FOOTER WITH GENERATED TIMESTAMP (ALWAYS shown) ═══
    const footerY = doc.page.height - 55;
    doc.rect(margin, footerY - 10, contentWidth, 2).fill(COLORS.emerald600);
    
    const now = new Date();
    const generatedDate = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const generatedTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const generatedText = "Generated on: " + generatedDate + " at " + generatedTime;
    
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.slate400)
      .text("Generated with InvoicePro CM", margin, footerY, { width: contentWidth, align: "center" });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.slate900)
      .text(generatedText, margin, footerY + 15, { width: contentWidth, align: "center" });

    doc.end();
  });
}