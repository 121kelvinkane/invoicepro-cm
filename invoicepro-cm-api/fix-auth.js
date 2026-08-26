const fs = require('fs');

let auth = fs.readFileSync('src/middleware/auth.ts', 'utf8');

// Fix the payload mismatch: look for userId OR sub
if (auth.includes('payload.sub')) {
    auth = auth.replace('(req as any).userId = payload.sub;', '(req as any).userId = payload.userId || payload.sub;');
    fs.writeFileSync('src/middleware/auth.ts', auth, 'utf8');
    console.log('✅ Fixed auth middleware to read userId correctly!');
} else {
    console.log('⚠️ Middleware already fixed or format changed.');
}
