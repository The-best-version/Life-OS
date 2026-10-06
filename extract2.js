const fs = require('fs');

const file = 'E:/claude code/LifeOS.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('const STORAGE_KEY ='));
const endIdx = lines.findIndex(l => l.includes('const claimHandover =')) + 10;

console.log('Start:', startIdx, lines[startIdx]);
console.log('End:', endIdx, lines[endIdx]);

const extracted = lines.slice(startIdx, endIdx + 1);

let storageCode = extracted.join('\n');

const exportsList = [
  'STORAGE_KEY', 'primaryOrigin', 'served', 'isLocalHost', 'strayCopy',
  'api', 'syncLocal', 'REV_KEY', 'readRev', 'writeRev', 'SYNC_DEBOUNCE',
  'DISK_STUCK_MS', 'onSyncResult', 'postSync', 'syncOut', 'flushSync',
  'adoptDisk', 'UI_KEY', 'OPENED_KEY', 'LOCK_KEY', 'TAB_KEY', 'HANDOVER_KEY',
  'HANDOVER_GRACE', 'LEASE_BEAT', 'LEASE_STALE', 'tabId', 'readLock',
  'writeLock', 'dropLock', 'claimHandover'
];

exportsList.forEach(name => {
  storageCode = storageCode.replace(new RegExp('^const ' + name + ' =', 'm'), 'export const ' + name + ' =');
  storageCode = storageCode.replace(new RegExp('^function ' + name + '\\b', 'm'), 'export function ' + name);
  storageCode = storageCode.replace(new RegExp('^let ' + name + ' =', 'm'), 'export let ' + name + ' =');
  storageCode = storageCode.replace(new RegExp('^async function ' + name + '\\b', 'm'), 'export async function ' + name);
});

storageCode = 'import { uid } from \"./life-state.mjs\";\n\n' + storageCode;

fs.writeFileSync('E:/claude code/life-storage.mjs', storageCode);

const importStmt = 'import { ' + exportsList.filter(e => !['UI_KEY', 'OPENED_KEY', 'LOCK_KEY', 'TAB_KEY', 'HANDOVER_KEY', 'HANDOVER_GRACE', 'LEASE_BEAT', 'LEASE_STALE', 'SYNC_DEBOUNCE', 'isLocalHost', 'api', 'REV_KEY'].includes(e)).join(', ') + ', SYNC_DEBOUNCE, LEASE_BEAT, LEASE_STALE } from \"./life-storage.mjs\";';

const newLines = [
  ...lines.slice(0, startIdx),
  importStmt,
  ...lines.slice(endIdx + 1)
];

fs.writeFileSync(file, newLines.join('\n'));
console.log('Extraction complete!');
