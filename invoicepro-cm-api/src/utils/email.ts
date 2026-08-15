import "dotenv/config";
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

function money(amount: number) { return `FCFA ${Number(amount || 0).toLocaleString()}`; }
function formatDate(value: any) { try { return new Date(value).toLocaleDateString(); } catch { return ""; } }

export async function sendInvoiceEmail(params: { to: string; invoice: any; business: any; }) {
  const { to, invoice, business } = params;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const publicLink = `${appUrl}/i/${invoice.publicToken}`;
  const from = process.env.EMAIL_FROM || "InvoicePro CM <no-reply@invoicepro.local>";
  const subject = `Invoice ${invoice.invoiceNumber} from ${business?.businessName || "InvoicePro CM"}`;

  const html = `<div style="font-family: Arial, sans-serif; padding:24px;"><h1>${business?.businessName}</h1><p>Invoice ${invoice.invoiceNumber}</p><p>Hello ${invoice.customer?.name},</p><p>Amount Due: ${money(invoice.balanceDue)}</p><p>Due Date: ${formatDate(invoice.dueDate)}</p><p><a href="${publicLink}">View Invoice</a></p></div>`;
  const text = `Hello ${invoice.customer?.name},\nInvoice ${invoice.invoiceNumber}.\nAmount: ${money(invoice.balanceDue)}\nDue: ${formatDate(invoice.dueDate)}\nLink: ${publicLink}`;

  const emailTransporter = getTransporter();
  if (!emailTransporter) return { sent: false, message: "Email provider not configured." };

  console.log("Attempting to send email to:", to);
  try {
    await emailTransporter.sendMail({ from, to, subject, text, html });
    console.log("Email sent successfully!");
    return { sent: true, message: "Invoice email sent successfully." };
  } catch (error: any) {
    console.error("EMAIL SEND FAILED:", error.message);
    throw new Error("Failed to send email: " + error.message);
  }
}