const fs = require('fs');
const htmlPath = 'e:/claude code/step-arena.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(/<I\.Clock/g, '<I.Timer');

fs.writeFileSync(htmlPath, html);
console.log('Fixed I.Clock to I.Timer!');
