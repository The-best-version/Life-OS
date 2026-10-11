/* --- places and the calendar --------------------------------------------
 *  The cities prayer times are computed for, and the calendar's own events —
 *  kept together as "scheduling context", distinct from the evening prep
 *  (which owns no appointment of its own) in life-state-tasks.mjs.
 * --------------------------------------------------------------------- */
import { uid, obj, isKey, dayKey, hhmm, keyToDate, fmtDay, addDays, daysUntil, minsIn } from "./life-state-util.mjs";

export const PLACES = [
  { id: "riyadh", label: "الرياض", lat: 24.7136, lng: 46.6753, tz: 3 },
  { id: "makkah", label: "مكة المكرمة", lat: 21.3891, lng: 39.8579, tz: 3 },
  { id: "madinah", label: "المدينة المنورة", lat: 24.5247, lng: 39.5692, tz: 3 },
  { id: "jeddah", label: "جدة", lat: 21.4858, lng: 39.1925, tz: 3 },
  { id: "dammam", label: "الدمام", lat: 26.4207, lng: 50.0888, tz: 3 },
  { id: "abha", label: "أبها", lat: 18.2164, lng: 42.5053, tz: 3 },
  { id: "buraydah", label: "بريدة", lat: 26.326, lng: 43.975, tz: 3 },
  { id: "tabuk", label: "تبوك", lat: 28.3835, lng: 36.5662, tz: 3 },
  { id: "hail", label: "حائل", lat: 27.5114, lng: 41.7208, tz: 3 },
  { id: "jizan", label: "جازان", lat: 16.8892, lng: 42.5611, tz: 3 },
];
export const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));

export const placeShape = (p) => {
  const o = obj(p);
  const seed = PLACE_BY_ID.get(o.id) || PLACES[0];
  /* Unary `+` turns null, [], "" and false into 0, and 0 is a perfectly
     plausible-looking longitude — so a payload that lost a field came back
     sitting on the prime meridian at UTC+0 and the prayer times were three
     hours out without anything looking broken. Only a real number, or a
     string that is entirely one, is allowed to pass. */
  const num = (v, fb, lim) => {
    const n =
      typeof v === "number"
        ? v
        : typeof v === "string" && v.trim() !== ""
          ? Number(v)
          : NaN;
    return Number.isFinite(n) && Math.abs(n) <= lim ? n : fb;
  };
  return {
    id: PLACE_BY_ID.has(o.id) ? o.id : o.id === "custom" ? "custom" : seed.id,
    label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : seed.label,
    lat: num(o.lat, seed.lat, 90),
    lng: num(o.lng, seed.lng, 180),
    tz: num(o.tz, seed.tz, 14),
    /* 1 = Shafii, 2 = Hanafi. Anything else is not a school. */
    asr: +o.asr === 2 ? 2 : 1,
  };
};

export const EVENT_KINDS = [
  { id: "exam", label: "اختبار", tint: "#FF3B5C" },
  { id: "deadline", label: "موعد تسليم", tint: "#FF7A45" },
  { id: "class", label: "محاضرة أو دورة", tint: "#00C2FF" },
  { id: "meet", label: "مقابلة أو اجتماع", tint: "#5B8CFF" },
  { id: "money", label: "استحقاق مالي", tint: "#FFB020" },
  { id: "social", label: "مناسبة", tint: "#FF4D8D" },
  { id: "travel", label: "سفر", tint: "#9D5CFF" },
  { id: "note", label: "تذكير", tint: "#10B981" },
];
export const REPEATS = [
  { id: "none", label: "مرّة واحدة", short: "" },
  { id: "weekly", label: "كل أسبوع", short: "أسبوعي" },
  { id: "monthly", label: "كل شهر", short: "شهري" },
  { id: "yearly", label: "كل سنة", short: "سنوي" },
];
export const WARN_CHOICES = [0, 1, 3, 7, 14, 30];

export const eventShape = (e) => (
  (e = obj(e)),
  {
  id: e.id || uid(),
  title: typeof e.title === "string" ? e.title : "",
  date: isKey(e.date) ? e.date : dayKey(),
  time: hhmm(e.time),
  kind: EVENT_KINDS.some((k) => k.id === e.kind) ? e.kind : "note",
  repeat: REPEATS.some((r) => r.id === e.repeat) ? e.repeat : "none",
  /* An open-ended weekly entry is a legitimate thing to want, so `null`
     here is a real value and not a missing one. */
  until: isKey(e.until) ? e.until : null,
  place: typeof e.place === "string" ? e.place : "",
  note: typeof e.note === "string" ? e.note : "",
  warn: WARN_CHOICES.includes(Number(e.warn)) ? Number(e.warn) : 0,
  /* Per occurrence, not one flag: a weekly entry ticked this Sunday must
     still be waiting next Sunday, and a boolean cannot say that. */
  doneOn: Array.isArray(e.doneOn)
    ? e.doneOn.filter((d) => typeof d === "string" && isKey(d))
    : [],
});

export const kindOf = (id) =>
  EVENT_KINDS.find((k) => k.id === id) || EVENT_KINDS[EVENT_KINDS.length - 1];

export const repeatOf = (id) => REPEATS.find((r) => r.id === id) || REPEATS[0];

/* How many days before the square itself the entry starts warning. Zero
   means it only speaks on the day — which for an exam is far too late. */
