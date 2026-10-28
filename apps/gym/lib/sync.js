/* --- القرص: نفس بروتوكول بوت تيليجرام، في المتصفح -------------------------
 *  `GET /state` يُعيد الملف، `POST /sync` يكتبه برقم إصدار ويرفض كتابة
 *  متأخّرة. قراءة ثم تعديل ثم كتابة، ثلاث محاولات عند تعارض 409، وطابور
 *  واحد محلي كي لا يتزاحم تسجيلان على الرقم نفسه. راجع
 *  `services/telegram-bot/lifeos-client.js` — هذا الملف هو نفس الفكرة.
 * --------------------------------------------------------------------- */
import { migrate, rollDay, freshState, carryOf, dayKey } from "/src/state/life-state.mjs";

const PROJECT = "lifeos";
const ATTEMPTS = 3;

export class DiskError extends Error {}

async function readDisk() {
  let res;
  try {
    res = await fetch(`/state?project=${PROJECT}`, { headers: { "cache-control": "no-store" } });
  } catch {
    throw new DiskError("ما قدرت أوصل للخادم. تأكد من الاتصال.");
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new DiskError(`الخادم ردّ ${res.status}.`);
  let raw;
  try {
    raw = await res.json();
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rev = Number(raw.rev);
  return { raw, rev: Number.isFinite(rev) ? rev : 0 };
}

function bring(raw) {
  const saved = migrate(raw);
  if (saved.date === dayKey()) return { ...freshState(carryOf(saved)), ...saved };
  return rollDay(saved);
}

async function postSync(payload, rev) {
  let res;
  try {
    res = await fetch("/sync", {
      method: "POST",
      headers: { "content-type": "application/json", "x-local-sync": "1" },
      body: JSON.stringify({ project: PROJECT, payload: { ...payload, rev } }),
    });
  } catch {
    throw new DiskError("الكتابة ما وصلت للقرص. تحقّق من الاتصال.");
  }
  if (res.status === 409) return { conflict: true };
  if (res.status === 403) throw new DiskError("الخادم رفض الكتابة — هذا الموقع ليس الأصل المسموح له بالكتابة.");
  if (!res.ok) throw new DiskError(`الكتابة رُفضت (${res.status}).`);
  return { ok: true };
}

let tail = Promise.resolve();
function serialize(fn) {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/* `change(state)` يأخذ اليوم كما يحمّله التطبيق ويعيد الحالة كاملة ليُكتب
   مكانها. لا يُخترع ملف جديد لو كان القرص خالياً — هذا الموقع جهاز إدخال،
   لا ملف شخصي. */
export function withState(change) {
  return serialize(async () => {
    for (let i = 0; i < ATTEMPTS; i++) {
      const disk = await readDisk();
      if (!disk) throw new DiskError("لا توجد نسخة على القرص بعد — افتح 2027 Life OS مرة واحدة على الحاسب أولاً.");
      const next = change(bring(disk.raw));
      const posted = await postSync(next, disk.rev + 1);
      if (posted.ok) return next;
    }
    throw new DiskError("القرص يتغيّر أسرع من الكتابة — جرّب بعد لحظة.");
  });
}

export function readLife() {
  return serialize(async () => {
    const disk = await readDisk();
    return disk ? bring(disk.raw) : null;
  });
}
