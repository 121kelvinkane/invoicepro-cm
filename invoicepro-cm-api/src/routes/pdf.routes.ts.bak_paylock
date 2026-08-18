import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { generateInvoicePdf } from "../utils/pdf";

const router = Router();

router.get("/invoices/:id/pdf", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
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
          select: {
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

    const pdf = await generateInvoicePdf(
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
          select: {
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

    const pdf = await generateInvoicePdf(
      invoice,
      invoice.user.businessProfile,
      invoice.customer
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

export default router;