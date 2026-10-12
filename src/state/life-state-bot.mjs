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
import { uid, obj, rows, hhmm, minsIn, clampNum } from "./life-state-util.mjs";

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
  return {
    id: r.id || uid(),
    on: r.on !== false,
    /* An unreadable time becomes 09:00 rather than nothing: a reminder with
       no hour cannot be armed, and silently dropping the row would delete
       text the user typed. */
    at: hhmm(r.at, "09:00"),
    text: typeof r.text === "string" ? r.text.slice(0, REMINDER_MAX) : "",
    days: days.length === 7 ? [] : days,
  };
};

/* --- the whole schedule ------------------------------------------------ */
export const botShape = (b) => {
  b = obj(b);
  const water = obj(b.water);
  const prayer = obj(b.prayer);
  const tasks = obj(b.tasks);
  const coach = obj(b.coach);
  const weekly = obj(b.weekly);
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
export function planDay(bot, { dow = 0, prayers = null, hasTasks = true } = {}) {
  const b = botShape(bot);
  const out = [];
  if (!b.on) return out;

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

  /* Armed unconditionally when it is on, unlike the sweep: whether there is
     anything to say is a question about the day at the moment it fires, and
     the plan is built hours earlier. The bot asks `advise` then, and sends
     nothing when the answer is empty. */
  if (b.coach.on) push("coach", minsIn(b.coach.at));
  /* The only entry that is not every day. `dow` is the caller's — the screen
     previewing today and the bot arming today pass the same number. */
  if (b.weekly.on && dow === b.weekly.dow) push("weekly", minsIn(b.weekly.at));

  for (const r of b.customs) {
    if (!r.on || !r.text || !onDay(r, dow)) continue;
    push("custom", minsIn(r.at), { id: r.id, text: r.text });
  }

  return out.sort((a, b2) => a.at - b2.at);
}

/* The next one still ahead of `mins`, or null when the day's are all past.
   The screen reads this to say «القادم: تذكير الماء ٢:٠٠م»; the bot does
   not need it, because it arms the whole day at once. */
export const nextInPlan = (plan, mins) =>
  plan.find((p) => p.at > mins) || null;
