/* --- history, gaps, the streak and the comeback --------------------------
 *  The archive, how an unrecorded day is written down, a day's score read
 *  back off a row, and the streak math built on top of all three. `pctOfRow`
 *  reads the one score every other part of the app reads — `disciplineOf` —
 *  which is why this is the one domain file that imports from another.
 * --------------------------------------------------------------------- */
import { rows, isKey, addDays, dayKey, logicalNow, fmtDay, daysBetween, DAY_START_HOUR } from "./life-state-util.mjs";
import { disciplineOf } from "./life-state-habits.mjs";

/* How many archive rows are kept, and the discipline a day has to reach to
   bank the streak. */
export const HISTORY_CAP = 500;
export const STREAK_TARGET = 80;

/* --- the days that were never written -------------------------------- *
 *  `history` carried a row for every day the app was opened and nothing at
 *  all for the days it was not, and those are not the same answer. A month
 *  grid with an empty square cannot say whether that day went to zero, was
 *  never opened, or has not happened yet — and an average taken over "the
 *  rows that exist" quietly flatters every stretch where the recording
 *  stopped. 18% across four rows is not the same month as 18% across four
 *  rows and nine silences.
 *
 *  So an unrecorded day is written down as one: `{ date, gap: true }`, and
 *  nothing else. No `done` and no `all`, which is exactly what keeps it out
 *  of the habit ledger, the consistency card and every average — all of them
 *  already gate on `Array.isArray(row.done)`. It draws as «لم يُسجَّل» and it
 *  is counted out loud, because "two days unrecorded this month" is the
 *  number worth seeing.
 *
 *  Today is never a gap. Today is still being lived, and the archive effect
 *  stamps its row the moment the app is open.
 * -------------------------------------------------------------------- */
export const isGap = (row) => !!row && row.gap === true && !Array.isArray(row.done);

/* Ascending by date — the order every writer in the app already appends in,
   and the order `HISTORY_CAP` has to prune from the front of. */
const byDateAsc = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/* How far back a silence is still worth writing down. The same depth the
   server keeps daily snapshots to, and for the same reason: four months is
   as far back as going to look changes anything. Past it, a dashed square is
   not information — and an unbounded walk is how a stale `date`, or a clock
   that ran away, turns into years of empty rows that then push real days out
   of an archive capped at `HISTORY_CAP`. */
export const GAP_REACH = 120;

/* Both ends inclusive. `to` is yesterday at every call site; passing it in
   rather than reading the clock here is what makes this testable without a
   fake date. */
export function fillGaps(history, from, to) {
  const have = rows(history);
  if (!isKey(from) || !isKey(to) || from > to) return history;
  const floor = addDays(to, -(GAP_REACH - 1));
  const start = from < floor ? floor : from;
  const seen = new Set(have.map((h) => h.date));
  const added = [];
  for (let d = start; d <= to; d = addDays(d, 1)) {
    if (!seen.has(d)) added.push({ date: d, gap: true });
  }
  if (!added.length) return history;
  return [...have, ...added].sort(byDateAsc).slice(-HISTORY_CAP);
}

/* The earliest day the archive knows about — where the gap filling starts.
   Before his first recorded day there was no app to open, and inventing
   silences back to the epoch would be a different lie. */
export const firstDay = (history) => {
  let first = null;
  for (const h of rows(history)) {
    if (!isKey(h.date)) continue;
    if (first === null || h.date < first) first = h.date;
  }
  return first;
};

/* --- a past day's score ----------------------------------------------- *
 *  A stored row carries habit ids, not habits, so the roster is rebuilt and
 *  handed to `disciplineOf` — the one denominator the ring, the archive, the
 *  streak and the server's reminder all read. Doing this arithmetic inline is
 *  precisely how two screens end up disagreeing about one day the first time
 *  a habit is marked core.
 *
 *  The roster is the one the row recorded, whole — including ids whose habit
 *  has since been deleted. Dropping them was tried and is wrong twice over:
 *  it rescores a finished day every time the routine is edited, so re-opening
 *  yesterday showed 21% beside the 35% it was actually lived at; and it makes
 *  the denominator here disagree with the one the roll call renders, which
 *  lists a missing habit as «عادة لم تعد في روتينك» rather than forgetting it.
 *  A deleted habit simply carries no `core` flag, which is right — the core is
 *  a choice about the live routine.
 * -------------------------------------------------------------------- */
export function pctOfRow(row, habits) {
  const live = new Map(rows(habits).map((h) => [h.id, h]));
  const roster =
    Array.isArray(row?.all) && row.all.length
      ? row.all
      : rows(habits).map((h) => h.id);
  const done = new Set(Array.isArray(row?.done) ? row.done : []);
  return disciplineOf(
    roster.map((id) => ({ ...(live.get(id) || { id }), done: done.has(id) })),
  );
}

