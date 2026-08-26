const fs = require('fs');

// 1. Update customer.routes.ts to expose the exact error
const customerCode = `import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { createCustomerSchema, updateCustomerSchema } from "../validation/customer.schema";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    
    const customer = await prisma.customer.create({ data: { userId, ...parsed.data } });
    return res.status(201).json({ message: "Customer created successfully", customer });
  } catch (err: any) {
    console.error("❌ REAL CUSTOMER ERROR:", err);
    // FORCE THE EXACT ERROR TO SHOW IN THE BROWSER
    return res.status(500).json({ error: err.message, code: err.code, meta: err.meta });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId as string;
    const customers = await prisma.customer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return res.json({ customers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
`;
fs.writeFileSync('src/routes/customer.routes.ts', customerCode, 'utf8');
console.log('✅ customer.routes.ts updated');

// 2. Add test route to server.ts
let serverCode = fs.readFileSync('src/server.ts', 'utf8');
if (!serverCode.includes('test-health')) {
    serverCode = serverCode.replace('app.use(helmet', 'app.get("/api/v1/test-health", (req, res) => res.json({ status: "alive V99" }));\napp.use(helmet');
    fs.writeFileSync('src/server.ts', serverCode, 'utf8');
    console.log('✅ test-health route added to server.ts');
}

// 3. Delete junk JS files
['add-test.js', 'fix-customer.js', 'fix-package.js', 'fix-profile.js', 'unlock-errors.js', 'cache-buster.js'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
});
