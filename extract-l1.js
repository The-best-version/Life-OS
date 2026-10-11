const fs = require('fs');
const html = fs.readFileSync('C:/Users/zeyad/.gemini/antigravity-ide/brain/c76eb59c-bd37-4f19-a789-099fad917c37/.system_generated/steps/635/content.md', 'utf8');

const audioLinks = html.match(/<audio.*?<\/audio>/gi) || [];
const iframeLinks = html.match(/<iframe[^>]*>/gi) || [];
console.log('Audio tags:', audioLinks.length);
console.log('Iframe tags:', iframeLinks.length);

if (iframeLinks.length > 0) {
  console.log('Iframes:', iframeLinks.join('\n'));
}

const media = html.match(/https?:\/\/(?:drive\.google\.com|soundcloud\.com|youtube\.com|youtu\.be|[^"'\s>]+\.mp3)[^\s"'>]+/gi) || [];
console.log('Media Links:', media);

const qMatch = html.match(/const question\s*=\s*\[([\s\S]*?)\];/);
if (qMatch) {
  console.log('Found question array!');
  fs.writeFileSync('e:/claude code/listening-1-qs.txt', qMatch[0], 'utf8');
} else {
  console.log('No question array found.');
}
