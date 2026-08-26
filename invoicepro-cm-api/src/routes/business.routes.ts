import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { logActivity } from "../utils/logger";
import { requireAuth } from "../middleware/auth";

const router = express.Router();


const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
    const userId = req.user?.id || (req as any).userId;
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
      signatureUrl: profile.ownerSignatureUrl,
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

// Multer setup for signature upload
const uploadSignature = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `sig-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// POST /business/signature - Upload signature image
router.post("/signature", requireAuth, uploadSignature.single("signature"), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err: any) {
    console.error("❌ SIGNATURE UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /business - Save profile details
router.put("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { name, tin, address, phone, email, logoUrl, signatureUrl, momoNumber } = req.body;

    const profile = await prisma.businessProfile.upsert({
      where: { userId },
      update: {
        businessName: name,
        taxId: tin,
        address,
        phone,
        email,
        logoUrl,
        ownerSignatureUrl: signatureUrl,
        momoNumber,
      },
      create: {
        userId,
        businessName: name,
        taxId: tin,
        address,
        phone,
        email,
        logoUrl,
        ownerSignatureUrl: signatureUrl,
        momoNumber,
      },
    });
            await logActivity({
          userId,
          action: "PROFILE_UPDATED",
          entityType: "BusinessProfile",
          entityId: userId,
          metadata: JSON.stringify({ updatedFields: Object.keys(req.body) })
        });
                await logActivity({
          userId,
          action: "PROFILE_UPDATED",
          entityType: "BusinessProfile",
          entityId: userId,
          metadata: JSON.stringify({ updatedFields: Object.keys(req.body) })
        });
        res.json(profile);
  } catch (err: any) {
    console.error("❌ PUT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;






