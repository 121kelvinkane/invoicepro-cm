const fs = require('fs');
let code = fs.readFileSync('src/routes/profile.routes.ts', 'utf8');

// Add a POST route to CREATE the business profile if it doesn't exist
if (!code.includes('router.post')) {
  const postRoute = `
// CREATE business profile
router.post("/", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const jwt = require("jsonwebtoken");
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    const { name, phone, email, address, city, logoUrl, defaultVatRate, invoiceLanguage } = req.body;

    // Check if profile already exists
    const existing = await prisma.businessProfile.findFirst({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: "Business profile already exists. Use PUT to update." });
    }

    // Create the profile
    const profile = await prisma.businessProfile.create({
      data: {
        userId,
        name: name || "My Business",
        phone: phone || "",
        email: email || "",
        address: address || "",
        city: city || "",
        logoUrl: logoUrl || "",
        defaultVatRate: defaultVatRate || 0,
        invoiceLanguage: invoiceLanguage || "en",
      },
    });

    return res.status(201).json({ message: "Business profile created!", profile });
  } catch (err: any) {
    console.error("❌ CREATE PROFILE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
`;
  // Insert the POST route before the last line
  code = code.replace('export default router;', postRoute + '\nexport default router;');
  fs.writeFileSync('src/routes/profile.routes.ts', code, 'utf8');
  console.log('✅ POST route added to create business profile!');
} else {
  console.log('⚠️ POST route already exists.');
}
