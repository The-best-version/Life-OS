/* --- the Telegram bot's schedule ---------------------------------------
 *  What the bot sends unprompted, and when. It lives in the state rather
 *  than in the bot's own `.env` for one reason: a schedule that can only be
 *  changed by editing a file on the machine the bot runs on is a schedule
 *  that never changes. The screen edits `state.bot`, the save reaches the
 *  disk through the sync server as every save does, and the bot — which
 *  already reads that file — re-arms itself.
 *
 *  So there is no new transport and no second copy of the schedule. The bot
 *  is a reader of this, exactly as the sync server is a reader of `place`.
 *
 *  `.env` keeps the two *credentials* and the fallbacks. A value here always
 *  wins; `.env` is what answers before this object has ever been written.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, hhmm, minsIn, clampNum, monthDays, dayKey, logicalNow } from "./life-state-util.mjs";
import { scoredOf, clampGoal } from "./life-state-habits.mjs";
import { sumPages, READ_GOAL_DEFAULT } from "./life-state-books.mjs";
import { focusShape, focusDay } from "./life-state-focus.mjs";

/* --- where the bot answers from --------------------------------------- *
 *  A loopback listener of its own, on a port beside the sync server's.
 *  It exists for exactly one question the disk cannot answer — «هل العملية
 *  شغّالة الآن؟» — plus the test ping, so the whole chain can be proved in
 *  one tap rather than by sending yourself a message and waiting.
 * ---------------------------------------------------------------------- */
export const BOT_PORT = 47616;
export const BOT_API = `http://127.0.0.1:${BOT_PORT}`;

/* The defaults, and the same two numbers the bot falls back to. */
export const BOT_MORNING_DEFAULT = "07:00";
export const BOT_EVENING_DEFAULT = "20:00";

/* How many custom reminders may exist. */
export const REMINDER_CAP = 12;
export const REMINDER_MAX = 120;

/* The water reminder's spacing, in minutes. */
export const WATER_EVERY_MIN = 30;
export const WATER_EVERY_MAX = 360;
export const WATER_EVERY_DEFAULT = 120;

/* How long before the call to prayer the nudge lands. */
export const PRAYER_BEFORE_MIN = 5;
export const PRAYER_BEFORE_MAX = 45;
export const PRAYER_BEFORE_DEFAULT = 15;

/* The block a habit actually belongs to. */
export const BLOCK_AFTER_MIN = 0;
export const BLOCK_AFTER_MAX = 90;
export const BLOCK_AFTER_DEFAULT = 10;

/* Something on the calendar, today. */
export const EVENT_BEFORE_MIN = 5;
export const EVENT_BEFORE_MAX = 180;
export const EVENT_BEFORE_DEFAULT = 30;

/* How long «لاحقًا» actually means. */
export const SNOOZE_MIN = 5;
export const SNOOZE_MAX = 240;
export const SNOOZE_DEFAULT = 60;

/* The coach. */
export const COACH_AT_DEFAULT = "11:00";
export const COACH_MAX = 3;

/* The week, once. Saturday, not Friday: the week that just ended is the one
   worth reviewing, and the weekend is when it actually gets read. A Friday
   evening review falls on the busiest social night of the week; Saturday
   evening is when the week is behind him and the next one is still open. */
export const WEEKLY_AT_DEFAULT = "20:30";
export const WEEKLY_DOW_DEFAULT = 6;

/* The review. */
export const REVIEW_AT_DEFAULT = "21:30";

/* --- the smart nudge ------------------------------------------------ *
 *  A second brief that fires in the middle of the afternoon, and whose
 *  whole value is that it *usually says nothing*. The morning brief is a
 *  to-do and the evening brief is a verdict; this one is a question asked
 *  at the moment the answer can still change.
 *
 *  So it is gated on the goal the user picked himself: if the day has
 *  already cleared it, or is close enough that the last habit will finish
 *  it, the bot stays silent. A nudge that fires every day at five is a
 *  nudge you learn to swipe without reading.
 *
 *  On by default.
 * ------------------------------------------------------------------- */
export const NUDGE_AT_DEFAULT = "17:00";
export const NUDGE_THRESHOLD_DEFAULT = 15;
export const NUDGE_THRESHOLD_MIN = 5;
export const NUDGE_THRESHOLD_MAX = 40;

