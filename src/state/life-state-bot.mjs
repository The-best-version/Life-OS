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
/* Three domain files read from here, for the one reason any domain file reads
   another: a condition on «هل بقيت عادة؟» answered by a second copy of
   `scoredOf` is a condition that eventually disagrees with the ring. The
   direction stays one-way — nothing in habits, books or focus reads the
   schedule back. */
import { scoredOf, clampGoal } from "./life-state-habits.mjs";
import { sumPages, READ_GOAL_DEFAULT } from "./life-state-books.mjs";
import { focusShape, focusDay } from "./life-state-focus.mjs";

/* --- where the bot answers from --------------------------------------- *
 *  A loopback listener of its own, on a port beside the sync server's. It
 *  exists for exactly one question the disk cannot answer — «هل العملية
 *  شغّالة الآن؟» — plus the test ping, so the whole chain can be proved in
 *  one tap rather than by sending yourself a message and waiting.
 *
 *  It is deliberately NOT the sync server: that process has no business
 *  importing a Telegram library, and the bot has no business being the thing
 *  that serves the app. Two processes, two ports, one direction of
 *  dependency.
 *
 *  Here rather than in the bot's folder because both sides need the number
 *  and a port typed twice is a port that is eventually typed differently.
 * ---------------------------------------------------------------------- */
export const BOT_PORT = 47616;
export const BOT_API = `http://127.0.0.1:${BOT_PORT}`;

/* The defaults, and the same two numbers the bot falls back to. The morning
   brief is a clock hour because waking is one — anchoring it to Fajr would
   deliver it at 04:40 in June. The evening one is the hour the app's own
   reflection window opens, and `life-state-streak.mjs` owns that number;
   it is not repeated here, the bot reads `REFLECT_FROM_HOUR` itself. */
export const BOT_MORNING_DEFAULT = "07:00";
export const BOT_EVENING_DEFAULT = "20:00";

/* How many custom reminders may exist. A bound, like every other list the
   phone can feed: twelve is more than anybody keeps on top of, and a list
   with no ceiling is a payload that grows until a save throws. */
export const REMINDER_CAP = 12;
/* One line, so a Telegram bubble stays a glance. */
export const REMINDER_MAX = 120;

/* The water reminder's spacing, in minutes. Half an hour is the floor
   because anything tighter is a notification you learn to swipe away
   without reading, which is the opposite of what a reminder is for. */
export const WATER_EVERY_MIN = 30;
export const WATER_EVERY_MAX = 360;
export const WATER_EVERY_DEFAULT = 120;

/* How long before the call to prayer the nudge lands. Fifteen minutes is
   enough to finish a sentence and not enough to forget again. */
export const PRAYER_BEFORE_MIN = 5;
export const PRAYER_BEFORE_MAX = 45;
export const PRAYER_BEFORE_DEFAULT = 15;

/* --- the block a habit actually belongs to ------------------------------ *
 *  Every other periodic reminder here fires on a clock hour. The routine
 *  does not run on clock hours — it runs in six prayer-anchored blocks, and
 *  a nudge about «بعد العصر» that arrives at a fixed 17:00 is wrong by
 *  forty minutes in March and by an hour in June.
 *
 *  So the block times are passed into `planDay` the way the prayer times
 *  are, computed by whoever is calling — the solar maths may not be
 *  imported here. `after` is the grace: a block's habits are not open the
 *  second the adhan is called, and a nudge at the instant of it is a nudge
 *  about something nobody has had a chance to do yet.
 * ---------------------------------------------------------------------- */
export const BLOCK_AFTER_MIN = 0;
export const BLOCK_AFTER_MAX = 90;
export const BLOCK_AFTER_DEFAULT = 10;

/* --- something on the calendar, today ---------------------------------- *
 *  An event's `warn` is in *days* — right for an exam, useless for a four
 *  o'clock appointment. This is the other half: a timed entry on today's
 *  square, named this many minutes before it.
 * ---------------------------------------------------------------------- */
export const EVENT_BEFORE_MIN = 5;
export const EVENT_BEFORE_MAX = 180;
export const EVENT_BEFORE_DEFAULT = 30;

