const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');
code = code.replace(/\r\n/g, '\n');

// Remove old Campay block if it exists
const startIdx = code.indexOf('// CAMPAY INTEGRATION');
if (startIdx !== -1) {
  const endIdx = code.indexOf('export default router;');
  code = code.slice(0, startIdx) + code.slice(endIdx);
}

const campayRoutes = `// CAMPAY INTEGRATION (MTN MoMo / Orange Money)

// 1. Initiate Payment (sends PIN prompt to the customer's phone)
router.post("/:id/pay-campay", async (req: any, res) => {
  try {
    const userId = req.userId as string;
    const invoiceId = req.params.id;
    let { phone } = req.body;

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "PAID") return res.status(400).json({ message: "Invoice already paid" });

    const campayToken = process.env.CAMPAY_TOKEN;
    if (!campayToken) return res.status(500).json({ message: "Payment not configured. Add CAMPAY_TOKEN in Render." });

    // Clean phone number to 2376xxxxxxxx format
    phone = String(phone || "").replace(/\\s/g, "").replace(/\\+/g, "");
    if (!phone.startsWith("237")) phone = "237" + phone;

    const campayRes = await fetch("https://demo.campay.net/api/collect/", {
      method: "POST",
      headers: {
        Authorization: \`Token \${campayToken}\`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(Number(invoice.total)),
        currency: "XAF",
        from: phone,
        description: \`Invoice \${invoice.invoiceNumber}\`,
        external_reference: randomUUID(),
      }),
    });

    const data = await campayRes.json();
    console.log("CAMPAY COLLECT RESPONSE:", JSON.stringify(data));

    if (!data.reference) {
      return res.status(400).json({ message: data.detail || data.message || "Payment request failed" });
    }

    return res.json({ message: "Check your phone for the PIN prompt", reference: data.reference });
  } catch (err: any) {
    console.error("Campay Error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// 2. Check Payment Status (frontend polls this every 3 seconds)
router.get("/:id/check-campay", async (req: any, res) => {
  try {
    const userId = req.userId as string;
    const invoiceId = req.params.id;
    const reference = req.query.reference as string;
    if (!reference) return res.status(400).json({ message: "Reference missing" });

    const campayToken = process.env.CAMPAY_TOKEN;
    if (!campayToken) return res.status(500).json({ message: "Payment not configured" });

    const campayRes = await fetch(\`https://demo.campay.net/api/transaction/\${reference}/\`, {
      headers: { Authorization: \`Token \${campayToken}\`, Accept: "application/json" },
    });

    const data = await campayRes.json();
    console.log("CAMPAY STATUS RESPONSE:", JSON.stringify(data));

    if (data.status === "SUCCESSFUL") {
      const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
      if (invoice && invoice.status !== "PAID") {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", amountPaid: Number(data.amount || invoice.total), balanceDue: 0 },
        });
      }
      return res.json({ status: "PAID" });
    }

    if (data.status === "FAILED") return res.json({ status: "FAILED" });
    return res.json({ status: "PENDING" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

`;

code = code.replace('export default router;', campayRoutes + 'export default router;');
fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
console.log('✅ Campay routes fixed with official API format!');
