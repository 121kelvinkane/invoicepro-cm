const fs = require('fs');

const pdfCode = `import puppeteer from "puppeteer";

export async function generateInvoicePdf(invoice: any, business: any, customer: any, options: any = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  
  // Build the HTML from the preview page design
  const html = \`
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
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 8px;
    }
    .invoice-title .info {
      font-size: 14px;
      color: #718096;
      line-height: 1.6;
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
      line-height: 1.6;
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
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #718096;
      letter-spacing: 0.5px;
    }
    .items-table th:nth-child(2),
    .items-table th:nth-child(3),
    .items-table th:nth-child(4) {
      text-align: right;
    }
    .items-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table td:nth-child(2),
    .items-table td:nth-child(3),
    .items-table td:nth-child(4) {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 24px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 14px;
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
      background: #f7fafc;
      border-radius: 8px;
      border-left: 4px solid #48bb78;
    }
    .payment-info h3 {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 8px;
    }
    .payment-info p {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.6;
    }
    .payment-link {
      color: #4299e1;
      text-decoration: underline;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      \${business?.logoUrl ? \`<img src="\${business.logoUrl.startsWith('/') ? 'https://invoicepro-cm-api.onrender.com' + business.logoUrl : business.logoUrl}" class="logo" />\` : ''}
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="info">
        <strong>Invoice #:</strong> \${invoice.invoiceNumber}<br/>
        <strong>Date:</strong> \${new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
        <strong>Due Date:</strong> \${new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>From</h3>
      <p>
        <strong>\${business?.businessName || 'My Business'}</strong><br/>
        \${business?.address || ''}<br/>
        \${business?.phone || ''}<br/>
        \${business?.email || ''}
      </p>
    </div>
    <div class="address-block">
      <h3>Bill To</h3>
      <p>
        <strong>\${customer?.name || ''}</strong><br/>
        \${customer?.email || ''}<br/>
        \${customer?.phone || ''}
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
      \${invoice.lineItems?.map(item => \`
        <tr>
          <td>\${item.description}</td>
          <td>\${item.quantity}</td>
          <td>FCFA \${Number(item.unitPrice || 0).toLocaleString()}</td>
          <td>FCFA \${Number(item.total || 0).toLocaleString()}</td>
        </tr>
      \`).join('') || ''}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>FCFA \${Number(invoice.subtotal || 0).toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>VAT</span>
      <span>FCFA \${Number(invoice.vatAmount || 0).toLocaleString()}</span>
    </div>
    <div class="totals-row total">
      <span>Total Due</span>
      <span>FCFA \${Number(invoice.total || 0).toLocaleString()}</span>
    </div>
  </div>

  \${!options.hidePaymentLink ? \`
  <div class="payment-info">
    <h3>💳 Payment Information</h3>
    <p>
      Pay securely online via MTN MoMo or Orange Money:<br/>
      <a href="https://invoicepro-cm.vercel.app/i/\${invoice.publicToken}" class="payment-link">
        https://invoicepro-cm.vercel.app/i/\${invoice.publicToken}
      </a>
    </p>
  </div>
  \` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  \`;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  });
  
  await browser.close();
  return pdf;
}
`;

fs.writeFileSync('src/utils/pdf.ts', pdfCode);
console.log('✅ PDF generator rewritten with Puppeteer (pixel-perfect from preview)!');