/* --- how long «لاحقًا» actually means ----------------------------------- *
 *  A button that says *later* has to mean later, and one that returns in
 *  five minutes is one you learn to dismiss without reading — the same
 *  reasoning as the reflection prompt's own snooze, which is where this
 *  number came from.
 * ---------------------------------------------------------------------- */
export const SNOOZE_MIN = 5;
export const SNOOZE_MAX = 240;
export const SNOOZE_DEFAULT = 60;

/* --- the coach --------------------------------------------------------- *
 *  The one entry in the schedule that decides for itself whether to speak.
 *  Everything else fires because a time arrived; this one fires, reads the
 *  day, and then usually says nothing at all — `advise()` in the bot returns
 *  an empty list on a day that is going fine.
 *
 *  That silence is the feature and not a shortfall. A coach that files a
 *  report every noon is a notification you learn to swipe without reading,
 *  and the one noon it has something real to say is the noon you swipe that
 *  too. It is the same rule the task sweep already keeps, applied to a
 *  message whose whole content is a judgement.
 *
 *  Off by default, like every other periodic reminder: what the bot may
 *  interrupt him for is not a question a migration can answer.
 * ---------------------------------------------------------------------- */
export const COACH_AT_DEFAULT = "11:00";
/* How many observations one nudge may carry. Three is the bound that keeps
   it a glance — `advise` ranks, and the fourth-most-urgent thing about a day
   has never been the thing that changed it. */
export const COACH_MAX = 3;

/* --- the week, once ---------------------------------------------------- *
 *  A day is too short a window to see a slope in. The weekly review is the
 *  one message the bot sends that is not about now: the average, the days
 *  nobody recorded, where the money went, how far the reading moved. Friday
 *  evening by default — the day the week is actually over here, and late
 *  enough that the day it summarises is in it.
 * ---------------------------------------------------------------------- */
export const WEEKLY_AT_DEFAULT = "20:30";
export const WEEKLY_DOW_DEFAULT = 5; // Friday, in Date.getDay() numbering

/* --- how often a reminder comes back ----------------------------------- *
 *  Three answers, and the third is the one this list was missing. A weekday
 *  pattern already expressed «كل جمعة» — pick one day and the row is
 *  weekly — but nothing here could express «يوم ٢٨ من كل شهر», which is the
 *  shape every recurring *obligation* actually has: the rent, the bill, the
 *  quarter's goals, the month's budget. Those are the reminders worth having
 *  a bot for at all, because a daily one you would have remembered anyway.
 *
 *  `day` ignores `days` and `dom`; `week` reads `days`; `month` reads `dom`.
 *  One field says which, so no reader has to guess from which other field
 *  happens to be filled — the mistake the empty-`days` convention would have
 *  turned into three.
 * ---------------------------------------------------------------------- */
/* Named apart from the calendar's `REPEATS`, and with different ids, because
   they are different questions rather than one asked twice: an event recurs
   from a date it already has («كل شهر» means the day it is on), while a
   standing reminder has no date at all and has to be told which days it
   comes back on. Two tables, two names — a shared `monthly` that meant the
   event's own day in one reader and `dom` in the other would be the worse
   kind of reuse. */
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
 *  fires, and `null` is already a legitimate answer: the task sweep with
 *  nothing to sweep says nothing, and the coach on a good day says nothing.
 *  A reminder in his own words was the one thing here that always spoke —
 *  «اشرب ماء» at four in the afternoon on a day the goal was met at two is
 *  exactly the message that teaches you to swipe the rest unread.
 *
 *  So a reminder may carry a condition, and the condition is read when the
 *  timer fires rather than when it was armed. The gate is not a filter on
 *  the plan: `planDay` arms a conditional reminder unconditionally, the same
 *  way it arms the coach, because whether there is anything worth saying is
 *  a question about a day that is still hours away when the plan is built.
 *
 *  Each gate also hands back what it was looking at, which is how a
 *  conditional nudge gets a button with no new wiring: the bot already
 *  builds «💧 + كاس ماء» and a habit's tick row out of exactly these fields.
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

