/* --- الشيء الوحيد هنا الذي يلمس الحالة -----------------------------------
 *  نفس `services/telegram-bot/lifeos-client.js` بالحرف — القرص عنده
 *  مصدر الحقيقة الوحيد، ويُصَل إليه عبر `local-sync-server.js` فقط:
 *  `GET /state` يُعيد الملف، `POST /sync` يكتبه برقم إصدار ويرفض كتابة
 *  متأخّرة. هذا البوت كاتب رابع للملف نفسه (المتصفح، مركز الاسترجاع،
 *  بوت Life OS، وهذا) — والذهاب عبر الباب نفسه هو ما يمنعهم من الاختلاف.
 * --------------------------------------------------------------------- */
import { migrate, rollDay, freshState, carryOf, dayKey } from "../../src/state/life-state.mjs";
import { CONFIG } from "./config.js";

const PROJECT = "lifeos";
const ATTEMPTS = 3;

export class DiskError extends Error {}

async function readDisk() {
  let res;
  try {
    res = await fetch(`${CONFIG.origin}/state?project=${PROJECT}`, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    throw new DiskError("ما قدرت أوصل للخادم المحلي. تأكد أن 2027 Life OS شغّال على هذا الجهاز.");
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
    res = await fetch(`${CONFIG.origin}/sync`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-local-sync": "1" },
      body: JSON.stringify({ project: PROJECT, payload: { ...payload, rev } }),
    });
  } catch {
    throw new DiskError("الكتابة ما وصلت للقرص. الخادم المحلي متوقف؟");
  }
  if (res.status === 409) return { conflict: true };
  if (res.status === 403) {
    throw new DiskError("الخادم رفض الكتابة. LIFEOS_ORIGIN يشير إلى منفذ غير الذي يخدم النسخة.");
  }
  if (!res.ok) throw new DiskError(`الكتابة رُفضت (${res.status}).`);
  return { ok: true };
}

let tail = Promise.resolve();
const serialize = (fn) => {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

/* `change(state)` تأخذ اليوم كما يحمّله التطبيق وتعيد إما `{ next }` —
   الحالة كاملة لتُكتب مكانها — أو `{ refused }`، التي لا تُكتب في أي مكان
   وتُقال كما هي. */
export function withState(change) {
  return serialize(async () => {
    for (let i = 0; i < ATTEMPTS; i++) {
      const disk = await readDisk();
      if (!disk) {
        return { refused: "ما فيه نسخة على القرص بعد. افتح 2027 Life OS مرة واحدة على الحاسب، وبعدها البوت يكتب عليها." };
      }
      const out = change(bring(disk.raw)) || {};
      if (!out.next) return out;
      const posted = await postSync(out.next, disk.rev + 1);
      if (posted.ok) return { ...out, rev: disk.rev + 1 };
    }
    throw new DiskError("القرص يتغيّر أسرع من الكتابة. جرّب بعد لحظة.");
  });
}

export function readLife() {
  return serialize(async () => {
    const disk = await readDisk();
    return disk ? bring(disk.raw) : null;
  });
}
