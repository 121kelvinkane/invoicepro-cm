import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

function money(amount: number) { return `FCFA ${Number(amount || 0).toLocaleString()}`; }
function formatDate(value: any) { try { return new Date(value).toLocaleDateString(); } catch { return ""; } }

export async function generateInvoicePdf(invoice: any, business: any, customer: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const leftMargin = 50;
    const rightEdge = doc.page.width - 50;
    const contentWidth = rightEdge - leftMargin;
    let currentY = 50;

    const isPro = business?.plan === "PRO";

    // 1. Watermark Logic (Only for FREE plan)
    if (!isPro) {
      doc.fillOpacity(0.08);
      doc.fontSize(45);
      doc.fillColor("#94a3b8");
      doc.text("InvoicePro CM", leftMargin, 360, { align: "center", width: contentWidth });
      doc.fillOpacity(1);
    }

    // 2. Header (Logo + Business Info)
    let headerX = leftMargin;
    if (business?.logoUrl) {
      const logoPath = path.join(process.cwd(), business.logoUrl);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, leftMargin, 50, { width: 50 });
        headerX = leftMargin + 65; 
      }
    }

    doc.fontSize(18).font("Helvetica-Bold").fillColor("#111111");
    doc.text(business?.businessName || "Business", headerX, 50);

    doc.font("Helvetica").fontSize(9).fillColor("#555555");
    let hy = doc.y + 4;
    if (business?.phone) { doc.text(business.phone, headerX, hy); hy = doc.y + 2; }
    if (business?.email) { doc.text(business.email, headerX, hy); hy = doc.y + 2; }
    if (business?.address) { doc.text(business.address, headerX, hy); hy = doc.y + 2; }

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#111111");
    doc.text("INVOICE", rightEdge - 160, 50, { width: 160, align: "right" });
    doc.fontSize(10).font("Helvetica").fillColor("#555555");
    doc.text(invoice.invoiceNumber, rightEdge - 160, doc.y + 4, { width: 160, align: "right" });
    doc.text(`Status: ${invoice.status}`, rightEdge - 160, doc.y + 2, { width: 160, align: "right" });

    currentY = Math.max(doc.y, 150) + 20;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666666").text("BILLED TO", leftMargin, currentY);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111").text(customer?.name || "", leftMargin, doc.y + 3, { width: 230 });
    doc.font("Helvetica").fontSize(9).fillColor("#555555");
    if (customer?.email) doc.text(customer.email, leftMargin, doc.y + 2, { width: 230 });
    if (customer?.phone) doc.text(customer.phone, leftMargin, doc.y + 2, { width: 230 });

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666666").text("ISSUE DATE", rightEdge - 170, currentY, { width: 170, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#111111").text(formatDate(invoice.issueDate), rightEdge - 170, doc.y + 3, { width: 170, align: "right" });
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666666").text("DUE DATE", rightEdge - 170, doc.y + 6, { width: 170, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#111111").text(formatDate(invoice.dueDate), rightEdge - 170, doc.y + 3, { width: 170, align: "right" });

    currentY = Math.max(doc.y, leftMargin + 100) + 25;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666666");
    doc.text("DESCRIPTION", leftMargin, currentY, { width: 240 });
    doc.text("QTY", leftMargin + 250, currentY, { width: 50, align: "right" });
    doc.text("UNIT PRICE", leftMargin + 310, currentY, { width: 90, align: "right" });
    doc.text("AMOUNT", rightEdge - 90, currentY, { width: 90, align: "right" });
    currentY += 18;
    doc.moveTo(leftMargin, currentY).lineTo(rightEdge, currentY).strokeColor("#e5e7eb").lineWidth(1).stroke();
    currentY += 8;

    for (const item of invoice.lineItems || []) {
      doc.font("Helvetica").fontSize(9).fillColor("#111111");
      doc.text(item.description || "", leftMargin, currentY, { width: 240 });
      doc.text(String(item.quantity || 0), leftMargin + 250, currentY, { width: 50, align: "right" });
      doc.text(money(item.unitPrice), leftMargin + 310, currentY, { width: 90, align: "right" });
      doc.text(money(item.amount), rightEdge - 90, currentY, { width: 90, align: "right" });
      currentY += 20;
    }

    doc.moveTo(leftMargin, currentY).lineTo(rightEdge, currentY).strokeColor("#e5e7eb").lineWidth(1).stroke();
    currentY += 15;

    const addTotal = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9).fillColor(bold ? "#111111" : "#555555");
      doc.text(label, rightEdge - 220, currentY, { width: 100, align: "right" });
      doc.text(value, rightEdge - 100, currentY, { width: 100, align: "right" });
      currentY += 16;
    };

    addTotal("Subtotal", money(invoice.subtotal));
    if (Number(invoice.vatAmount || 0) > 0) addTotal(`VAT ${invoice.vatRate ? invoice.vatRate + "%" : ""}`, money(invoice.vatAmount));
    addTotal("Amount Paid", money(invoice.amountPaid));
    addTotal("Balance Due", money(invoice.balanceDue), true);

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    doc.font("Helvetica").fontSize(8).fillColor("#555555");
    doc.text(`View and pay online: ${appUrl}/i/${invoice.publicToken}`, leftMargin, 780, { width: contentWidth });
    
    if (isPro) {
       doc.text("Generated with InvoicePro CM Pro", rightEdge - 150, 780, { width: 150, align: "right" });
    }

    doc.end();
  });
}