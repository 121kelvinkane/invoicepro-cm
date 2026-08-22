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


// CREATE business profile
router.post("/", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const jwt = require("jsonwebtoken");
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    const { name, phone, email, address, city, logoUrl, defaultVatRate, invoiceLanguage } = req.body;

    // Check if profile already exists
    const existing = await prisma.businessProfile.findFirst({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: "Business profile already exists. Use PUT to update." });
    }

    // Create the profile
    const profile = await prisma.businessProfile.create({
      data: {
        userId,
        name: name || "My Business",
        phone: phone || "",
        email: email || "",
        address: address || "",
        city: city || "",
        logoUrl: logoUrl || "",
        defaultVatRate: defaultVatRate || 0,
        invoiceLanguage: invoiceLanguage || "en",
      },
    });

    return res.status(201).json({ message: "Business profile created!", profile });
  } catch (err: any) {
    console.error("❌ CREATE PROFILE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;