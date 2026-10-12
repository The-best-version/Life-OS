/* --- what the bot sends unprompted -------------------------------------
 *  The schedule itself is `state.bot`, and `planDay` in the state layer is
 *  what turns it into a list of minutes. Nothing here re-decides any of
 *  that: the control hub previews the same plan from the same function, and
 *  two readings of one schedule would eventually disagree about the same
 *  evening.
 *
 *  What lives here is the half that cannot be pure — turning a minute into a
 *  timer, and turning a kind into a sentence built from the day as it stands
 *  at the moment it fires. That last part is the whole difference between a
 *  reminder and a nag: «باقي ٤ أكواب» is worth looking at, «لا تنسَ الماء»
 *  is not.
 * --------------------------------------------------------------------- */
import {
  planDay,
  botShape,
  rows,
  scoredOf,
  clampGoal,
  disciplineOf,
  dayKey,
  logicalNow,
  minsIn,
  eventsIn,
  isEventDone,
  focusShape,
  phaseOf,
  RUN_STALE_MS,
} from "../../src/state/life-state.mjs";
import {
  prayerTimes,
  PRAYER_ROWS,
  blockTimes,
  BLOCK_ANCHORS,
} from "../../src/utils/prayer-times.mjs";
import { coachNote } from "./insight.js";
import { weekReview } from "./ask.js";

/* The plan for the day `now` falls in, as real moments. Prayer times are
   computed here because the state layer may not import the solar maths —
   it has to stay loadable by `node --test` with nothing installed. */
export function planToday(state, now = new Date()) {
  const place = state.place;
  const prayers =
    place && Number.isFinite(place.lat) ? prayerTimes(place, now) : null;
  const hasTasks = rows(state.tasks).some((t) => t.today && !t.done);
  /* The six blocks, as decimal hours. `blockTimes` already skips any the sun
     never reaches, so a polar latitude arms nothing rather than arming a
     reminder at an invented moment. Computed here for the same reason the
     prayer times are: the state layer may not import the solar maths. */
  const blocks = place && Number.isFinite(place.lat)
    ? blockTimes(place, now).map((b) => ({
        id: b.id,
        at: b.when.getHours() + b.when.getMinutes() / 60,
      }))
    : null;
  /* Today's timed entries, each one occurrence. An untimed entry has no hour
     to be early for and `event.warn` already speaks for it in days. */
  const today = dayKey(logicalNow(now));
  const events = [];
  for (const [, list] of eventsIn(rows(state.events), today, today)) {
    for (const { ev } of list) {
      const at = minsIn(ev.time);
      if (at === null) continue;
      events.push({ id: ev.id, at: at / 60 });
    }
  }
  const plan = planDay(state.bot, { dow: now.getDay(), prayers, hasTasks, blocks, events });
  return plan.map((p) => {
    const when = new Date(now);
    when.setHours(0, Math.round(p.at), 0, 0);
    return { ...p, when };
  });
}

/* --- the sentences ----------------------------------------------------- *
 *  Each one is built from the state at the moment it fires, never at the
 *  moment it was armed: a water reminder armed at 07:00 and fired at 15:00
 *  that still says «باقي ٨ أكواب» is a reminder that has stopped being true.
 *
 *  Returning `null` is the right output for several of these. A sweep with
 *  nothing to sweep, a water nudge after the goal is met — the message that
 *  fires to say «nothing» is the one that teaches you to ignore the rest.
 * ---------------------------------------------------------------------- */
