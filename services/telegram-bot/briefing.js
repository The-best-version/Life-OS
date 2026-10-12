/* --- the two messages nobody asks for ----------------------------------
 *  A tracker that waits to be remembered is one more thing to remember.
 *  The sync server already fires the per-block Windows toasts for the same
 *  reason; these two are the bookends — what the day asks for in the
 *  morning, and what it came to in the evening.
 *
 *  One timer at a time, re-armed after each firing. `setTimeout` takes a
 *  signed 32-bit millisecond count, so anything past ~24 days fires
 *  immediately; a single next-occurrence timer stays far inside that and
 *  also picks up a clock change or a daylight shift without a restart.
 * --------------------------------------------------------------------- */
import { REFLECT_FROM_HOUR, dayKey } from "../../src/state/life-state.mjs";
import { CONFIG } from "./config.js";

/* The evening brief defaults to the hour the app's own reflection window
   opens — one number, read from the state layer, so the message and the
   screen cannot start disagreeing about when the evening is. */
export const eveningMins = () =>
  CONFIG.eveningAt === null ? REFLECT_FROM_HOUR * 60 : CONFIG.eveningAt;

/* The next time of day `mins` comes round, from `from`. Today if it is still
   ahead, tomorrow otherwise. */
export function nextAt(mins, from = new Date()) {
  const at = new Date(from);
  at.setHours(0, Math.round(mins), 0, 0);
  if (at.getTime() <= from.getTime()) at.setDate(at.getDate() + 1);
  return at;
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

/* Arms one timer for `mins`, calls `fire`, and re-arms for the next day.
   Returns a function that cancels it. */
export function schedule(mins, fire) {
  let timer = null;
  const arm = () => {
    const at = nextAt(mins);
    timer = setTimeout(async () => {
      try {
        await fire();
      } catch (e) {
        /* A brief that fails is a brief that is missed, never a bot that
           stops: the next day's timer is armed before anything is reported. */
        console.error("brief: " + (e && e.message ? e.message : e));
      }
      arm();
    }, at.getTime() - Date.now());
    /* A pending brief must never be the reason node stays up. */
    timer.unref?.();
  };
  arm();
  return () => clearTimeout(timer);
}
