/* --- generic helpers ---------------------------------------------------
 *  The day boundary, id generation and the small guards every shape in every
 *  domain file is built on. Nothing here depends on anything else in the
 *  split — every domain file imports from this one, never the other way, so
 *  there is no cycle to reason about.
 * --------------------------------------------------------------------- */

/* The day ends when you sleep, not at midnight. Ticking «أذكار النوم» at
   01:00 is finishing yesterday, not starting today — and a sheet that wiped
   itself at 00:00 is why a night of work kept landing on the wrong row and
   then being zeroed by the next morning's reload. Anything written between
   midnight and this hour belongs to the previous day. */
export const DAY_START_HOUR = 4;

/* "Now", shifted onto the logical day it belongs to. */
export const logicalNow = (d = new Date()) => {
  const x = new Date(d.getTime());
  x.setHours(x.getHours() - DAY_START_HOUR);
  return x;
};

/* A calendar date, formatted as a key. The no-argument call means *now* and
   gets the logical day; a call that passes a date means that exact calendar
   square — the month grid and the streak walkers depend on the difference,
   so the shift must not hide inside a default parameter. */
export const fmtDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
export const dayKey = (d) => fmtDay(d === undefined ? logicalNow() : d);

export const yesterdayKey = () => {
  const d = logicalNow();
  d.setDate(d.getDate() - 1);
  return fmtDay(d);
};
export const uid = () => Math.random().toString(36).slice(2, 9);

/* --- the two guards every stored shape is built on -------------------- *
 *  A default parameter fires for `undefined` and for nothing else, so
 *  `shape(null)` sailed straight past `(x = {})` and threw on the first
 *  property read. That is not a theoretical payload: a hand-edited backup,
 *  a half-written download and another app's JSON all produce exactly it,
 *  and `[null]` passes the import check because it is still an array.
 *
 *  `obj` makes a shape total — anything that is not an object becomes an
 *  empty one and every field falls back to its default. `rows` does the
 *  same for a list: the holes are dropped rather than carried forward to
 *  throw later, somewhere with no try/catch around it.
 * ---------------------------------------------------------------------- */
export const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const rows = (v) =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) : [];

export const keyToDate = (ds) => {
  const [y, m, d] = String(ds || "").split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const x = new Date(y, m - 1, d);
  /* Rejects 31 February outright instead of quietly accepting it as the
     3rd of March, which is how an invalid date becomes a wrong one. */
  if (x.getFullYear() !== y || x.getMonth() !== m - 1 || x.getDate() !== d)
    return null;
  return x;
};

export const isKey = (ds) => !!keyToDate(ds);

export const addDays = (ds, n) => {
  const d = keyToDate(ds);
  if (!d) return ds;
  return fmtDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

/* Signed, unlike `daysBetween`, which floors at zero for the streak
   counters. A calendar needs the sign: «متأخر ٣ أيام» and «بعد ٣ أيام» are
   opposite facts, and clamping collapses them into the same number. */
export const hhmm = (v, fallback = "") => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return fallback;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

/* "HH:MM" as minutes past midnight, or null for anything that is not a
   real clock reading. Sorting "" as a time would float every untimed row to
   dawn, which is why the null survives instead of becoming a zero. */
export const minsIn = (v) => {
  const t = hhmm(v);
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};
