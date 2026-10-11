const fs = require('fs');
const path = require('path');
// Paths are resolved from this file's place in scripts/step/, never typed out:
// the project moved once and every hardcoded 'e:/claude code/...' in here
// broke silently, writing nothing and reporting success.
const ROOT = path.join(__dirname, '..', '..');
const htmlPath = path.join(ROOT, 'apps/step-arena/step-arena.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(/<I\.Clock/g, '<I.Timer');

fs.writeFileSync(htmlPath, html);
console.log('Fixed I.Clock to I.Timer!');
