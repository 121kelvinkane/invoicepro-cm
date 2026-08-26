const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

// Replace the broken generateInvoiceNumber function with a bulletproof one
const oldFunc = `async function generateInvoiceNumber(userId: string, year: number) {
  const count = await prisma.invoice.count({
    where: {
      userId,
      invoiceNumber: {
        startsWith: \`INV-\${year}-\`,
      },
    },
  });

  return \`INV-\${year}-\${String(count + 1).padStart(4, "0")}\`;
}`;

const newFunc = `async function generateInvoiceNumber(userId: string, year: number, attempt: number = 0) {
  // Find the HIGHEST existing invoice number instead of counting
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      invoiceNumber: {
        startsWith: \`INV-\${year}-\`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10);
    nextNum = lastNum + 1;
  }

  // Add attempt number so retries generate DIFFERENT numbers
  nextNum += attempt;

  return \`INV-\${year}-\${String(nextNum).padStart(4, "0")}\`;
}`;

code = code.replace(oldFunc, newFunc);

// Also update the loop to pass the attempt number
code = code.replace(
  /const invoiceNumber = await generateInvoiceNumber\(\s*userId,\s*issue\.getFullYear\(\)\s*\)/g,
  'const invoiceNumber = await generateInvoiceNumber(userId, issue.getFullYear(), attempt)'
);

fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
console.log('✅ generateInvoiceNumber fixed! Now finds highest number instead of counting!');
