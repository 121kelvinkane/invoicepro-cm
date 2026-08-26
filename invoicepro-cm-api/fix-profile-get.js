const fs = require('fs');
let code = fs.readFileSync('src/routes/profile.routes.ts', 'utf8');

// Change the GET route to return the profile inside a "profile" key
code = code.replace(
  /res\.json\(safeUser\);/g,
  'res.json({ ...safeUser, profile: safeUser.businessProfile });'
);

fs.writeFileSync('src/routes/profile.routes.ts', code);
console.log('✅ Fixed GET /profile to return the exact "profile" key the frontend expects!');