export function occurrences(ev, fromKey, toKey) {
  const start = keyToDate(ev.date);
  const from = keyToDate(fromKey);
  const to = keyToDate(toKey);
  if (!start || !from || !to || to < from) return [];
  const stop = ev.until ? keyToDate(ev.until) : null;
  const last = stop && stop < to ? stop : to;
  if (last < from || last < start) return [];
  const out = [];
  const at = (y, m, d) => new Date(y, m, d);

  if (ev.repeat === "weekly") {
    let x = start;
    if (x < from) {
      const weeks = Math.ceil((from - x) / (7 * 86400000));
      x = at(start.getFullYear(), start.getMonth(), start.getDate() + weeks * 7);
    }
    for (; x <= last; x = at(x.getFullYear(), x.getMonth(), x.getDate() + 7))
      out.push(fmtDay(x));
    return out;
  }

  if (ev.repeat === "monthly") {
    const dom = start.getDate();
    let y = from > start ? from.getFullYear() : start.getFullYear();
    let m = from > start ? from.getMonth() : start.getMonth();
    for (;;) {
      if (at(y, m, 1) > last) break;
      const dim = at(y, m + 1, 0).getDate();
      if (dom <= dim) {
        const d = at(y, m, dom);
        if (d >= from && d >= start && d <= last) out.push(fmtDay(d));
      }
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return out;
  }

  if (ev.repeat === "yearly") {
    const mo = start.getMonth();
    const dom = start.getDate();
    for (let y = from.getFullYear(); y <= last.getFullYear(); y++) {
      if (dom > at(y, mo + 1, 0).getDate()) continue; // 29 Feb, common year
      const d = at(y, mo, dom);
      if (d >= from && d >= start && d <= last) out.push(fmtDay(d));
    }
    return out;
  }

  if (start >= from && start <= last) out.push(ev.date);
  return out;
}

export const isEventDone = (ev, on) => (ev.doneOn || []).includes(on);

/* Timed entries first in clock order, then the day's untimed reminders.
   Sorting "" as a time would float them all to dawn. */
export const byClock = (a, b) => {
  const x = minsIn(a.ev.time);
  const y = minsIn(b.ev.time);
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return x - y;
};

/* date key → the occurrences landing on it, across one window. */
export function eventsIn(list, fromKey, toKey) {
  const map = new Map();
  for (const ev of list || [])
    for (const on of occurrences(ev, fromKey, toKey)) {
      const row = map.get(on);
      if (row) row.push({ ev, on });
      else map.set(on, [{ ev, on }]);
    }
  for (const row of map.values()) row.sort(byClock);
  return map;
}

/* What is coming, flattened and ordered — including anything still unticked
   behind today, because an overdue entry that scrolls out of sight is an
   entry the calendar failed to carry. A ticked past occurrence is done and
   drops out.

   The backlog runs a year and a half rather than two months: a one-off
   deadline from last spring that was never ticked used to fall out of the
   window and then existed nowhere on the screen — still counted in «كل
   المواعيد», still absent from every list. Silence is the one thing an
   overdue entry must not get. */
export const UPCOMING_AHEAD = 365;

export const UPCOMING_BACKLOG = 540;

export function upcoming(list, days = UPCOMING_AHEAD, backlog = UPCOMING_BACKLOG) {
  const today = dayKey();
  const from = addDays(today, -backlog);
  const to = addDays(today, days);
  const out = [];
  for (const ev of list || [])
    for (const on of occurrences(ev, from, to)) {
      if (on < today && isEventDone(ev, on)) continue;
      out.push({ ev, on });
    }
  out.sort((a, b) => (a.on === b.on ? byClock(a, b) : a.on < b.on ? -1 : 1));
  return out;
}

/* The same list, one row per entry instead of one per occurrence.
 *
 *  A weekly class expanded over a year is fifty rows that say the same
 *  thing, and they bury every other entry — the list stops being a list of
 *  what is coming and becomes a printout of one repetition. So a repeating
 *  entry shows the occurrence that actually needs attention (the oldest
 *  overdue one if it has any, otherwise the next) and carries a count of
 *  the rest. Nothing is hidden: every occurrence is still on the grid, and
 *  this is the summary view of it.
 */
export function upcomingRows(list) {
  const rows = upcoming(list);
  const seen = new Map();
  for (const r of rows) {
    const at = seen.get(r.ev.id);
    if (at) at.more += 1;
    else seen.set(r.ev.id, { ...r, more: 0 });
  }
  /* `rows` is already in date order and the first hit per entry is kept,
     so each survivor is that entry's earliest pending occurrence. */
  return [...seen.values()].sort((a, b) =>
    a.on === b.on ? byClock(a, b) : a.on < b.on ? -1 : 1,
  );
}

/* The entries whose warning window is open today and that are not ticked.
   `warn` is days-before, so an exam set to warn at seven starts speaking a
   week out and keeps speaking until the day itself has passed. */
export function alertsOf(list) {
  const today = dayKey();
  const rows = [];
  for (const ev of list || []) {
    if (!ev.warn) continue;
    for (const on of occurrences(ev, today, addDays(today, ev.warn))) {
      if (isEventDone(ev, on)) continue;
      rows.push({ ev, on, left: daysUntil(on) });
    }
  }
  rows.sort((a, b) => a.left - b.left);
  return rows;
}
