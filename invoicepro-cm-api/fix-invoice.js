const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

// 1. Fix TypeScript strict mode for catch blocks (prevents build failures)
code = code.replace(/catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g, 'catch ($1: any)');

// 2. Expose the exact database error in the 'message' field so the frontend shows it on screen!
code = code.replace(/message:\s*["']Internal server error["']/g, 'message: err ? (err.message || String(err)) : "Server error"');
code = code.replace(/message:\s*["']Server error["']/g, 'message: err ? (err.message || String(err)) : "Server error"');

fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
console.log('✅ invoice.routes.ts updated to expose real errors on screen!');
