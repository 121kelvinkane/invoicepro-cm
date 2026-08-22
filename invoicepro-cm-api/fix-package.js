const fs = require('fs');
let raw = fs.readFileSync('package.json', 'utf8');

// Hunt down and delete the invisible BOM character
if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.substring(1);
}

const pkg = JSON.parse(raw);
pkg.engines = { node: "20.x" };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
console.log('✅ package.json fixed and BOM removed!');
