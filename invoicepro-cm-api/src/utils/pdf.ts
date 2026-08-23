import PDFDocument from "pdfkit";

function money(amount: number) { return `FCFA ${Number(amount || 0).toLocaleString()}`; }
function formatDate(value: any) {
  try { return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

export async function generateInvoicePdf(invoice: any, business: any, customer: any, options: any = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const margin = 50;
    const pageWidth = doc.page.width;
    
    // 1. HEADER & LOGO
    if (business?.logoUrl) {
      try {
         let logoSrc = business.logoUrl;
         if (logoSrc.startsWith("/")) logoSrc = `https://invoicepro-cm-api.onrender.com${logoSrc}`;
         doc.image(logoSrc, margin, margin, { fit: [100, 100] });
      } catch (e) { console.error("Logo failed", e); }
    }

    // Invoice Title & Info
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#1a202c").text("INVOICE", { align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#4a5568")
       .text(`Invoice #: ${invoice.invoiceNumber}`, { align: "right" })
       .text(`Date: ${formatDate(invoice.createdAt)}`, { align: "right" })
       .text(`Due: ${formatDate(invoice.dueDate)}`, { align: "right" });
    
    doc.moveDown(4);
    const yPos = doc.y;

    // 2. FROM & TO
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#2d3748").text("FROM:", margin, yPos);
    doc.font("Helvetica").fontSize(10).fillColor("#4a5568")
       .text(business?.businessName || "My Business")
       .text(business?.address || "")
       .text(business?.phone || "")
       .text(business?.email || "");
    
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#2d3748").text("BILL TO:", pageWidth / 2, yPos);
    doc.font("Helvetica").fontSize(10).fillColor("#4a5568")
       .text(customer?.name || "", pageWidth / 2)
       .text(customer?.email || "", pageWidth / 2)
       .text(customer?.phone || "", pageWidth / 2);

    doc.moveDown(4);

    // 3. TABLE
    // Header
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#fff");
    doc.rect(margin, doc.y, pageWidth - margin*2, 25).fill("#2d3748");
    doc.fillColor("#fff")
       .text("Description", margin + 10, doc.y - 20 + 8)
       .text("Qty", margin + 300, doc.y - 20 + 8, { width: 50, align: "center" })
       .text("Price", margin + 350, doc.y - 20 + 8, { width: 80, align: "right" })
       .text("Total", margin + 430, doc.y - 20 + 8, { width: 80, align: "right" });
    
    doc.moveDown();
    doc.font("Helvetica").fontSize(10).fillColor("#1a202c");
    
    // Items
    invoice.lineItems?.forEach((item: any) => {
       doc.text(item.description, margin + 10, doc.y, { width: 280 });
       doc.text(String(item.quantity), margin + 300, doc.y, { width: 50, align: "center" });
       doc.text(money(item.unitPrice), margin + 350, doc.y, { width: 80, align: "right" });
       doc.text(money(item.total), margin + 430, doc.y, { width: 80, align: "right" });
       doc.moveDown();
    });

    // 4. TOTALS
    doc.moveDown(2);
    const totalsX = pageWidth - margin - 200;
    let totalsY = doc.y;
    
    doc.font("Helvetica").fontSize(10)
       .text("Subtotal:", totalsX, totalsY).text(money(invoice.subtotal), totalsX + 100, totalsY, { width: 100, align: "right" });
    totalsY += 20;
    doc.text("VAT:", totalsX, totalsY).text(money(invoice.vatAmount || 0), totalsX + 100, totalsY, { width: 100, align: "right" });
    totalsY += 25;
    doc.font("Helvetica-Bold").fontSize(12)
       .text("TOTAL:", totalsX, totalsY).text(money(invoice.total), totalsX + 100, totalsY, { width: 100, align: "right" });

    doc.end();
  });
}
