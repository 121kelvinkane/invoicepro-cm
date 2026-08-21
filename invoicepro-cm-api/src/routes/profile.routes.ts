import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { businessProfile: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Remove sensitive data before sending to frontend
    const { passwordHash, resetToken, resetTokenExpires, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    console.error("❌ PROFILE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
