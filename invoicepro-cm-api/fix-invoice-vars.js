const fs = require('fs');
let code = fs.readFileSync('src/routes/invoice.routes.ts', 'utf8');

// 1. Ensure all catch blocks have ': any' to satisfy strict TypeScript
code = code.replace(/catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g, 'catch ($1: any)');

// 2. Smart replacement: Find the catch variable name and use IT to show the error
code = code.replace(/catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*any)?\s*\)([\s\S]*?)message:\s*["'](?:Internal server error|Server error)["']/g, 
  (match, varName) => {
    // Replace the generic string with the actual variable name found in the catch block
    return match.replace(/message:\s*["'](?:Internal server error|Server error)["']/, `message: ${varName} ? (${varName}.message || String(${varName})) : "Server error"`);
  }
);

fs.writeFileSync('src/routes/invoice.routes.ts', code, 'utf8');
console.log('✅ invoice.routes.ts fixed with correct error variable names!');
