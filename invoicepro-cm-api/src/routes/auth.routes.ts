import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";

const router = Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/v1/auth/register
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Register attempt:", { email: req.body.email, name: req.body.fullName });
    const { name, fullName, email, password } = req.body;
    const finalName = fullName || name || "User";
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { fullName: finalName, email, passwordHash } });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.json({ token });
  } catch (err: any) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  try {
    console.log("🔑 Login attempt for:", req.body.email);
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.json({ token });
  } catch (err: any) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpires }
    });

    const resetUrl = `${process.env.FRONTEND_URL || "https://invoicepro-cm.vercel.app"}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: "InvoicePro CM <onboarding@resend.dev>",
      to: email,
      subject: "Reset your InvoicePro CM password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Reset Your Password</h2>
          <p>Hi ${user.fullName || "there"},</p>
          <p>We received a request to reset your InvoicePro CM password. Click the button below to set a new one:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ message: "If the email exists, a reset link has been sent." });
  } catch (err: any) {
    console.error("❌ Forgot Password Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    res.json({ message: "Password reset successfully!" });
  } catch (err: any) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;





