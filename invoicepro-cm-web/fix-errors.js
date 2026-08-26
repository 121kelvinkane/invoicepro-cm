const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// Fix the frontend to listen to both 'message' and 'error' from the backend
code = code.replace(
  'throw new Error(data.message || "Request failed");',
  'throw new Error(data.message || data.error || "Request failed");'
);

fs.writeFileSync('src/lib/api.ts', code, 'utf8');
console.log('✅ Frontend updated to show exact backend error messages!');
