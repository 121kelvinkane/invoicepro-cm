import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const uid = decoded.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { businessProfile: true }
    });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const { passwordHash, resetToken, resetTokenExpires, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    console.error("PROFILE ERROR:", err.message);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;