const fs = require('fs');
const html = fs.readFileSync('C:/Users/zeyad/.gemini/antigravity-ide/brain/c76eb59c-bd37-4f19-a789-099fad917c37/.system_generated/steps/605/content.md', 'utf8');

const m = html.match(/https?:\/\/(?:drive\.google\.com|soundcloud\.com|youtube\.com|youtu\.be)[^\s\"\'<>]+/gi) || [];
console.log('Media Links:', m.length, m);

const textMatch = html.match(/class=['"]post-body[^>]*>([\s\S]*?)<div class=['"]post-footer/);
if (textMatch) {
  fs.writeFileSync('e:/claude code/post-body.html', textMatch[1], 'utf8');
  console.log('Saved post body to e:/claude code/post-body.html');
}
