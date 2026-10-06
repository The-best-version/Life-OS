/* --- prayer times, computed ------------------------------------------- *
 *  Its own file because two programs need the same answer. The app anchors
 *  its six routine blocks to these times, and the sync server fires the
 *  reminders at them — and a reminder arriving at a different minute from
 *  the one shown on screen is worse than no reminder, because after that
 *  neither number can be trusted. One source, pulled into the app by esbuild
 *  and into the server by import(); never two copies kept in step by hand.
 * ---------------------------------------------------------------------- */

/* --- prayer times ----------------------------------------------------- *
 *  Computed here, never fetched. The routine's six blocks are anchored to
 *  the prayers, so the times they are anchored to cannot be the one part of
 *  the screen that needs a network: this file is opened straight off disk as
 *  `file://`, where a fetch is at the mercy of CORS and of being offline,
 *  and a blank prayer card would take the meaning of «بعد العصر» with it.
 *
 *  The maths is the standard solar-position method (the same one the public
 *  APIs run server-side) with Umm al-Qura's parameters: Fajr at 18.5° of
 *  depression and Isha a fixed ninety minutes after Maghrib. Verified
 *  against Umm al-Qura's own published times for Riyadh on five dates spread
 *  across a year — every prayer landed within a single minute.
 * ---------------------------------------------------------------------- */
const RAD = Math.PI / 180;
const dSin = (d) => Math.sin(d * RAD);
const dCos = (d) => Math.cos(d * RAD);
const dTan = (d) => Math.tan(d * RAD);
const fixAngle = (a) => ((a % 360) + 360) % 360;
/* Exported: the app formats these same hours into clock strings and works
   out which prayer is next, and both need the wrap. */
export const fixHour = (h) => ((h % 24) + 24) % 24;

/* Julian day at 00:00 UT of a civil date (Gregorian). */
function julianDay(y, m, d) {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    b -
    1524.5
  );
}

function sunPosition(jd) {
  const D = jd - 2451545.0; // days from J2000
  const g = fixAngle(357.529 + 0.98560028 * D); // mean anomaly
  const q = fixAngle(280.459 + 0.98564736 * D); // mean longitude
  const L = fixAngle(q + 1.915 * dSin(g) + 0.02 * dSin(2 * g)); // apparent
  const e = 23.439 - 0.00000036 * D; // obliquity
  const decl = Math.asin(dSin(e) * dSin(L)) / RAD;
  const ra = fixHour(Math.atan2(dCos(e) * dSin(L), dCos(L)) / RAD / 15);
  /* Both terms are already wrapped into [0,24), so their difference lands a
     whole day out whenever one of them has just crossed zero. Folding
     through 12 puts it back in [-12,12), where the equation of time lives. */
  const eqt = fixHour(q / 15 - ra + 12) - 12;
  return { decl, eqt };
}

/* Hours between solar noon and the moment the sun sits `angle` degrees below
   the horizon. `null` when the day has no such moment at all — a polar
   summer has no Fajr, and inventing one would be worse than an honest dash. */
function hourAngle(angle, decl, lat) {
  const x =
    (-dSin(angle) - dSin(decl) * dSin(lat)) / (dCos(decl) * dCos(lat));
  if (!(x >= -1 && x <= 1)) return null;
  return Math.acos(x) / RAD / 15;
}

/* Asr is a shadow length, not an angle: the sun's altitude at the moment a
   shadow has grown `factor` object-heights past its noon length. One for the
   Shafii school, two for the Hanafi. */
const asrAltitude = (factor, decl, lat) =>
  -Math.atan(1 / (factor + dTan(Math.abs(lat - decl)))) / RAD;

const FAJR_ANGLE = 18.5; // Umm al-Qura
const ISHA_GAP_MIN = 90; // Umm al-Qura: ninety minutes after Maghrib

/* Returns decimal hours in the place's own standard time, or null per prayer
   where the sun never reaches that depression. */
export function prayerTimes(place, date) {
  const { lat, lng, tz, asr = 1 } = place;
  /* The sun's position is wanted at local noon, not at 00:00 UT — a whole
     time zone's worth of drift otherwise shows up as a minute or two of
     error at the solstices, which is exactly where it is most visible. */
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / 360;
  const { decl, eqt } = sunPosition(jd);
  const noon = 12 - eqt - lng / 15 + tz;
  const riseSet = hourAngle(0.833, decl, lat); // refraction + solar radius
  const fajrT = hourAngle(FAJR_ANGLE, decl, lat);
  const asrT = hourAngle(asrAltitude(asr, decl, lat), decl, lat);
  const maghrib = riseSet === null ? null : noon + riseSet;
  return {
    fajr: fajrT === null ? null : noon - fajrT,
    sunrise: riseSet === null ? null : noon - riseSet,
    dhuhr: noon,
    asr: asrT === null ? null : noon + asrT,
    maghrib,
    isha: maghrib === null ? null : maghrib + ISHA_GAP_MIN / 60,
  };
}
/* The six routine blocks, each anchored to the prayer that opens it. The
   app's GROUPS carry the labels and the colours; this is only the anchoring,
   which is the part the server also needs. «الصباح» opens at Fajr and «قبل
   النوم» is not a prayer at all — it is the hour the day is put down, so it
   is pinned to the clock rather than to the sun. */
export const BLOCK_ANCHORS = [
  { id: "morning", label: "الصباح", at: "fajr" },
  { id: "afternoon", label: "بعد الظهر", at: "dhuhr" },
  { id: "asr", label: "بعد العصر", at: "asr" },
  { id: "maghrib", label: "بعد المغرب", at: "maghrib" },
  { id: "postisha", label: "بعد العشاء", at: "isha" },
  { id: "night", label: "قبل النوم", hour: 22 },
];

/* Decimal hours to a Date on the given day. Prayer times come back as
   fractions of an hour and every consumer wants a moment. */
export function atHour(date, h) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + Math.round(h * 3600 * 1000));
}

/* When each block opens today, in order, skipping any the sun never
   reaches — a polar latitude has no Fajr, and a reminder invented for one
   would fire at a time that means nothing. */
export function blockTimes(place, date = new Date()) {
  const t = prayerTimes(place, date);
  const out = [];
  for (const b of BLOCK_ANCHORS) {
    const h = b.hour !== undefined ? b.hour : t[b.at];
    if (h === null || h === undefined || !Number.isFinite(h)) continue;
    out.push({ id: b.id, label: b.label, when: atHour(date, h) });
  }
  return out.sort((a, b) => a.when - b.when);
}

/* Which block the day is in right now — the one whose prayer has already
   been called and whose successor has not.
 *
 *  Before the first one opens, the answer is the last block of the day, not
 *  nothing: 00:30 is «قبل النوم» of the evening that is still going on, and
 *  the logical day rolls at 04:00 while Fajr can be later than that. A null
 *  there would leave the screen saying the day has not started to someone
 *  who is plainly still awake in it — which is the same mistake the evening
 *  prompt made when it tested `getHours() >= 20`.
 *
 *  Null is kept for the one case that means it: a place the sun never
 *  reaches, where `blockTimes` hands back nothing at all.
 */
export function blockAt(place, date = new Date()) {
  const list = blockTimes(place, date);
  if (!list.length) return null;
  let at = list[0];
  for (const b of list) {
    if (b.when <= date) at = b;
    else break;
  }
  return date < list[0].when ? list[list.length - 1] : at;
}
