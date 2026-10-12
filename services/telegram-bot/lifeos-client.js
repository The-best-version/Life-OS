/* --- the only thing here that touches the state -------------------------
 *  The bot is a third writer: the browser window is the first, the recovery
 *  centre's restore the second. Everything that makes that safe already
 *  exists in `services/local-sync-server.js`, and this file's whole job is to
 *  go through it rather than around it.
 *
 *  `GET /state` hands back the file on disk; `POST /sync` writes it with a
 *  revision, refuses a write that is behind, stows a shrinking one in
 *  backups/guard/ and keeps the generation before it as .prev.json. Writing
 *  graphify-out/data/lifeos.json directly would bypass every one of those,
 *  so nothing in this folder knows that path.
 *
 *  Two details that are not optional:
 *
 *  - **No Origin header.** The server allows `POST /sync` only from the
 *    origin it serves itself, with one seam: a request with no Origin at all
 *    is "curl and this machine's own tools", which is exactly what this is.
 *    Node's fetch sends none unless told to, so nothing here sets one — and
 *    nothing here may start to.
 *  - **The revision is read, not remembered.** The counter is on disk, not
 *    in this process. A revision cached across a restart is a write that
 *    arrives behind the file and is rightly refused.
 * --------------------------------------------------------------------- */
import {
  migrate,
  rollDay,
  freshState,
  carryOf,
  dayKey,
} from "../../src/state/life-state.mjs";
import { CONFIG } from "./config.js";

const PROJECT = "lifeos";
/* Three attempts, because a 409 means the disk moved between the read and
   the write — which is a real race with an open window, and re-reading and
   re-applying the change is the whole answer to it. Beyond three the disk is
   not racing, something is wrong, and saying so beats looping. */
const ATTEMPTS = 3;

export class DiskError extends Error {}

/* The payload on disk, with the revision it carries. `rev` absent comes back
   as 0 and never as null: the server accepts a payload with no revision —
   the counter has to start somewhere — and `rev + 1` has to mean 1 there. */
async function readDisk() {
  let res;
  try {
    res = await fetch(`${CONFIG.origin}/state?project=${PROJECT}`, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    throw new DiskError(
      "ما قدرت أوصل للخادم المحلي. تأكد أن 2027 Life OS شغّال على هذا الجهاز.",
    );
  }
  if (res.status === 404) return null; // no file, or one that will not parse
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

/* The disk payload, brought up to today — the app's own `loadState` minus
   localStorage, and deliberately the same three lines:
 *
 *    migrate it, and if it is still today's day fill in whatever keys this
 *    build added since it was written; otherwise roll the day.
 *
 *  Rolling from here is not overreach. A payload still holding yesterday's
 *  ticks would have today's tick written onto yesterday's roll call, and the
 *  only correct rollover is the one in the state layer — `rollDay` writes the
 *  gap rows for the days a closed laptop missed, promotes last night's three
 *  and reads the streak back off the archive. One implementation, called by
 *  both. In practice this only ever fires when no window is open, because a
 *  window that is open has already rolled it.
 */
function bring(raw) {
  const saved = migrate(raw);
  if (saved.date === dayKey()) return { ...freshState(carryOf(saved)), ...saved };
  return rollDay(saved);
}

async function postSync(payload, rev, headers = {}) {
  let res;
  try {
    res = await fetch(`${CONFIG.origin}/sync`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        /* The server drops any POST without this, so a stray form submission
           from a page cannot reach the write path. */
        "x-local-sync": "1",
        ...headers,
      },
      body: JSON.stringify({ project: PROJECT, payload: { ...payload, rev } }),
    });
  } catch {
    throw new DiskError("الكتابة ما وصلت للقرص. الخادم المحلي متوقف؟");
  }
  if (res.status === 409) return { conflict: true };
  if (res.status === 403) {
    throw new DiskError(
      "الخادم رفض الكتابة. LIFEOS_ORIGIN يشير إلى منفذ غير الذي يخدم النسخة.",
    );
  }
  if (!res.ok) throw new DiskError(`الكتابة رُفضت (${res.status}).`);
  return { ok: true };
}

/* --- one writer at a time --------------------------------------------- *
 *  Two messages arriving a second apart would otherwise both read revision
 *  N, both write N+1, and the second would be refused — or worse, land and
 *  silently drop the first one's row. A promise chain makes every change a
 *  read-modify-write with nothing interleaved.
 * ---------------------------------------------------------------------- */
let tail = Promise.resolve();
const serialize = (fn) => {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

/* `change(state)` gets the day as the app would have loaded it and returns
   either `{ next }` — the whole state to write — or `{ refused }`, which is
   written nowhere and handed straight back to be said out loud.
 *
 *  A missing file is refused rather than seeded. The bot is an input device,
 *  not a profile: if `/state` has nothing to hand back, the honest answer is
 *  to say so, because seeding a year from a phone message would put seed data
 *  on top of a file that may only be temporarily unreadable.
 */
export function withState(change) {
  return serialize(async () => {
    let lastConflict = false;
    for (let i = 0; i < ATTEMPTS; i++) {
      const disk = await readDisk();
      if (!disk) {
        return {
          refused:
            "ما فيه نسخة على القرص بعد. افتح 2027 Life OS مرة واحدة على الحاسب، وبعدها البوت يكتب عليها.",
        };
      }
      const out = change(bring(disk.raw)) || {};
      if (!out.next) return out;
      const posted = await postSync(out.next, disk.rev + 1, out.headers);
      if (posted.ok) return { ...out, rev: disk.rev + 1 };
      lastConflict = true;
    }
    throw new DiskError(
      lastConflict
        ? "القرص يتغيّر أسرع من الكتابة. جرّب بعد لحظة."
        : "الكتابة ما نجحت.",
    );
  });
}

/* A read with no write. The briefs and «/يومي» use this — nothing is sent to
   the server at all, so reading the day can never move it. */
export function readLife() {
  return serialize(async () => {
    const disk = await readDisk();
    return disk ? bring(disk.raw) : null;
  });
}
