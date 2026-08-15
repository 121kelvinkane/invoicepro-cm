import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { sendInvoiceEmail } from "../utils/email";

const router = Router();

router.post(
  "/invoices/:id/send-email",
  requireAuth,
  async (req: AuthRequest, res) => {
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

      if (invoice.status === "VOID") {
        return res.status(400).json({
          message: "This invoice cannot be sent",
        });
      }

      if (!invoice.customer.email) {
        return res.status(400).json({
          message:
            "Customer email is required. Add an email address to this customer first.",
        });
      }

      const emailResult = await sendInvoiceEmail({
        to: invoice.customer.email,
        invoice,
        business: invoice.user.businessProfile,
      });

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      return res.json({
        message: emailResult.message,
        invoice: updatedInvoice,
      });
    } catch (error: any) {
      console.error("EMAIL ROUTE ERROR:", error);

      return res.status(500).json({
        message: error?.message || "Failed to send invoice email",
      });
    }
  }
);

export default router;