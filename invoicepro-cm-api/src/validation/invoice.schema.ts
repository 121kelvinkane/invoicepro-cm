import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1, "Line item description is required"),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  unitPrice: z.number().int().nonnegative("Unit price cannot be negative"),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  issueDate: z.string().datetime({ offset: true }),
  dueDate: z.string().datetime({ offset: true }).optional(),
  language: z.enum(["en", "fr"]).optional(),
  vatEnabled: z.boolean().optional(),
  vatRate: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
});

export const manualPaymentSchema = z.object({
  method: z.enum([
    "MTN_MOMO",
    "ORANGE_MONEY",
    "CARD",
    "BANK_TRANSFER",
    "CASH",
    "MANUAL",
  ]),
  amount: z.number().int().positive("Amount must be greater than zero"),
  paidAt: z.string().datetime({ offset: true }).optional(),
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;
