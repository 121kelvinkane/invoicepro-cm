import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { updateProfileSchema } from "../validation/profile.schema";

const router = Router();
router.use(requireAuth);

const upload = multer({ dest: "uploads/" });

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const profile = await prisma.businessProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Business profile not found" });
    return res.json({ profile });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });

    const profile = await prisma.businessProfile.update({ where: { userId }, data: parsed.data });
    return res.json({ message: "Profile updated successfully", profile });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logo", upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const ext = path.extname(req.file.originalname);
    const newPath = `uploads/${userId}${ext}`;
    fs.renameSync(req.file.path, newPath);

    const profile = await prisma.businessProfile.update({
      where: { userId },
      data: { logoUrl: newPath },
    });

    return res.json({ message: "Logo uploaded successfully", profile });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload logo" });
  }
});

router.post("/toggle-plan", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const profile = await prisma.businessProfile.findUnique({ where: { userId } });
    
    const newPlan = profile?.plan === "PRO" ? "FREE" : "PRO";
    
    const updated = await prisma.businessProfile.update({
      where: { userId },
      data: { plan: newPlan },
    });

    return res.json({ message: `Upgraded to ${newPlan} plan`, profile: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to toggle plan" });
  }
});

export default router;