import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

router.post("/send-payment-link", async (req, res) => {
  try {
    const { toEmail, paymentLink, invoiceNumber, customerName, total, currency } = req.body;

    if (!toEmail || !paymentLink) {
      return res.status(400).json({ error: "Missing email or payment link" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Payment Link for Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #0f172a;">Invoice ${invoiceNumber}</h2>
          <p>Hi ${customerName || 'Customer'},</p>
          <p>You have received an invoice for <strong>${currency || 'XAF'} ${total?.toLocaleString() || ''}</strong>.</p>
          <p>Click the button below to view and pay securely:</p>
          <a href="${paymentLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
            Pay Invoice Now
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Or copy this link: ${paymentLink}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">Sent via InvoicePro CM</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Payment link emailed successfully!" });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email. Check backend logs." });
  }
});

export default router;