/* --- yesterday, corrected --------------------------------------------- *
 *  Forgetting to tick is not the same as not having done it, and until now
 *  the day simply went. This rewrites one archive row and touches nothing
 *  else: no habit on today's list moves, because today is a different day
 *  and the whole point of a hard day boundary is that it holds.
 *
 *  A gap row becomes an ordinary one. It has no roster of its own — the app
 *  was never opened, so nothing was ever asked — and the live list is the
 *  only honest answer available for what that day consisted of.
 * -------------------------------------------------------------------- */
export function setDayDone(history, date, doneIds, habits) {
  if (!isKey(date)) return history;
  const have = rows(history);
  const prev = have.find((h) => h.date === date) || null;
  const roster =
    Array.isArray(prev?.all) && prev.all.length
      ? prev.all
      : rows(habits).map((h) => h.id);
  const asked = new Set(roster);
  const done = [
    ...new Set((Array.isArray(doneIds) ? doneIds : []).filter((id) => asked.has(id))),
  ];
  /* `gap` is dropped, never set to false: a row saying `gap: false` and a row
     with no `gap` at all would be two shapes meaning one thing, and `isGap`
     would then have to know about both. */
  const { gap, ...kept } = prev || {};
  void gap;
  const row = { ...kept, date, all: roster, done };
  row.pct = pctOfRow(row, habits);
  return [...have.filter((h) => h.date !== date), row].sort(byDateAsc).slice(-HISTORY_CAP);
}

/* --- the streak, read back off the archive ---------------------------- *
 *  `streakBase` counts the days before today, and it has always been carried
 *  as a counter incremented at each rollover. Correcting yesterday can change
 *  whether yesterday qualified at all, so after an edit the number is read
 *  back off the rows instead of trusted.
 *
 *  It used to stop at the first day under the target, and that is the rule
 *  that makes a streak a liability rather than an asset: one fever, one
 *  funeral, one flight, and ninety days go to zero — at which point the
 *  cheapest way to protect the number is to stop looking at it. So one day
 *  is forgiven. `STREAK_FORGIVE` consecutive misses are stepped over; the
 *  one after that ends the run.
 *
 *  Forgiven is not the same as counted. A day under the target adds nothing
 *  to `days` — the number still means «days I actually cleared the bar» and
 *  no softening is allowed to inflate it. It is reported separately as
 *  `forgiven`, and the screen says it out loud, for the same reason a gap is
 *  counted out loud rather than averaged away: a tolerance nobody can see is
 *  a number quietly meaning less than it used to.
 *
 *  A miss still pending when the walk ends is NOT forgiven — forgiveness is
 *  only ever granted by a day that followed it and kept going. Otherwise a
 *  run of three would report a tolerance it never actually used.
 *
 *  A gap row counts as a missed day rather than as a wall. A day nobody
 *  recorded is a day he was away, and being away is exactly what the
 *  tolerance is for — but it is never credited to the run either, because a
 *  day nobody recorded cannot be claimed as part of one.
 * -------------------------------------------------------------------- */
export const STREAK_FORGIVE = 1;
export function streakRunFrom(history) {
  const by = new Map(rows(history).map((h) => [h.date, h]));
  const d = logicalNow();
  d.setDate(d.getDate() - 1);
  let days = 0;
  let forgiven = 0;
  let pending = 0;
  let since = null;
  for (let steps = 0; steps < HISTORY_CAP; steps += 1) {
    const key = fmtDay(d);
    const r = by.get(key);
    const hit = !!r && !isGap(r) && Number(r.pct) >= STREAK_TARGET;
    if (hit) {
      days += 1;
      forgiven += pending;
      pending = 0;
      since = key;
    } else {
      pending += 1;
      if (pending > STREAK_FORGIVE) break;
    }
    d.setDate(d.getDate() - 1);
  }
  return { days, forgiven, since };
}
export const streakBaseFrom = (history) => streakRunFrom(history).days;

/* --- coming back ------------------------------------------------------ *
 *  How many days in a row went unrecorded immediately before today. Not days
 *  that scored zero — days nobody opened the app for, which `fillGaps` has
 *  already written down as `gap` rows and which `isGap` is the one test for.
 *
 *  Two is the threshold because one is an evening that got away and two is a
 *  pattern starting. What it is for is the screen it feeds: somebody opening
 *  this app after a week away is reading it for a verdict, and the verdict a
 *  broken streak and a 0% ring deliver is «you failed, and here is the
 *  number». That is the moment the app gets closed for a month.
 *
 *  Bounded by `GAP_REACH` like every other walk, and floored at the first day
 *  he ever recorded: a profile two days old has not been away, it has only
 *  just started, and greeting a new user with «رجعت» is nonsense.
 * -------------------------------------------------------------------- */
