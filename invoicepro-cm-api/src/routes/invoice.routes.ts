import { Router } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import {
  createInvoiceSchema,
  manualPaymentSchema,
} from "../validation/invoice.schema";

const router = Router();

router.use(requireAuth);

function calculateTotals(
  lineItems: Array<{ quantity: number; unitPrice: number }>,
  vatEnabled: boolean,
  vatRate?: number | null
) {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const effectiveVatRate = vatEnabled && vatRate ? vatRate : 0;

  const vatAmount = Math.round((subtotal * effectiveVatRate) / 100);

  const total = subtotal + vatAmount;

  return {
    subtotal,
    vatRate: effectiveVatRate || null,
    vatAmount,
    total,
  };
}

async function generateInvoiceNumber(userId: string, year: number) {
  const count = await prisma.invoice.count({
    where: {
      userId,
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
  });

  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const status = req.query.status?.toString().toUpperCase();

    const allowedStatuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"];

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        ...(status && allowedStatuses.includes(status)
          ? { status: status as any }
          : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ invoices });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;

    const parsed = createInvoiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const {
      customerId,
      issueDate,
      dueDate,
      language,
      vatEnabled,
      vatRate,
      notes,
      paymentTerms,
      lineItems,
    } = parsed.data;

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!businessProfile) {
      return res.status(400).json({
        message: "Business profile not found",
      });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const issue = new Date(issueDate);
    const due = dueDate ? new Date(dueDate) : new Date(issue);

    if (!dueDate) {
      due.setDate(due.getDate() + 14);
    }

    const shouldApplyVat = vatEnabled ?? businessProfile.vatEnabled;

    const effectiveVatRate = shouldApplyVat
      ? vatRate ?? businessProfile.defaultVatRate ?? 0
      : 0;

    const totals = calculateTotals(lineItems, shouldApplyVat, effectiveVatRate);

    const publicToken = randomUUID();

    let invoice = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const invoiceNumber = await generateInvoiceNumber(
        userId,
        issue.getFullYear()
      );

      try {
        invoice = await prisma.invoice.create({
          data: {
            userId,
            customerId,
            invoiceNumber,
            status: "DRAFT",
            language: language ?? businessProfile.invoiceLanguage,
            issueDate: issue,
            dueDate: due,
            currency: "XAF",
            subtotal: totals.subtotal,
            vatRate: totals.vatRate,
            vatAmount: totals.vatAmount,
            total: totals.total,
            amountPaid: 0,
            balanceDue: totals.total,
            notes,
            paymentTerms,
            publicToken,
            lineItems: {
              create: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })),
            },
          },
          include: {
            customer: true,
            lineItems: true,
          },
        });

        break;
      } catch (error: any) {
        if (error.code === "P2002") {
          continue;
        }

        throw error;
      }
    }

    if (!invoice) {
      return res.status(500).json({
        message: "Could not generate invoice number",
      });
    }

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
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
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.json({ invoice });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const invoiceId = req.params.id;

    const parsed = createInvoiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (invoice.status === "VOID") {
      return res.status(400).json({
        message: "This invoice cannot be edited",
      });
    }

    const {
      customerId,
      issueDate,
      dueDate,
      language,
      vatEnabled,
      vatRate,
      notes,
      paymentTerms,
      lineItems,
    } = parsed.data;

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!businessProfile) {
      return res.status(400).json({
        message: "Business profile not found",
      });
    }

    const issue = new Date(issueDate);
    const due = dueDate ? new Date(dueDate) : invoice.dueDate;

    const shouldApplyVat = vatEnabled ?? businessProfile.vatEnabled;

    const effectiveVatRate = shouldApplyVat
      ? vatRate ?? businessProfile.defaultVatRate ?? 0
      : 0;

    const totals = calculateTotals(lineItems, shouldApplyVat, effectiveVatRate);

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        customerId,
        issueDate: issue,
        dueDate: due,
        language: language ?? invoice.language,
        subtotal: totals.subtotal,
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        total: totals.total,
        balanceDue: totals.total - invoice.amountPaid,
        notes,
        paymentTerms,
        lineItems: {
          deleteMany: {},
          create: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    return res.json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const invoiceId = req.params.id;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (invoice.status === "VOID") {
      return res.status(400).json({
        message: "Only draft invoices can be deleted",
      });
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return res.json({
      message: "Invoice deleted successfully",
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.post("/:id/void", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const invoiceId = req.params.id;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (invoice.status === "VOID") {
      return res.status(400).json({
        message: "This invoice cannot be voided",
      });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "VOID",
      },
    });

    return res.json({
      message: "Invoice voided successfully",
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.post("/:id/send", async (req: AuthRequest, res) => {
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

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return res.json({
      message: "Invoice marked as sent. Email delivery will be added next.",
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});

router.post("/:id/manual-payment", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const invoiceId = req.params.id;

    const parsed = manualPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (invoice.status === "VOID") {
      return res.status(400).json({
        message: "This invoice cannot receive payment",
      });
    }

    const { method, amount, paidAt, reference, note } = parsed.data;

    if (amount > invoice.balanceDue) {
      return res.status(400).json({
        message: "Amount cannot exceed balance due",
      });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        userId,
        method,
        status: "SUCCESS",
        amount,
        currency: "XAF",
        isManual: true,
        manualReference: reference,
        manualNote: note,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
    });

    const newAmountPaid = invoice.amountPaid + amount;
    const newBalanceDue = invoice.total - newAmountPaid;

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newBalanceDue <= 0 ? "PAID" : invoice.status,
        paidAt: newBalanceDue <= 0 ? new Date() : invoice.paidAt,
      },
    });

    return res.json({
      message: "Payment recorded successfully",
      payment,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: err ? (err.message || String(err)) : "Server error",
    });
  }
});


// ==========================================
// EMAIL PAYMENT LINK ROUTE
// ==========================================
router.post("/send-payment-link", async (req: any, res) => {
  try {
    const nodemailer = require("nodemailer");
    const { toEmail, paymentLink, invoiceNumber, customerName, total, currency } = req.body;

    if (!toEmail || !paymentLink) {
      return res.status(400).json({ error: "Missing email or payment link" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Payment Link for Invoice ${invoiceNumber}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #0f172a;">Invoice ${invoiceNumber}</h2>
          <p>Hi ${customerName || 'Customer'},</p>
          <p>You have received an invoice for <strong>${currency || 'XAF'} ${total?.toLocaleString() || ''}</strong>.</p>
          <p>Click the button below to view and pay securely:</p>
          <a href="${paymentLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
            Pay Invoice Now
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Or copy this link: ${paymentLink}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">Sent via InvoicePro CM</p>
        </div>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Payment link emailed successfully!" });
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    res.status(500).json({ error: "Failed to send email: " + error.message });
  }
});
export default router;



