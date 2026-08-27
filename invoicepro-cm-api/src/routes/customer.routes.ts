import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    console.log("ðŸ”µ CREATING CUSTOMER FOR USER:", userId);
    
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
      },
    });
    return res.status(201).json({ message: "Customer created", customer });
  } catch (err: any) {
    console.error("âŒ CUSTOMER ERROR:", err.message);
    return res.status(500).json({ error: err.message, meta: err.meta });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const customers = await prisma.customer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return res.json({ customers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// UPDATE CUSTOMER
router.put("/:id", async (req: any, res) => {
  try {
    const userId = (req as any).userId as string;
    const { id } = req.params;
    const { name, email, phone, address, city, notes, locale } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id, userId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name?.trim() || customer.name,
        email: email?.trim() || customer.email,
        phone: phone?.trim() || customer.phone,
        address: address?.trim() || customer.address,
        city: city?.trim() || customer.city,
        notes: notes?.trim() || customer.notes,
        locale: locale || customer.locale,
      },
    });

    res.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error("Update customer error:", error.message);
    res.status(500).json({ message: "Failed to update customer" });
  }
});


// DELETE CUSTOMER
router.delete("/:id", async (req: any, res) => {
  try {
    const userId = (req as any).userId as string;
    const { id } = req.params;

    console.log(`🗑️ Deleting customer ${id} for user ${userId}`);

    const customer = await prisma.customer.findFirst({
      where: { id, userId },
    });

    if (!customer) {
      console.log(`❌ Customer ${id} not found for user ${userId}`);
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check if customer has invoices before deleting
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: id },
    });

    if (invoiceCount > 0) {
      console.log(`⚠️ Cannot delete: customer has ${invoiceCount} invoices`);
      return res.status(400).json({ 
        message: `Cannot delete customer with ${invoiceCount} invoice(s). Delete invoices first.` 
      });
    }

    await prisma.customer.delete({ where: { id } });
    console.log(`✅ Customer ${id} deleted successfully`);
    
    res.json({ success: true, message: "Customer deleted" });
  } catch (error: any) {
    console.error("❌ Delete customer error:", error.message);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});
export default router;