export function textFor(entry, state, now = new Date()) {
  if (entry.kind === "water") {
    const goal = clampGoal(state.waterGoal);
    const had = Math.max(0, Math.round(state.water || 0));
    if (had >= goal) return null;
    return {
      text: `💧 ${had} من ${goal} أكواب اليوم. كوب الآن؟`,
      water: true,
    };
  }

  if (entry.kind === "prayer") {
    const row = PRAYER_ROWS.find((p) => p.id === entry.prayer);
    const mins = Math.round(botShape(state.bot).prayer.before);
    return { text: `🕌 ${row ? row.label : "الأذان"} بعد ${mins} دقيقة.` };
  }

  if (entry.kind === "tasks") {
    const open = rows(state.tasks).filter((t) => t.today && !t.done);
    if (!open.length) return null; // silence is the right output
    const lines = open.map((t) => `• ${t.text}${t.step ? `\n   ↳ ${t.step}` : ""}`);
    return {
      text: `🎯 باقي من مهام اليوم:\n${lines.join("\n")}`,
      tasks: open,
    };
  }

  /* The one entry that decides for itself whether to speak. `coachNote`
     returns null on a day with nothing wrong, and null here means the timer
     fired and nothing was sent — which is the whole reason the coach is
     worth leaving switched on. */
  if (entry.kind === "coach") {
    const note = coachNote(state, now);
    return note ? { text: note.text, actions: note.actions, coach: true } : null;
  }

  if (entry.kind === "weekly") {
    return { text: weekReview(state, now), weekly: true };
  }

  /* The block that just opened, and the habits of it still unticked. Silent
     when none are — the routine's blocks are prayer-anchored, so this is the
     one reminder that arrives when the day actually reached that part of
     itself rather than when a clock hour did. */
  if (entry.kind === "block") {
    const open = scoredOf(rows(state.habits)).filter(
      (h) => !h.done && h.group === entry.block,
    );
    if (!open.length) return null;
    const anchor = BLOCK_ANCHORS.find((b) => b.id === entry.block);
    const lines = open.map((h) => `• ${h.label}${h.min ? ` (أو: ${h.min})` : ""}`);
    return {
      text: `🕌 ${anchor ? anchor.label : "البلوك"} — باقي:\n${lines.join("\n")}`,
      habits: open,
    };
  }

  /* A timed entry on today's square. Read back off the live calendar rather
     than off the entry, like a custom reminder is: an appointment moved at
     noon must fire with its new hour at five. */
  if (entry.kind === "event") {
    const today = dayKey(logicalNow(now));
    let found = null;
    for (const [, list] of eventsIn(rows(state.events), today, today)) {
      for (const row of list) if (row.ev.id === entry.id) found = row;
    }
    if (!found) return null;
    const ev = found.ev;
    if (isEventDone(ev, found.on)) return null; // already ticked off
    const mins = Math.round(botShape(state.bot).events.before);
    return {
      text: `📅 ${ev.title} بعد ${mins} دقيقة${ev.time ? ` — ${ev.time}` : ""}${
        ev.place ? ` · ${ev.place}` : ""
      }`,
    };
  }

  if (entry.kind === "custom") {
    /* Read back off the live schedule rather than off the entry: a reminder
       whose text was edited at noon must fire with the new words at five,
       and the plan it was armed from is hours old by then. */
    const own = botShape(state.bot).customs.find((r) => r.id === entry.id);
    const text = own && own.on ? own.text : null;
    return text ? { text: `🔔 ${text}` } : null;
  }

  return null; // morning and evening are the briefs, and they build their own
}

/* A one-line summary of where the day stands, appended to nothing and used
   by the health strip. Derived, like everything else that reads a day. */
export function standOf(state) {
  const habits = rows(state.habits);
  const scored = scoredOf(habits);
  return {
    date: state.date || dayKey(),
    pct: disciplineOf(habits),
    openScored: scored.filter((h) => !h.done).length,
    water: Math.max(0, Math.round(state.water || 0)),
    waterGoal: clampGoal(state.waterGoal),
  };
}

/* --- the cue of the day ------------------------------------------------ *
 *  The app walks its quote list from a cursor and advances on every open,
 *  because a card keyed to the date never visibly moves within a day and
 *  reads as broken. A message sent once a day has the opposite problem: it
 *  must be the *same* quote all morning if he reads it twice, and a cursor
 *  in this process would restart with it. So this one is keyed to the day,
 *  which is the one place that reasoning inverts.
 * ---------------------------------------------------------------------- */
export function quoteFor(quotes, day = dayKey()) {
  const list = Array.isArray(quotes) ? quotes.filter((q) => q && q.text) : [];
  if (!list.length) return null;
  /* A cheap, stable hash of the day key — the date alone would walk the list
     in lockstep with the month and show the same quote every 1st. */
  let h = 0;
  for (const ch of String(day)) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  return list[h % list.length];
}

/* --- arming the day ---------------------------------------------------- *
 *  One timer per entry, all of them for today only, re-armed whenever the
 *  schedule or the day changes. `setTimeout` takes a signed 32-bit
 *  millisecond count — anything past ~24 days fires immediately — and a day
 *  at a time stays far inside that while also picking up a changed city, a
 *  new prayer time or an edited reminder without a restart.
 * ---------------------------------------------------------------------- */
export class Scheduler {
  constructor(fire) {
    this.fire = fire;
    this.timers = [];
    this.armed = [];
    this.stamp = null;
  }

  /* What the plan depends on, as one string. Re-arming on every tick would
     mean cancelling and recreating a dozen timers a minute for nothing, and
     re-arming on none of them would mean an edit that never takes effect
     until tomorrow. */
  static stampOf(state, now) {
    return JSON.stringify([
      state.date,
      now.toDateString(),
      state.bot,
      state.place,
      rows(state.tasks).some((t) => t.today && !t.done),
    ]);
  }

