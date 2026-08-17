import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
// Note: If your middleware is named differently (e.g. 'verifyToken'), change 'requireAuth' below
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// GET /business - Fetch profile for UI
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const profile = await prisma.businessProfile.findUnique({ where: { userId } });
    if (!profile) return res.json({ name: "", tin: "", address: "", phone: "", email: "", logoUrl: "" });
    
    // Map DB fields to Frontend fields
    res.json({
      name: profile.businessName,
      tin: profile.taxId,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      logoUrl: profile.logoUrl,
    });
  } catch (err: any) {
    console.error("❌ GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /business/logo - Upload logo image
router.post("/logo", requireAuth, upload.single("logo"), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err: any) {
    console.error("❌ UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /business - Save profile details
router.put("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { name, tin, address, phone, email, logoUrl } = req.body;

    const profile = await prisma.businessProfile.upsert({
      where: { userId },
      update: {
        businessName: name,
        taxId: tin,
        address,
        phone,
        email,
        logoUrl,
      },
      create: {
        userId,
        businessName: name,
        taxId: tin,
        address,
        phone,
        email,
        logoUrl,
      },
    });
    res.json(profile);
  } catch (err: any) {
    console.error("❌ PUT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

