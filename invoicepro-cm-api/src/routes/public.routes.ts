import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/invoices/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        customer: { select: { name: true, email: true, phone: true, address: true } },
        lineItems: true,
        user: { select: { fullName: true, businessProfile: true } },
      },
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    return res.json({ invoice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// SIMULATED PAYMENT ENDPOINT
router.post("/invoices/:token/pay", async (req, res) => {
  try {
    const { token } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { publicToken: token } });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "PAID") return res.status(400).json({ message: "Invoice is already paid" });

    console.log(`Simulating payment for invoice ${invoice.invoiceNumber}...`);

    // Simulate processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create Payment Record
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        userId: invoice.userId,
        method: req.body.method || "MTN_MOMO",
        status: "SUCCESS",
        amount: invoice.balanceDue,
        currency: "XAF",
        isManual: false,
        provider: "SIMULATED",
        providerReference: "SIM_" + Date.now(),
        paidAt: new Date(),
      },
    });

    // Update Invoice Status
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        amountPaid: invoice.total,
        balanceDue: 0,
        paidAt: new Date(),
      },
    });

    return res.json({ success: true, message: "Payment successful!", invoice: updated });
  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ message: "Payment processing failed" });
  }
});

export default router;