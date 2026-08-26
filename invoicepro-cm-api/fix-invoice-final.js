const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

// 1. Force ALL catch blocks to use the exact variable name 'error' with type 'any'
code = code.replace(/catch\s*\([a-zA-Z_][a-zA-Z0-9_]*(?::\s*any)?\s*\)/g, 'catch (error: any)');

// 2. Replace the broken 'err' references we added earlier with 'error'
code = code.replace(/err \? \(err\.message \|\| String\(err\)\) : "Server error"/g, 'error ? (error.message || String(error)) : "Server error"');
code = code.replace(/err \? \(err\.message \|\| String\(err\)\) : "Internal server error"/g, 'error ? (error.message || String(error)) : "Server error"');

fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
console.log('✅ Fixed all catch blocks to use "error" variable!');