/* Whether a gated reminder has anything to be about, as of `now`.
 *
 *  Returns the *facts* and never the sentence: `left` is how much of the
 *  thing is still undone and `goal` is what it was measured against, and the
 *  Arabic is composed by whoever is speaking — the bot in its own words, the
 *  screen in shorter ones. A sentence built here would be a second copy of
 *  the one the bot already knows how to write.
 */
export function gateOf(state, id = "always", now = new Date()) {
  const s = obj(state);
  const open = { pass: true, kind: "always", left: 0, goal: 0 };
  if (!id || id === "always" || !GATE_IDS.includes(id)) return open;

  if (id === "habits") {
    const left = scoredOf(rows(s.habits)).filter((h) => !h.done);
    /* The habits themselves ride back, so the message that asks about them
       can also be the message that ticks one. */
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
    /* No goal set is not a day that fell short of one. The honest reading of
       «إن لم تركّز» without a target is «ولا دقيقة». */
    const had = focusDay(s.sessions, dayKey(logicalNow(now))).minutes;
    const bar = goal > 0 ? goal : 1;
    return { pass: had < bar, kind: id, left: Math.max(0, bar - had), goal };
  }

  return open;
}

/* --- a custom reminder ------------------------------------------------- *
 *  A time, a sentence, and which days it applies to. `days` empty means
 *  every day — an explicit "all seven" and an empty list would be two
 *  shapes meaning one thing, and every reader would then have to know
 *  about both.
 *
 *  Day numbers are `Date.getDay()`: Sunday is 0, which is also the order
 *  `DOW_AR` is written in, so an index is an index on both sides.
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
    /* An unreadable time becomes 09:00 rather than nothing: a reminder with
       no hour cannot be armed, and silently dropping the row would delete
       text the user typed. */
    at: hhmm(r.at, "09:00"),
    text: typeof r.text === "string" ? r.text.slice(0, REMINDER_MAX) : "",
    days: kept,
    /* A row written before the repeat existed is read by what it already
       says: days picked meant «هذي الأيام» and no days meant «كل يوم», which
       is exactly the two answers `week` and `day` give. So nothing is
       guessed and nothing changes behaviour — the shape is the migration,
       the same arrangement the rest of `state.bot` arrived under. */
    repeat: REMINDER_REPEAT_IDS.includes(r.repeat) ? r.repeat : kept.length ? "week" : "day",
    dom: Math.round(clampNum(r.dom, DOM_MIN, DOM_MAX, DOM_DEFAULT)),
    only: GATE_IDS.includes(r.only) ? r.only : "always",
  };
};

/* --- which day is it, as a recurrence sees it -------------------------- *
 *  One reading of a day, so the plan, the preview and the next-fire line
 *  cannot disagree about whether the 28th of February is the 31st.
 * ---------------------------------------------------------------------- */
export const whenOf = (date = new Date()) => ({
  dow: date.getDay(),
  dom: date.getDate(),
  lastDom: monthDays(date.getFullYear(), date.getMonth() + 1),
});

/* Whether a reminder comes back on a given day.
 *
 *  The month case carries the one rule worth stating out loud: a reminder
 *  set for the 31st lands on the last day of a month that has no 31st, and
 *  never on the 1st of the next one. A month skipped is a bill unpaid, and
 *  «آخر يوم في الشهر» is what somebody who typed 31 actually meant.
 */
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

/* --- when it next comes back ------------------------------------------- *
 *  A monthly reminder you cannot see the next firing of is one you cannot
 *  trust: «يوم ٣١» on the 5th of February says nothing about whether it
 *  understood February. So the row says the date out loud, and it says it
 *  by walking the same `firesOn` the bot arms from rather than by reasoning
 *  about the fields a second time.
 *
 *  Bounded, because an unbounded walk over a row that fires on nothing is a
 *  loop with no end: sixty-two days is twice the longest gap any shape here
 *  can produce (a month), and a row still silent after it fires on nothing.
 * ---------------------------------------------------------------------- */
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

