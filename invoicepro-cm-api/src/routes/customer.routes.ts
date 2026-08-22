import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    console.log("🔵 CREATING CUSTOMER FOR USER:", userId);
    
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
      },
    });
    return res.status(201).json({ message: "Customer created", customer });
  } catch (err: any) {
    console.error("❌ CUSTOMER ERROR:", err.message);
    return res.status(500).json({ error: err.message, meta: err.meta });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const customers = await prisma.customer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return res.json({ customers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
