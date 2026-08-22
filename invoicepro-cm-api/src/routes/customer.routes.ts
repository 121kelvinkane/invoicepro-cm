import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validation/customer.schema";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    console.log("🔵 INCOMING REQUEST BODY:", req.body);
    console.log("🔵 USER ID FROM TOKEN:", userId);

    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("❌ VALIDATION FAILED:", parsed.error.flatten());
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    console.log("🔵 VALIDATED DATA READY TO SAVE:", parsed.data);

    const customer = await prisma.customer.create({
      data: {
        userId,
        ...parsed.data,
      },
    });

    return res.status(201).json({ message: "Customer created successfully", customer });
  } catch (err: any) {
    // FORCE THE ERROR TO SHOW IN THE BROWSER AND BYPASS SENTRY
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ REAL CUSTOMER DATABASE ERROR:", errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const search = req.query.search?.toString();
    const customers = await prisma.customer.findMany({
      where: { userId, ...(search ? { name: { contains: search } } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ customers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