export const COMEBACK_MIN = 2;
export function comebackFrom(history, today = dayKey()) {
  const have = rows(history).filter((h) => isKey(h.date));
  if (!have.length || !isKey(today)) return 0;
  const first = firstDay(have);
  const by = new Map(have.map((h) => [h.date, h]));
  let n = 0;
  let at = addDays(today, -1);
  while (n < GAP_REACH && at >= first) {
    const r = by.get(at);
    if (r && !isGap(r)) break;
    n += 1;
    at = addDays(at, -1);
  }
  return n;
}

/* --- the evening prompt's window -------------------------------------- *
 *  The day here does not end at midnight, it ends at DAY_START_HOUR — so
 *  its evening runs from 20:00 round past midnight to that hour. Testing
 *  the wall clock with `h >= 20` left 00:00–03:59 silent, which is exactly
 *  when someone reviewing «the day that just ended» is awake, and exactly
 *  the hours this app's own «السهر بعد منتصف الليل» assumes he is up for.
 *  Past midnight the prompt never came, and at 04:00 the day rolled over
 *  and took the question with it.
 * ---------------------------------------------------------------------- */
export const REFLECT_FROM_HOUR = 20;

export const inReflectWindow = (d = new Date()) => {
  const h = d.getHours();
  return h >= REFLECT_FROM_HOUR || h < DAY_START_HOUR;
};

/* «لاحقًا» is a button that says *later*, so it has to mean later. Three
   showings an evening, an hour apart, then silence — a prompt that returns
   forever is one you learn to dismiss without reading. */
export const REFLECT_SNOOZE_MS = 60 * 60 * 1000;

export const REFLECT_MAX_SHOWS = 3;

/* --- the habit ledger ------------------------------------------------- *
 *  Every figure here is derived from `history` and nothing is stored twice.
 *  The archive already writes, per day, which habit ids were ticked (`done`)
 *  and which were on the roster at all (`all`) — which is exactly enough to
 *  answer «ما العادة التي أصمد عليها؟» without a second ledger that could
 *  drift out of step with the first.
 *
 *  `all` is what makes the answers honest. A habit added in November was not
 *  "missed" every day of October: it was not asked. A day whose row predates
 *  the roster is unknown, not a miss, and renders as a gap.
 * ---------------------------------------------------------------------- */
export const historyIndex = (history) => {
  const by = new Map();
  for (const h of rows(history))
    if (typeof h.date === "string" && Array.isArray(h.done)) by.set(h.date, h);
  return by;
};

/* Was this habit on the roster that day? A row written before the roster was
   archived has no `all`, so it can only say "there was a day here". */
export const askedOn = (row, id) =>
  !row ? false : Array.isArray(row.all) ? row.all.includes(id) : true;

export const keptOn = (row, id) => !!row && row.done.includes(id);

/* Days in a row, walking back from today. A run that ended yesterday still
   stands today — the day is not over, and zeroing it at 00:00 would punish
   someone who ticks his night habits at eleven. Bounded by HISTORY_CAP: the
   walk stops at the first day with no row at all. */
export function habitStreak(by, id) {
  const d = logicalNow();
  if (!keptOn(by.get(dayKey(d)), id)) d.setDate(d.getDate() - 1);
  let n = 0;
  for (;;) {
    if (!keptOn(by.get(dayKey(d)), id)) return n;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
}

/* The longest run ever recorded, which outlives the streak that ended it.
   Walks the archive in date order and only treats two rows as consecutive
   when their dates genuinely are — a gap in the archive breaks the run
   rather than silently joining across it. */
export function habitBest(by, id) {
  const days = [...by.keys()].filter((k) => keptOn(by.get(k), id)).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of days) {
    const [y, m, d] = k.split("-").map(Number);
    const t = new Date(y, m - 1, d).getTime();
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = t;
  }
  return best;
}

/* Kept out of asked, over a window of days — `0` means the whole archive.
   The denominator counts only days the habit was actually on the roster. */
export function habitTally(by, id, win = 0) {
  let kept = 0;
  let asked = 0;
  for (const [k, row] of by) {
    if (win && daysBetween(k) >= win) continue;
    if (!askedOn(row, id)) continue;
    asked += 1;
    if (keptOn(row, id)) kept += 1;
  }
  return { kept, asked, pct: asked ? Math.round((kept / asked) * 100) : 0 };
}

/* The last `n` days as a strip, oldest first, for the dot grid. Three states
   and they are not interchangeable: kept, asked-and-missed, and never asked
   — drawing the third as a miss is the lie this whole file exists to avoid. */
export function habitStrip(by, id, n = 30) {
  const out = [];
  const d = logicalNow();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i += 1) {
    const key = dayKey(d);
    const row = by.get(key);
    out.push({
      key,
      state: !askedOn(row, id) ? "off" : keptOn(row, id) ? "kept" : "missed",
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const levelOf = (pct) =>
  pct >= 90 ? 4 : pct >= 70 ? 3 : pct >= 45 ? 2 : pct > 0 ? 1 : 0;
