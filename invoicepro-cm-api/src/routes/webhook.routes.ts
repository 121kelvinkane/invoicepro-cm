import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transferToOwner } from "../services/campay.service";

const router = Router();

router.post("/campay", async (req, res) => {
  try {
    console.log("🔔 Campay Webhook received:", JSON.stringify(req.body));
    
    const { status, external_reference, amount, reference } = req.body;
    
    if (status === "SUCCESSFUL" && external_reference) {
      const invoice = await prisma.invoice.findUnique({
        where: { publicToken: external_reference },
        include: { user: { select: { businessProfile: true } } },
      });
      
      if (invoice && invoice.status !== "PAID") {
        // 1. Record payment
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            userId: invoice.userId,
            method: "CAMPAY",
            status: "SUCCESS",
            amount: Number(amount),
            providerReference: reference || external_reference,
            paidAt: new Date(),
          },
        });
        
        // 2. Mark invoice PAID
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            amountPaid: Number(amount),
            balanceDue: 0,
            paidAt: new Date(),
          },
        });
        
        console.log(`✅ Invoice ${invoice.invoiceNumber} marked as PAID`);
        
        // 3. AUTO-TRANSFER to Owner's MoMo Number
        const ownerMomo = invoice.user?.businessProfile?.momoNumber;
        if (ownerMomo) {
          try {
            await transferToOwner({
              amount: Number(amount),
              phone: ownerMomo,
              reference: `PAYOUT-${invoice.invoiceNumber}`,
              description: `Auto-payout for ${invoice.invoiceNumber}`,
            });
            console.log(`💰 Money sent to owner MoMo: ${ownerMomo}`);
          } catch (transferErr: any) {
            console.error("❌ Auto-transfer failed:", transferErr.message);
          }
        } else {
          console.log("⚠️ No MoMo Number set. Money stays in Campay wallet.");
        }
      }
    }
    
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error");
  }
});

export default router;
