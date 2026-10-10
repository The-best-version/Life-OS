/* --- places and the calendar --------------------------------------------
 *  The cities prayer times are computed for, and the calendar's own events —
 *  kept together as "scheduling context", distinct from the evening prep
 *  (which owns no appointment of its own) in life-state-tasks.mjs.
 * --------------------------------------------------------------------- */
import { uid, obj, isKey, dayKey, hhmm } from "./life-state-util.mjs";

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
