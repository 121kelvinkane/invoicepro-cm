const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

// Find the block where the payment is marked as SUCCESSFUL
const oldBlock = `    if (data.status === "SUCCESSFUL") {
      const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
      if (invoice && invoice.status !== "PAID") {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", amountPaid: Number(data.amount || invoice.total), balanceDue: 0 },
        });
      }
      return res.json({ status: "PAID" });
    }`;

// Replace it with the block that ALSO sends the money to the business owner
const newBlock = `    if (data.status === "SUCCESSFUL") {
      const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
      if (invoice && invoice.status !== "PAID") {
        // 1. Mark invoice as PAID
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", amountPaid: Number(data.amount || invoice.total), balanceDue: 0 },
        });

        // 2. INSTANT PAYOUT: Send money to the business owner's MoMo number
        try {
          const businessProfile = await prisma.businessProfile.findUnique({ where: { userId } });
          if (businessProfile && businessProfile.phone) {
            // Clean phone number to 2376xxxxxxxx format
            let momoNumber = businessProfile.phone.replace(/\\s/g, "").replace(/\\+/g, "");
            if (!momoNumber.startsWith("237")) momoNumber = "237" + momoNumber;

            const withdrawalRes = await fetch("https://demo.campay.net/api/withdraw/", {
              method: "POST",
              headers: {
                Authorization: \`Token \${campayToken}\`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                amount: Math.round(Number(invoice.total)),
                to: momoNumber,
                description: \`Payout for Invoice \${invoice.invoiceNumber}\`,
                external_reference: randomUUID(),
              }),
            });
            const withdrawalData = await withdrawalRes.json();
            console.log("CAMPAY WITHDRAWAL RESPONSE:", JSON.stringify(withdrawalData));
          } else {
            console.log("No business profile or phone number found for user:", userId);
          }
        } catch (withdrawErr: any) {
          console.error("Failed to send instant payout:", withdrawErr.message);
          // Note: We don't fail the whole request here. The invoice is still marked PAID.
        }
      }
      return res.json({ status: "PAID" });
    }`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
console.log('✅ Instant Payout logic added! Money will be sent to business owners automatically.');
