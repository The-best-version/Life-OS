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
} from "../../src/state/life-state.mjs";
import { prayerTimes, PRAYER_ROWS } from "../../src/utils/prayer-times.mjs";

/* The plan for the day `now` falls in, as real moments. Prayer times are
   computed here because the state layer may not import the solar maths —
   it has to stay loadable by `node --test` with nothing installed. */
export function planToday(state, now = new Date()) {
  const place = state.place;
  const prayers =
    place && Number.isFinite(place.lat) ? prayerTimes(place, now) : null;
  const hasTasks = rows(state.tasks).some((t) => t.today && !t.done);
  const plan = planDay(state.bot, { dow: now.getDay(), prayers, hasTasks });
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
export function textFor(entry, state) {
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