/* --- how often a reminder comes back ----------------------------------- *
 *  Three answers, and the third is the one this list was missing.
 * ---------------------------------------------------------------------- */
export const REMINDER_REPEATS = [
  { id: "day", label: "كل يوم", note: "بلا استثناء" },
  { id: "week", label: "أيام الأسبوع", note: "يوم واحد يعني أسبوعيًّا" },
  { id: "month", label: "شهريًّا", note: "يوم واحد من كل شهر" },
];
export const REMINDER_REPEAT_IDS = REMINDER_REPEATS.map((r) => r.id);
export const repeatMeta = (id) =>
  REMINDER_REPEATS.find((r) => r.id === id) || REMINDER_REPEATS[0];
export const DOM_MIN = 1;
export const DOM_MAX = 31;
export const DOM_DEFAULT = 1;

/* --- the condition that buys the silence ------------------------------- *
 *  Every sentence the bot sends is built from the day at the moment it
 *  fires, and `null` is already a legitimate answer.
 * ---------------------------------------------------------------------- */
export const GATES = [
  { id: "always", label: "بلا شرط", note: "يُرسل في وقته دائمًا" },
  { id: "habits", label: "إن بقيت عادة", note: "صامت إذا أُغلقت عادات اليوم" },
  { id: "tasks", label: "إن بقيت مهمة", note: "من مهام اليوم الثلاث" },
  { id: "water", label: "إن لم يكتمل الماء", note: "صامت بعد بلوغ الأكواب" },
  { id: "read", label: "إن لم تقرأ", note: "صفحات اليوم دون هدف القراءة" },
  { id: "focus", label: "إن لم تركّز", note: "دقائق اليوم دون هدف المكتب" },
];
export const GATE_IDS = GATES.map((g) => g.id);
export const gateMeta = (id) => GATES.find((g) => g.id === id) || GATES[0];

/* Whether a gated reminder has anything to be about, as of `now`. */
export function gateOf(state, id = "always", now = new Date()) {
  const s = obj(state);
  const open = { pass: true, kind: "always", left: 0, goal: 0 };
  if (!id || id === "always" || !GATE_IDS.includes(id)) return open;

  if (id === "habits") {
    const left = scoredOf(rows(s.habits)).filter((h) => !h.done);
    return { pass: left.length > 0, kind: id, left: left.length, goal: 0, habits: left };
  }

  if (id === "tasks") {
    const left = rows(s.tasks).filter((t) => t.today && !t.done);
    return { pass: left.length > 0, kind: id, left: left.length, goal: 0, tasks: left };
  }

  if (id === "water") {
    const goal = clampGoal(s.waterGoal);
    const had = Math.max(0, Math.round(Number(s.water) || 0));
    return { pass: had < goal, kind: id, left: Math.max(0, goal - had), goal, water: true };
  }

  if (id === "read") {
    const goal = Number.isFinite(s.readGoal) ? s.readGoal : READ_GOAL_DEFAULT;
    const today = dayKey(logicalNow(now));
    const had = sumPages(rows(s.reading).filter((r) => r.date === today));
    return { pass: had < goal, kind: id, left: Math.max(0, goal - had), goal };
  }

  if (id === "focus") {
    const goal = focusShape(s.focus).goal;
    const had = focusDay(s.sessions, dayKey(logicalNow(now))).minutes;
    const bar = goal > 0 ? goal : 1;
    return { pass: had < bar, kind: id, left: Math.max(0, bar - had), goal };
  }

  return open;
}

/* --- a custom reminder ------------------------------------------------- *
 *  A time, a sentence, and which days it applies to.
 * ---------------------------------------------------------------------- */
