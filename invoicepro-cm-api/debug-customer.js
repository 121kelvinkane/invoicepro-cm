const fs = require('fs');
const code = `import { Router } from "express";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

const router = Router();

// DEBUG ROUTE: Visit this in browser to check your token
router.get("/debug-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "NO TOKEN";
    if (token === "NO TOKEN") return res.json({ error: "Frontend is not sending a token!" });
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    res.json({ 
      message: "Token is valid!", 
      yourUserId: decoded.userId,
      fullPayload: decoded 
    });
  } catch (err: any) {
    res.json({ error: "Token is invalid or expired", details: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId;

    if (!userId) return res.status(400).json({ error: "Token has no userId", payload: decoded });

    // Bypass strict validation for now and just save it directly
    const customer = await prisma.customer.create({ 
      data: { userId, ...req.body } 
    });
    
    return res.status(201).json({ message: "Success", customer });
  } catch (err: any) {
    // FORCE THE EXACT ERROR INTO THE BROWSER NETWORK TAB
    return res.status(500).json({ 
      error: err.message, 
      prismaCode: err.code,
      meta: err.meta
    });
  }
});

export default router;
`;
fs.writeFileSync('src/routes/customer.routes.ts', code, 'utf8');
console.log('✅ customer.routes.ts rewritten with Debug Mode!');