/* --- the ones worth having, offered rather than hidden ----------------- *
 *  Seeds, never written by a migration: a reminder added here is one he
 *  tapped. They exist because the empty list was a text box and an hour
 *  picker, and a text box does not tell anybody that a reminder can be
 *  monthly, or that it can be the kind that stays quiet when the thing is
 *  already done. Two of these are the only way most people would ever find
 *  out — the same reason the core five ask on the routine screen instead of
 *  waiting in settings.
 * ---------------------------------------------------------------------- */
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
  const blocks = obj(b.blocks);
  const events = obj(b.events);
  const dow = Number(weekly.dow);
  return {
    /* The master switch. Off means the bot still answers everything he
       sends it and sends nothing of its own — which is the difference
       between muting a thing and uninstalling it. */
    on: b.on !== false,
    morningOn: b.morningOn !== false,
    morningAt: hhmm(b.morningAt, BOT_MORNING_DEFAULT),
    eveningOn: b.eveningOn !== false,
    eveningAt: hhmm(b.eveningAt, BOT_EVENING_DEFAULT),
    /* Every `WATER_EVERY` minutes, and only between `from` and `to`. The
       window is a field and not a hidden rule, because a reminder that
       mysteriously stops at some hour is a reminder you cannot trust the
       rest of the day either. */
    water: {
      on: water.on === true,
      every: Math.round(
        clampNum(water.every, WATER_EVERY_MIN, WATER_EVERY_MAX, WATER_EVERY_DEFAULT),
      ),
      from: hhmm(water.from, "07:00"),
      to: hhmm(water.to, "22:00"),
    },
    /* Before each prayer the app itself anchors a block to. Sunrise is not
       one — it closes Fajr's window rather than opening a prayer — and
       `PRAYER_ROWS` already marks it, so nothing here needs to know. */
    prayer: {
      on: prayer.on === true,
      before: Math.round(
        clampNum(prayer.before, PRAYER_BEFORE_MIN, PRAYER_BEFORE_MAX, PRAYER_BEFORE_DEFAULT),
      ),
    },
    /* One sweep of what is still open. Silent when nothing is — the same
       choice the server's block toast makes, because a reminder that fires
       to say "nothing" is the one that teaches you to ignore the rest. */
    tasks: {
      on: tasks.on === true,
      at: hhmm(tasks.at, "17:00"),
    },
    /* The coach reads the day and decides whether there is anything worth
       saying. Off by default — it is the one reminder whose content is an
       opinion, and an opinion nobody asked for is the first one muted. */
    coach: {
      on: coach.on === true,
      at: hhmm(coach.at, COACH_AT_DEFAULT),
    },
    /* One day of the week, not every day: a review that arrives daily is a
       daily report, which is what the evening brief already is. */
    weekly: {
      on: weekly.on === true,
      at: hhmm(weekly.at, WEEKLY_AT_DEFAULT),
      dow: Number.isInteger(dow) && dow >= 0 && dow <= 6 ? dow : WEEKLY_DOW_DEFAULT,
    },
    /* The habits of the block that just opened, silent when none are open.
       Anchored to the prayers like the routine itself, never to the clock. */
    blocks: {
      on: blocks.on === true,
      after: Math.round(
        clampNum(blocks.after, BLOCK_AFTER_MIN, BLOCK_AFTER_MAX, BLOCK_AFTER_DEFAULT),
      ),
    },
    /* A timed entry on today's square, named minutes before it — the hour
       half of a warning whose other half (`event.warn`) is in days. */
    events: {
      on: events.on === true,
      before: Math.round(
        clampNum(events.before, EVENT_BEFORE_MIN, EVENT_BEFORE_MAX, EVENT_BEFORE_DEFAULT),
      ),
    },
    /* What «لاحقًا» means, in minutes. One number for every nudge, because a
       snooze that is different per reminder is a snooze nobody can predict. */
    snooze: Math.round(clampNum(b.snooze, SNOOZE_MIN, SNOOZE_MAX, SNOOZE_DEFAULT)),
    customs: rows(b.customs).map(reminderShape).slice(0, REMINDER_CAP),
  };
};