export const reminderShape = (r) => {
  r = obj(r);
  const days = [
    ...new Set(
      (Array.isArray(r.days) ? r.days : [])
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ].sort((a, b) => a - b);
  const kept = days.length === 7 ? [] : days;
  return {
    id: r.id || uid(),
    on: r.on !== false,
    at: hhmm(r.at, "09:00"),
    text: typeof r.text === "string" ? r.text.slice(0, REMINDER_MAX) : "",
    days: kept,
    repeat: REMINDER_REPEAT_IDS.includes(r.repeat) ? r.repeat : kept.length ? "week" : "day",
    dom: Math.round(clampNum(r.dom, DOM_MIN, DOM_MAX, DOM_DEFAULT)),
    only: GATE_IDS.includes(r.only) ? r.only : "always",
  };
};

/* --- which day is it, as a recurrence sees it -------------------------- */
export const whenOf = (date = new Date()) => ({
  dow: date.getDay(),
  dom: date.getDate(),
  lastDom: monthDays(date.getFullYear(), date.getMonth() + 1),
});

/* Whether a reminder comes back on a given day. */
export const firesOn = (r, when) => {
  const w = obj(when);
  if (r.repeat === "month") {
    const dom = Math.round(clampNum(r.dom, DOM_MIN, DOM_MAX, DOM_DEFAULT));
    const last = Number.isFinite(w.lastDom) ? w.lastDom : DOM_MAX;
    return w.dom === Math.min(dom, last);
  }
  if (r.repeat === "week") return onDay(r, w.dow);
  return true;
};

/* --- when it next comes back ------------------------------------------- */
export const NEXT_REACH = 62;
export function nextFireOf(r, now = new Date()) {
  const row = reminderShape(r);
  const mins = minsIn(row.at);
  if (!row.on || mins === null) return null;
  for (let i = 0; i <= NEXT_REACH; i += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (!firesOn(row, whenOf(day))) continue;
    const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, mins, 0, 0);
    if (when.getTime() > now.getTime()) return when;
  }
  return null;
}

/* --- the ones worth having, offered rather than hidden ----------------- */
export const REMINDER_IDEAS = [
  { text: "راجع مصروف اليوم", at: "21:30", repeat: "day" },
  { text: "اقرأ قبل النوم", at: "22:30", repeat: "day", only: "read" },
  { text: "جولة تركيز واحدة على الأقل", at: "16:00", repeat: "day", only: "focus" },
  { text: "خطّط الأسبوع القادم", at: "20:00", repeat: "week", days: [5] },
  { text: "اتصل بوالديك", at: "19:00", repeat: "week", days: [5] },
  { text: "سدّد الفواتير", at: "10:00", repeat: "month", dom: 1 },
  { text: "راجع ميزانية الشهر", at: "20:00", repeat: "month", dom: 28 },
  { text: "راجع أهداف الربع", at: "20:00", repeat: "month", dom: 15 },
];

/* --- the whole schedule ------------------------------------------------ */
export const botShape = (b) => {
  b = obj(b);
  const water = obj(b.water);
  const prayer = obj(b.prayer);
  const tasks = obj(b.tasks);
  const coach = obj(b.coach);
  const weekly = obj(b.weekly);
  const review = obj(b.review);
  const nudge = obj(b.nudge);
  const blocks = obj(b.blocks);
  const events = obj(b.events);
  const dow = Number(weekly.dow);
  return {
    on: b.on !== false,
    morningOn: b.morningOn !== false,
    morningAt: hhmm(b.morningAt, BOT_MORNING_DEFAULT),
    eveningOn: b.eveningOn !== false,
    eveningAt: hhmm(b.eveningAt, BOT_EVENING_DEFAULT),
    water: {
      on: water.on === true,
      every: Math.round(
        clampNum(water.every, WATER_EVERY_MIN, WATER_EVERY_MAX, WATER_EVERY_DEFAULT),
      ),
      from: hhmm(water.from, "07:00"),
      to: hhmm(water.to, "22:00"),
    },
    prayer: {
      on: prayer.on === true,
      before: Math.round(
        clampNum(prayer.before, PRAYER_BEFORE_MIN, PRAYER_BEFORE_MAX, PRAYER_BEFORE_DEFAULT),
      ),
    },
    tasks: {
      on: tasks.on === true,
      at: hhmm(tasks.at, "17:00"),
    },
    coach: {
      on: coach.on === true,
      at: hhmm(coach.at, COACH_AT_DEFAULT),
    },
    weekly: {
      on: weekly.on === true,
      at: hhmm(weekly.at, WEEKLY_AT_DEFAULT),
      dow: Number.isInteger(dow) && dow >= 0 && dow <= 6 ? dow : WEEKLY_DOW_DEFAULT,
    },
    review: {
      on: review.on === true,
      at: hhmm(review.at, REVIEW_AT_DEFAULT),
    },
    /* On by default — see NUDGE_AT_DEFAULT's comment. The threshold is the
       one dial worth exposing. */
    nudge: {
      on: nudge.on !== false,
      at: hhmm(nudge.at, NUDGE_AT_DEFAULT),
      threshold: Math.round(
        clampNum(
          nudge.threshold,
          NUDGE_THRESHOLD_MIN,
          NUDGE_THRESHOLD_MAX,
          NUDGE_THRESHOLD_DEFAULT,
        ),
      ),
    },
    blocks: {
      on: blocks.on === true,
      after: Math.round(
        clampNum(blocks.after, BLOCK_AFTER_MIN, BLOCK_AFTER_MAX, BLOCK_AFTER_DEFAULT),
      ),
    },
    events: {
      on: events.on === true,
      before: Math.round(
        clampNum(events.before, EVENT_BEFORE_MIN, EVENT_BEFORE_MAX, EVENT_BEFORE_DEFAULT),
      ),
    },
    snooze: Math.round(clampNum(b.snooze, SNOOZE_MIN, SNOOZE_MAX, SNOOZE_DEFAULT)),
    customs: rows(b.customs).map(reminderShape).slice(0, REMINDER_CAP),
  };
};