  /* Returns true when it actually re-armed. */
  sync(state, now = new Date()) {
    const stamp = Scheduler.stampOf(state, now);
    if (stamp === this.stamp) return false;
    this.stamp = stamp;
    this.clear();
    for (const entry of planToday(state, now)) {
      const wait = entry.when.getTime() - now.getTime();
      if (wait <= 0) continue; // already past today; tomorrow's arming catches it
      const t = setTimeout(() => this.fire(entry), wait);
      /* A pending reminder must never be the reason node stays up. */
      t.unref?.();
      this.timers.push(t);
      this.armed.push(entry);
    }
    return true;
  }

  clear() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.armed = [];
  }
}

/* --- «لاحقًا», and why it is not a dismissal --------------------------- *
 *  A nudge that cannot be deferred is a nudge you mute, and a muted
 *  reminder takes every other reminder with it — the whole schedule is
 *  switched off by the one message that arrived at the wrong minute. The
 *  reflection prompt in the app learned this already; this is the same
 *  tolerance for everything the bot sends.
 *
 *  The *entry* is held, never the text. A water reminder deferred at eleven
 *  and fired at noon must say what is left at noon — the rule every sentence
 *  in this file keeps, and holding the rendered message would be the one
 *  place it was broken.
 *
 *  In memory only, like the undo bus: a pending snooze is not state that has
 *  to survive anything, and written to disk it would be a second copy of the
 *  day arguing with the first.
 * ---------------------------------------------------------------------- */
export class Snoozer {
  constructor(fire, keep = 40) {
    this.fire = fire;
    this.keep = keep;
    this.waiting = new Map();
    this.seq = 0;
  }

  /* Hands back a token for the button to carry. */
  hold(entry) {
    const token = String(++this.seq);
    this.waiting.set(token, { entry, timer: null });
    while (this.waiting.size > this.keep) {
      const oldest = this.waiting.keys().next().value;
      this.drop(oldest);
    }
    return token;
  }

  /* True when it armed, false when the token is gone — the caller says so
     out loud rather than leaving a pressed button doing nothing. */
  arm(token, minutes) {
    const row = this.waiting.get(token);
    if (!row) return false;
    const ms = Math.max(1, Math.round(Number(minutes) || 0)) * 60000;
    if (row.timer) clearTimeout(row.timer);
    row.timer = setTimeout(() => {
      this.waiting.delete(token);
      this.fire(row.entry);
    }, ms);
    /* A deferred reminder must never be the reason node stays up. */
    row.timer.unref?.();
    return true;
  }

  drop(token) {
    const row = this.waiting.get(token);
    if (row?.timer) clearTimeout(row.timer);
    this.waiting.delete(token);
  }

  clear() {
    for (const token of [...this.waiting.keys()]) this.drop(token);
  }
}

/* --- the one moment no clock time can predict -------------------------- *
 *  Every other thing the bot sends unprompted comes off `planDay`, which is
 *  a list of minutes past midnight. A focus round's bell is not: it rings at
 *  `run.endAt`, an absolute epoch that only exists once the round was
 *  started, and a schedule armed at four in the morning cannot know about a
 *  round begun at two in the afternoon.
 *
 *  So it is a second, tiny scheduler, and it is deliberately not folded into
 *  the first: `Scheduler.sync` re-arms a dozen timers whenever the *plan*
 *  moves, and the run moves far more often than the plan does — every pause,
 *  every resume, every round. One timer, re-armed off one number.
 *
 *  It respects the master switch, like everything else unprompted: a round
 *  started on the laptop already rings there, and two bells for one round is
 *  the kind of duplication that gets a bot muted.
 * ---------------------------------------------------------------------- */
export class Bell {
  constructor(ring) {
    this.ring = ring;
    this.timer = null;
    /* The deadline currently armed, or null. Compared rather than recomputed,
       so a tick that changes nothing arms nothing. */
    this.at = null;
  }

  /* Returns true when the arming actually changed. */
  sync(state, now = Date.now()) {
    const bot = botShape(state.bot);
    const run = focusShape(state.focus).run;
    /* Only a round that is *counting* has a bell. A paused one has no
       deadline to ring at, and that is correct: a pause is a round nobody is
       waiting on. */
    const at = bot.on && run && run.endAt ? run.endAt : null;
    if (at === this.at) return false;
    this.clear();
    this.at = at;
    if (at === null) return true;
    const wait = at - now;
    /* Already past, or further out than a round can possibly be. Either way
       nothing is armed: the first is settled by `settleRun` on the next
       write, and the second is a damaged `endAt` that `setTimeout` would
       fire on immediately. */
    if (wait <= 0 || wait > RUN_STALE_MS) {
      this.at = null;
      return true;
    }
    const phase = run.phase;
    const planned = run.planned;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.at = null;
      this.ring({ phase, planned, label: phaseOf(phase).label });
    }, wait);
    this.timer.unref?.();
    return true;
  }

  clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
