const fs = require('fs');
let app = fs.readFileSync('src/app.ts', 'utf8');
if (!app.includes('/test-health')) {
    app = app.replace('app.use(', 'app.get("/api/v1/test-health", (req, res) => res.json({ status: "alive", code: "latest" }));\napp.use(');
    fs.writeFileSync('src/app.ts', app, 'utf8');
    console.log('✅ Added test-health route!');
} else {
    console.log('⚠️ Test route already exists');
}
