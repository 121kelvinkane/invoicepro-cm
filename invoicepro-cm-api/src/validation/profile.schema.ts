import { z } from "zod";

export const updateProfileSchema = z.object({
  businessName: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  locale: z.enum(["en", "fr"]).optional(),
  invoiceLanguage: z.enum(["en", "fr"]).optional(),
  defaultVatRate: z.number().min(0).max(100).nullable().optional(),
  vatEnabled: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
