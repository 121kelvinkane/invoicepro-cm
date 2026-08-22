const fs = require('fs');
let c = fs.readFileSync('src/routes/customer.routes.ts', 'utf8');
// Replace the hidden errors with loud, descriptive ones
c = c.replace(/console\.error\(error\);/g, 'console.error("❌ CUSTOMER ERROR:", error);');
c = c.replace(/message: "Internal server error"/g, 'message: error.message || "Internal server error"');
fs.writeFileSync('src/routes/customer.routes.ts', c, 'utf8');
console.log('✅ Unlocked error messages!');