/* Whether a reminder applies on a given weekday. The one place the empty
   `days` convention is read, so no caller has to remember it. */
export const onDay = (r, dow) =>
  !Array.isArray(r.days) || r.days.length === 0 || r.days.includes(dow);

/* --- what the bot will send today, and when --------------------------- *
 *  Pure, and in the state layer rather than in the bot, because it is the
 *  answer to a question the screen also asks: «متى التذكير القادم؟» is
 *  rendered on the control hub and armed by the bot, and two readings of
 *  one schedule would eventually disagree about the same evening.
 *
 *  `prayers` is passed in as a map of id → decimal hours rather than
 *  computed here: the solar maths lives in `prayer-times.mjs`, which this
 *  file must not import — the state layer is loaded by the tests with
 *  nothing installed and stays free of anything that is not plain data.
 *
 *  Returns minutes past midnight, sorted, each with the kind that made it.
 *  Turning a minute into a `Date` is the caller's job, because the caller
 *  is the only one that knows which day it is arming.
 * ---------------------------------------------------------------------- */
export function planDay(
  bot,
  { date = new Date(), prayers = null, hasTasks = true, blocks = null, events = null } = {},
) {
  const b = botShape(bot);
  const out = [];
  if (!b.on) return out;
  /* One day in, three readings out. It used to take `dow` alone, which was
     enough while the only thing that recurred was a weekday — a monthly row
     also needs the date and the length of the month, and three arguments
     every caller has to remember to keep in step is three ways for the
     preview to disagree with the evening it is previewing. */
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
    /* A window that ends before it starts is not a window that wraps past
       midnight — it is a mistake, and the honest reading of it is no
       reminders rather than twenty-three hours of them. */
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

  /* Armed only when there is something to sweep. The bot asks this of the
     state it holds; the screen asks it of the state on screen. */
  if (b.tasks.on && hasTasks) push("tasks", minsIn(b.tasks.at));

  /* One per block that opens today, offset by the grace. `blocks` comes in
     as decimal hours because the solar maths lives in `prayer-times.mjs`,
     which this file may not import — the same arrangement `prayers` has.
     A block the sun never reaches is simply absent from the list rather
     than armed at an invented hour. */
  if (b.blocks.on && Array.isArray(blocks)) {
    for (const blk of blocks) {
      if (!blk || !Number.isFinite(blk.at)) continue;
      push("block", blk.at * 60 + b.blocks.after, { block: blk.id });
    }
  }

  /* Today's timed entries. An untimed one is not armed at all: it has no
     hour to be early for, and `warn` already speaks for it in days. */
  if (b.events.on && Array.isArray(events)) {
    for (const ev of events) {
      if (!ev || !Number.isFinite(ev.at)) continue;
      push("event", ev.at * 60 - b.events.before, { id: ev.id });
    }
  }

  /* Armed unconditionally when it is on, unlike the sweep: whether there is
     anything to say is a question about the day at the moment it fires, and
     the plan is built hours earlier. The bot asks `advise` then, and sends
     nothing when the answer is empty. */
  if (b.coach.on) push("coach", minsIn(b.coach.at));
  /* The only entry that is not every day. `dow` is the caller's — the screen
     previewing today and the bot arming today pass the same number. */
  if (b.weekly.on && dow === b.weekly.dow) push("weekly", minsIn(b.weekly.at));

  /* Armed on the days it comes back, and armed whatever its condition says:
     a gated reminder is the coach all over again — whether there is anything
     worth saying is a question about a day that is still hours away when the
     plan is built, so the timer fires and `textFor` is what stays silent. */
  for (const r of b.customs) {
    if (!r.on || !r.text || !firesOn(r, when)) continue;
    push("custom", minsIn(r.at), { id: r.id, text: r.text, only: r.only });
  }

  return out.sort((a, b2) => a.at - b2.at);
}

/* The next one still ahead of `mins`, or null when the day's are all past.
   The screen reads this to say «القادم: تذكير الماء ٢:٠٠م»; the bot does
   not need it, because it arms the whole day at once. */
export const nextInPlan = (plan, mins) =>
  plan.find((p) => p.at > mins) || null;
