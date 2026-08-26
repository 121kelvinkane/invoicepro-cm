const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

const payRoute = `
// TEST MODE PAYMENT ROUTE
router.post("/:id/pay", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const invoiceId = req.params.id;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Simulate a 2-second payment processing delay
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    // Update the invoice to PAID
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        amountPaid: invoice.total,
        balanceDue: 0,
      },
    });

    return res.json({
      message: "Payment successful! (Test Mode)",
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error("❌ PAYMENT ERROR:", error.message);
    return res.status(500).json({ message: error.message });
  }
});
`;

if (!code.includes('"/:id/pay"')) {
  code = code.replace('export default router;', payRoute + '\nexport default router;');
  fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
  console.log('✅ Test Mode payment route added!');
} else {
  console.log('⚠️ Payment route already exists.');
}
