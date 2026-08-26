const fs = require('fs');
let code = fs.readFileSync('src/routes/profile.routes.ts', 'utf8');

const accountRoute = `
// UPDATE ACCOUNT INFO (fullName, email)
router.patch("/account", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    const { fullName, email } = req.body;

    if (!fullName && !email) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    // Check if email is already taken by another user
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) {
        return res.status(400).json({ error: "This email is already in use" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
      },
      select: { id: true, fullName: true, email: true, createdAt: true },
    });

    return res.json({ message: "Account updated successfully!", user: updatedUser });
  } catch (err: any) {
    console.error("UPDATE ACCOUNT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
`;

if (!code.includes('"/account"')) {
  code = code.replace('export default router;', accountRoute + '\nexport default router;');
  fs.writeFileSync('src/routes/profile.routes.ts', code, 'utf8');
  console.log('✅ PATCH /profile/account route added!');
} else {
  console.log('⚠️ Route already exists.');
}
