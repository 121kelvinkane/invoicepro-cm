import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

function money(amount: number) { return `FCFA ${Number(amount || 0).toLocaleString()}`; }
function formatDate(value: any) {
  try { return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

export async function generateInvoicePdf(invoice: any, business: any, customer: any, options: any = {}) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  const page = await browser.newPage();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 40px;
      color: #1a202c;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
    }
    .logo { max-width: 120px; max-height: 80px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 {
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 8px;
    }
    .invoice-title .info {
      font-size: 14px;
      color: #718096;
      line-height: 1.8;
    }
    .addresses {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-bottom: 48px;
    }
    .address-block h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #718096;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    .address-block p {
      font-size: 14px;
      line-height: 1.8;
      color: #2d3748;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .items-table thead {
      background: #f7fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    .items-table th {
      padding: 14px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #718096;
    }
    .items-table th:not(:first-child) { text-align: right; }
    .items-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table td:not(:first-child) { text-align: right; }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 24px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      color: #4a5568;
    }
    .totals-row.total {
      border-top: 2px solid #2d3748;
      margin-top: 12px;
      padding-top: 16px;
      font-size: 18px;
      font-weight: 700;
      color: #2d3748;
    }
    .payment-info {
      margin-top: 48px;
      padding: 24px;
      background: #f0fff4;
      border-radius: 8px;
      border-left: 4px solid #48bb78;
    }
    .payment-info h3 {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
    }
    .payment-info p {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.6;
    }
    .payment-link {
      color: #3182ce;
      text-decoration: underline;
      word-break: break-all;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 13px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${business?.logoUrl ? `<img src="${business.logoUrl.startsWith('/') ? 'https://invoicepro-cm-api.onrender.com' + business.logoUrl : business.logoUrl}" class="logo" />` : '<div style="width:60px;height:60px;background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;"></div>'}
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="info">
        <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br/>
        <strong>Date:</strong> ${formatDate(invoice.createdAt)}<br/>
        <strong>Due:</strong> ${formatDate(invoice.dueDate)}
      </div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>From</h3>
      <p>
        <strong>${business?.businessName || 'My Business'}</strong><br/>
        ${business?.address || ''}<br/>
        ${business?.phone || ''}<br/>
        ${business?.email || ''}
      </p>
    </div>
    <div class="address-block">
      <h3>Bill To</h3>
      <p>
        <strong>${customer?.name || ''}</strong><br/>
        ${customer?.email || ''}<br/>
        ${customer?.phone || ''}
      </p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems?.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${money(item.unitPrice)}</td>
          <td>${money(item.total)}</td>
        </tr>
      `).join('') || ''}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${money(invoice.subtotal)}</span>
    </div>
    <div class="totals-row">
      <span>VAT</span>
      <span>${money(invoice.vatAmount || 0)}</span>
    </div>
    <div class="totals-row total">
      <span>Total Due</span>
      <span>${money(invoice.total)}</span>
    </div>
  </div>

  <div class="payment-info">
    <h3>💳 Pay Online Securely</h3>
    <p>
      Click the link below to pay via MTN MoMo or Orange Money:<br/>
      <a href="https://invoicepro-cm.vercel.app/i/${invoice.publicToken}" class="payment-link">
        https://invoicepro-cm.vercel.app/i/${invoice.publicToken}
      </a>
    </p>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
  });
  
  await browser.close();
  return pdf;
}
