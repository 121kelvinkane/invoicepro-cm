import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { createCustomerSchema, updateCustomerSchema } from "../validation/customer.schema";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    
    const customer = await prisma.customer.create({ data: { userId, ...parsed.data } });
    return res.status(201).json({ message: "Customer created successfully", customer });
  } catch (err: any) {
    console.error("❌ REAL CUSTOMER ERROR:", err);
    // FORCE THE EXACT ERROR TO SHOW IN THE BROWSER
    return res.status(500).json({ error: err.message, code: err.code, meta: err.meta });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const customers = await prisma.customer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return res.json({ customers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
