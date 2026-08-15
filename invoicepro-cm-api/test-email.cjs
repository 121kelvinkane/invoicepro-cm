require("dotenv/config");
const nodemailer = require("nodemailer");

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.TEST_EMAIL_TO || user;

  console.log("====================================");
  console.log("InvoicePro CM SMTP Test");
  console.log("====================================");
  console.log("SMTP Host:", host);
  console.log("SMTP Port:", port);
  console.log("SMTP User:", user);
  console.log("SMTP Pass length:", pass ? pass.length : 0);
  console.log("Sending test to:", to);
  console.log("====================================");

  if (!host || !user || !pass) {
    console.error("ERROR: Missing SMTP_HOST, SMTP_USER, or SMTP_PASS in .env");
    process.exit(1);
  }

  if (pass.includes("PUT_YOUR_NEW_APP_PASSWORD_HERE")) {
    console.error("ERROR: Your .env still has the placeholder password.");
    console.error("Open .env and replace PUT_YOUR_NEW_APP_PASSWORD_HERE with your Gmail App Password.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully.");
  } catch (error) {
    console.error("SMTP connection failed:", error.message);
    if (error.response) {
      console.error("Server response:", error.response);
    }
    process.exit(1);
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to,
      subject: "InvoicePro CM SMTP Test",
      text: "SMTP is working correctly.",
    });

    console.log("SUCCESS: Test email sent.");
  } catch (error) {
    console.error("Email send failed:", error.message);
    if (error.response) {
      console.error("Server response:", error.response);
    }
    process.exit(1);
  }
}

main();