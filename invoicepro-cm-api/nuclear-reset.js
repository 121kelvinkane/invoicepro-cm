const fs = require('fs');

// 1. REWRITE AUTH MIDDLEWARE (Fixes the userId mismatch permanently)
const authCode = `import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    // Decode token and look for EITHER userId or sub
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = decoded.userId || decoded.sub;
    req.userEmail = decoded.email;
    
    if (!req.userId) return res.status(401).json({ message: "Invalid token payload" });
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
`;
fs.writeFileSync('src/middleware/auth.ts', authCode, 'utf8');
console.log('✅ Auth middleware perfectly rewritten!');

// 2. REWRITE CUSTOMER ROUTE (Clean and simple)
const customerCode = `import { Router } from "express";
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
`;
fs.writeFileSync('src/routes/customer.routes.ts', customerCode, 'utf8');
console.log('✅ Customer route perfectly rewritten!');
