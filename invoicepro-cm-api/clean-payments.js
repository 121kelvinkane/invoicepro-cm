const fs = require('fs');

// 1. Remove the old simulate payment route
let invoiceCode = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

// Remove the entire old /pay route (simulate payment)
invoiceCode = invoiceCode.replace(
  /\/\/ TEST MODE PAYMENT ROUTE[\s\S]*?export default router;/,
  'export default router;'
);

fs.writeFileSync('src/routes/invoice.routes.ts', invoiceCode);
console.log('✅ Removed old simulate payment route!');

// 2. Remove payment link from PDF
let pdfCode = fs.readFileSync('src/utils/pdf.ts', 'utf8');
pdfCode = pdfCode.replace(
  /\/\/ 5\. PAYMENT LINK[\s\S]*?doc\.end\(\);/,
  'doc.end();'
);

fs.writeFileSync('src/utils/pdf.ts', pdfCode);
console.log('✅ Removed payment link from PDF!');
