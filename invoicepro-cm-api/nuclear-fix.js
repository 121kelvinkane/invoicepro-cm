const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('src');
let fixed = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // Replace ALL instances of req.userId with the TypeScript-safe version
    if (content.includes('req.userId')) {
        content = content.replace(/req\.userId/g, '(req as any).userId');
        fs.writeFileSync(f, content, 'utf8');
        console.log('✅ Fixed: ' + f);
        fixed++;
    }
});
console.log('🎉 Total files fixed: ' + fixed);
