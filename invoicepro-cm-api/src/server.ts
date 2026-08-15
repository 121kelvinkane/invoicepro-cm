import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import customerRoutes from "./routes/customer.routes";
import invoiceRoutes from "./routes/invoice.routes";
import publicRoutes from "./routes/public.routes";
import pdfRoutes from "./routes/pdf.routes";
import emailRoutes from "./routes/email.routes";

const app = express();

app.use(helmet());
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    service: "InvoicePro CM API",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1", pdfRoutes);
app.use("/api/v1", emailRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`InvoicePro CM API running on port ${PORT}`);
});