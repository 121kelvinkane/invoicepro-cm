import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createCustomerSchema } from "../validation/customer.schema";
import jwt from "jsonwebtoken";

const router = Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    // BYPASS MIDDLEWARE: Extract userId directly from the token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    if (!userId) {
      return res.status(400).json({ error: "Invalid token structure" });
    }

    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    
    const customer = await prisma.customer.create({ data: { userId, ...parsed.data } });
    return res.status(201).json({ message: "Customer created successfully", customer });
  } catch (err: any) {
    console.error("❌ CUSTOMER ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    const customers = await prisma.customer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return res.json({ customers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
