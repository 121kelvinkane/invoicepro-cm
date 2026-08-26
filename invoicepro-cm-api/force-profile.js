const fs = require('fs');

// Force delete the old broken file
try { fs.unlinkSync('src/routes/profile.routes.ts'); } catch (e) {}

const code = `import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const { passwordHash, resetToken, resetTokenExpires, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;
    const data = req.body;

    const profile = await prisma.businessProfile.upsert({
      where: { userId },
      update: {
        businessName: data.businessName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        country: data.country,
        logoUrl: data.logoUrl,
        taxId: data.taxId,
        currency: data.currency,
        locale: data.locale,
        invoiceLanguage: data.invoiceLanguage,
        defaultVatRate: data.defaultVatRate,
        vatEnabled: data.vatEnabled,
      },
      create: {
        userId,
        businessName: data.businessName || "My Business",
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || "CM",
        logoUrl: data.logoUrl || null,
        taxId: data.taxId || null,
        currency: data.currency || "XAF",
        locale: data.locale || "en",
        invoiceLanguage: data.invoiceLanguage || "en",
        defaultVatRate: data.defaultVatRate ? Number(data.defaultVatRate) : 19.25,
        vatEnabled: data.vatEnabled === true,
      },
    });

    return res.status(201).json({ message: "Saved!", profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
`;

fs.writeFileSync('src/routes/profile.routes.ts', code);
console.log('✅ File deleted and rewritten perfectly!');