/* Whether a reminder applies on a given weekday. */
export const onDay = (r, dow) =>
  !Array.isArray(r.days) || r.days.length === 0 || r.days.includes(dow);

/* --- what the bot will send today, and when --------------------------- */
export function planDay(
  bot,
  { date = new Date(), prayers = null, hasTasks = true, blocks = null, events = null } = {},
) {
  const b = botShape(bot);
  const out = [];
  if (!b.on) return out;
  const when = whenOf(date);
  const dow = when.dow;

  const push = (kind, mins, extra) => {
    if (!Number.isFinite(mins) || mins < 0 || mins >= 1440) return;
    out.push({ kind, at: Math.round(mins), ...extra });
  };

  if (b.morningOn) push("morning", minsIn(b.morningAt));
  if (b.eveningOn) push("evening", minsIn(b.eveningAt));

  if (b.water.on) {
    const from = minsIn(b.water.from);
    const to = minsIn(b.water.to);
    if (from !== null && to !== null && to > from) {
      for (let m = from + b.water.every; m <= to; m += b.water.every) {
        push("water", m);
      }
    }
  }

  if (b.prayer.on && prayers) {
    for (const [id, hours] of Object.entries(prayers)) {
      if (hours === null || !Number.isFinite(hours)) continue;
      push("prayer", hours * 60 - b.prayer.before, { prayer: id });
    }
  }

  if (b.tasks.on && hasTasks) push("tasks", minsIn(b.tasks.at));

  if (b.blocks.on && Array.isArray(blocks)) {
    for (const blk of blocks) {
      if (!blk || !Number.isFinite(blk.at)) continue;
      push("block", blk.at * 60 + b.blocks.after, { block: blk.id });
    }
  }

  if (b.events.on && Array.isArray(events)) {
    for (const ev of events) {
      if (!ev || !Number.isFinite(ev.at)) continue;
      push("event", ev.at * 60 - b.events.before, { id: ev.id });
    }
  }

  if (b.coach.on) push("coach", minsIn(b.coach.at));
  if (b.review.on) push("review", minsIn(b.review.at));
  /* Armed unconditionally, like the coach and the review above: whether
     there is anything worth saying is a question about the day at the
     moment it fires. The silence is `goalNudge`'s. */
  if (b.nudge.on) push("nudge", minsIn(b.nudge.at));
  if (b.weekly.on && dow === b.weekly.dow) push("weekly", minsIn(b.weekly.at));

  for (const r of b.customs) {
    if (!r.on || !r.text || !firesOn(r, when)) continue;
    push("custom", minsIn(r.at), { id: r.id, text: r.text, only: r.only });
  }

  return out.sort((a, b2) => a.at - b2.at);
}

/* The next one still ahead of `mins`, or null when the day's are all past. */
export const nextInPlan = (plan, mins) =>
  plan.find((p) => p.at > mins) || null;