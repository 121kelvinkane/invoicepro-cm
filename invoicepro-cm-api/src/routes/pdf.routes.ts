import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { generateInvoicePdfAsync } from "../utils/pdf";
import { logActivity } from "../utils/logger";

const router = Router();

router.get("/invoices/:id/pdf", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const invoiceId = req.params.id;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
      include: {
        customer: true,
        lineItems: true,
        user: {
          include: {
            businessProfile: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const pdf = await generateInvoicePdfAsync(
      invoice,
      invoice.user.businessProfile,
      invoice.customer
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    return res.send(pdf);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/public/invoices/:token/pdf", async (req, res) => {
  try {
    const { token } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: {
        publicToken: token,
      },
      include: {
        customer: true,
        lineItems: true,
        user: {
          include: {
            businessProfile: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¨ SECURITY GATE: Block download if not paid
    if (invoice.status !== "PAID") {
      return res.status(403).json({ 
        message: "Payment required. Please pay the invoice to unlock the PDF download." 
      });
    }

    // DEBUG: Log signature data
    console.log("=== CLIENT PDF DEBUG ===");
    console.log("Owner Signature URL:", invoice.user?.businessProfile?.ownerSignatureUrl || "EMPTY");
    console.log("Customer Signature:", invoice.customerSignature ? "EXISTS" : "EMPTY");
    console.log("=======================");

    const pdf = await generateInvoicePdfAsync(
      invoice,
      invoice.user.businessProfile,
      invoice.customer,
      { hidePaymentLink: true }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${invoice.invoiceNumber}.pdf"`
    );

    return res.send(pdf);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


// POST /public/invoices/:token/sign - Customer signs the invoice
router.post("/public/invoices/:token/sign", async (req, res) => {
  try {
    const { token } = req.params;
    const { signature } = req.body; 
    if (!signature) return res.status(400).json({ message: "No signature provided" });

    const invoice = await prisma.invoice.findUnique({ where: { publicToken: token }, include: { customer: true } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
    const filename = `cust-sig-${invoice.id}-${Date.now()}.png`;
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, base64Data, "base64");

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        customerSignature: `/uploads/${filename}`,
        customerSignedAt: new Date()
      }
    });

    // ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ NEW: Log the signature event to the dashboard
    await logActivity({
      userId: invoice.userId,
      action: "INVOICE_SIGNED",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, customerName: invoice.customer?.name })
    });

    res.json({ success: true, url: `/uploads/${filename}` });
  } catch (err) {
    console.error("SIGN ERROR:", err);
    res.status(500).json({ message: "Failed to save signature" });
  }
});

export default router;




