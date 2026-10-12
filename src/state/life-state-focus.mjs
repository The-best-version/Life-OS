/* --- the focus desk: rounds, breaks, and the day's total ----------------
 *  A pomodoro is not a countdown. It is a rhythm — a round, a break, a
 *  longer break every few rounds — and a timer that only counts down is the
 *  half of it that does not actually protect the day: the hour that gets
 *  lost is the one spent "just finishing this" through a break that never
 *  came. So the phase is state, not a label: `run.phase` is what is open
 *  right now, `nextBreak` says what follows a finished round, and the screen
 *  only ever renders what is here.
 *
 *  Three things live here rather than in the screen, each for a reason the
 *  project has already paid for once:
 *
 *  - **The run is persisted.** It was React state, so a reload in the middle
 *    of a ninety-minute round lost the round — and a reload is not rare in
 *    this app: the conflict bar's «حمّل الأحدث» reloads, a follower window
 *    reloads itself, and an installed window gets reloaded by the service
 *    worker's update. The run is counted off an absolute `endAt`, so a
 *    window that comes back mid-round comes back on the right second.
 *  - **A run found already over is settled by one function.** `settleRun` is
 *    the difference between "the bell rang into an empty room, write the
 *    round down" and "the laptop was shut for two days, invent ninety
 *    minutes of work that never happened". A timer that logs the second one
 *    is worse than no timer, because every number above it is then a guess.
 *  - **A stopped round is still work.** The old timer logged nothing at all
 *    unless the round finished, so eighty minutes of a ninety-minute round
 *    simply never existed. `sessionOf` writes the minutes actually spent and
 *    marks the row `full: false`, which is how the total stays honest
 *    without the day's record quietly rounding itself up.
 *
 *  `bandAt` is read off `life-state-habits.mjs` — the second domain file to
 *  read a sibling, after `life-state-streak.mjs`. The alternative was a
 *  second table of the day's hour bands, and the breaker's mirror and this
 *  screen disagreeing about when the evening starts.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  dayKey,
  addDays,
  clampNum,
  logicalNow,
} from "./life-state-util.mjs";
import { bandAt, HOUR_BANDS } from "./life-state-habits.mjs";

/* How many rounds the archive keeps. Four hundred was about four months of
   real use and was spent by the slice with no name on it; six hundred is
   over a year, and the analytics below never reach past ninety days. */
export const SESSION_CAP = 600;

/* How many presets the list may hold. A chooser is only a chooser while the
   eye can take it in at once — past eight the list is the decision it was
   meant to remove. */
export const PRESET_CAP = 8;

/* Minutes a day. Two hours of genuinely undistracted work is a full day's
   output for most people and an ambitious target for anyone; the meter is
   there to be met, not to be a wall. */
export const FOCUS_GOAL_DEFAULT = 120;
export const FOCUS_GOAL_MAX = 720;

/* A round found over by this much is not a round anybody sat through. Six
   hours is long enough to cover a bell that rang while he was at lunch and
   short enough that a laptop closed overnight never writes a day it did not
   live. Past it the run is dropped, not logged — see `settleRun`. */
export const RUN_STALE_MS = 6 * 60 * 60 * 1000;

/* Under a minute is not a session, it is a misclick. Stopping inside the
   first minute cancels the round instead of writing a row that only makes
   the list harder to read. */
export const MIN_LOGGED = 1;

/* Interruptions in one round. Bounded because it is a tap counter and a
   pocket can tap. */
export const INTERRUPT_MAX = 99;

/* The three phases, in the order a cycle runs them. Labels here, tints and
   icons fastened on in the screen — the same division `PILLARS` keeps,
   except that a phase has no tint of its own in the state because its
   colour is the screen's statement about it, not the data's. */
export const PHASES = [
  { id: "focus", label: "جولة تركيز", verb: "ركّز" },
  { id: "short", label: "راحة قصيرة", verb: "استرح" },
  { id: "long", label: "راحة طويلة", verb: "استرح" },
];
export const PHASE_IDS = PHASES.map((p) => p.id);
export const phaseOf = (id) => PHASES.find((p) => p.id === id) || PHASES[0];
export const isBreak = (id) => id === "short" || id === "long";

/* --- a preset ---------------------------------------------------------- *
 *  The length of a round *and* the breaks that belong to it, together in
 *  one row. That pairing is the whole reason a preset exists: a 90-minute
 *  cycle followed by a 5-minute break is not a rhythm, it is a 90-minute
 *  round with a pause in it, and a single global break length guarantees
 *  one of the two presets is wrong. So every preset carries its own.
 * ---------------------------------------------------------------------- */
export const ROUND_MIN = 5;
export const ROUND_MAX = 180;
export const BREAK_MIN = 1;
export const BREAK_MAX = 60;
export const LONG_MIN = 5;
export const LONG_MAX = 90;
export const EVERY_MIN = 2;
export const EVERY_MAX = 8;

const labelOf = (v, fallback, cap = 40) => {
  const s = typeof v === "string" ? v.trim() : "";
  /* Trimmed and bounded, never cleared — text he typed is not deleted on
     the way through a shape that runs on every load. */
  return s ? s.slice(0, cap) : fallback;
};

const whole = (v, min, max, fallback) =>
  Math.round(clampNum(v, min, max, fallback));

export const presetShape = (p) => (
  (p = obj(p)),
  {
    id: p.id || uid(),
    label: labelOf(p.label, "جولة"),
    min: whole(p.min, ROUND_MIN, ROUND_MAX, 25),
    brk: whole(p.brk, BREAK_MIN, BREAK_MAX, 5),
    long: whole(p.long, LONG_MIN, LONG_MAX, 15),
    every: whole(p.every, EVERY_MIN, EVERY_MAX, 4),
  }
);

/* The four rhythms worth shipping, and they are deliberately not four
   lengths of the same thing. The short one is the floor — the same idea as
   a habit's `min`: the day a round dies is never the day the work was hard,
   it is the day fifty minutes was impossible and the only move left was to
   do nothing at all. */
export const PRESET_SEED = [
  { label: "بومودورو", min: 25, brk: 5, long: 15, every: 4 },
  { label: "جولة قصيرة", min: 15, brk: 3, long: 10, every: 4 },
  { label: "عمل عميق", min: 50, brk: 10, long: 20, every: 3 },
  { label: "دورة كاملة", min: 90, brk: 20, long: 30, every: 2 },
];

export const SEED_PRESETS = () => PRESET_SEED.map(presetShape);

export const presetIn = (focus, id) =>
  rows(focus && focus.presets).find((p) => p.id === id) || null;

/* The preset a run belongs to, or the picked one, or the first — a run whose
   preset was deleted mid-round still has to be able to finish. */
export const presetFor = (focus, id) => {
  const list = rows(focus && focus.presets);
  if (!list.length) return presetShape({});
  return presetIn(focus, id) || presetIn(focus, focus && focus.pick) || list[0];
};

/* --- the live run ------------------------------------------------------ *
 *  Counted off `endAt`, an absolute epoch, and never off a decrementing
 *  counter: an interval drifts, and a hidden tab's timers are throttled to
 *  once a minute, so a counted-down timer silently loses minutes while the
 *  work is actually happening. `left` is the seconds remaining and is
 *  authoritative only while paused, which is the one state where there is no
 *  deadline to subtract from.
 * ---------------------------------------------------------------------- */
export const runShape = (r) => {
  r = obj(r);
  if (!PHASE_IDS.includes(r.phase)) return null;
  /* Bounded at twice the longest preset, not at `ROUND_MAX`: «خمس دقائق
     أخرى» raises `planned` on a running round, and a bound that refused it
     would clamp the round back down on the next reload and lose the
     minutes the extension had already earned. */
  const planned = whole(r.planned, 1, ROUND_MAX * 2, 25);
  const endAt = Number.isFinite(+r.endAt) && +r.endAt > 0 ? +r.endAt : null;
  const left = whole(r.left, 0, planned * 60, planned * 60);
  /* A run with neither a deadline nor a remainder is not a run. */
  if (endAt === null && left <= 0) return null;
  return {
    phase: r.phase,
    presetId: r.presetId || null,
    planned,
    taskId: r.taskId || null,
    /* Frozen on the way in, so a round still shows what it was for after
       the task behind it is deleted or renamed. */
    label: labelOf(r.label, "", 120),
    round: whole(r.round, 0, 99, 0),
    interrupts: whole(r.interrupts, 0, INTERRUPT_MAX, 0),
    endAt,
    left,
    startedAt: Number.isFinite(+r.startedAt) && +r.startedAt > 0 ? +r.startedAt : null,
    /* When the run was last touched. The only thing that can tell a paused
       round from a paused round abandoned on Tuesday. */
    at: Number.isFinite(+r.at) && +r.at > 0 ? +r.at : null,
  };
};

/* A phase, armed and not yet started. Paused by construction — nothing
   starts counting until the screen says so, so arming a round and arming a
   break are the same operation. */
export const armRun = ({
  phase = "focus",
  planned = 25,
  presetId = null,
  taskId = null,
  label = "",
  round = 0,
  now = Date.now(),
} = {}) =>
  runShape({
    phase,
    planned,
    presetId,
    taskId,
    label,
    round,
    interrupts: 0,
    endAt: null,
    left: Math.max(1, Math.round(planned * 60)),
    startedAt: null,
    at: now,
  });

/* Bounded at both ends, and the *upper* bound is not decoration: the screen
   ticks `now` only while something is counting, so the render in which a
   round starts still holds the `now` from whenever the clock last moved —
   and `endAt - now` then comes out larger than the round itself. The dial
   showed «25:17» for one frame on a twenty-five-minute round before
   snapping back. A run can never have more left than it was planned for,
   so saying it here makes a stale clock harmless everywhere at once. */
export const runLeft = (run, now = Date.now()) => {
  if (!run) return 0;
  const cap = Math.max(0, Math.round(run.planned * 60));
  const raw = run.endAt
    ? Math.round((run.endAt - now) / 1000)
    : Math.round(run.left || 0);
  return Math.min(cap, Math.max(0, raw));
};

export const runRunning = (run) => !!(run && run.endAt);

export const runDone = (run, now = Date.now()) =>
  !!(run && run.endAt && now >= run.endAt);

/* Seconds actually spent inside this phase. `left` only ever falls while the
   clock is running, so planned-minus-left is the time worked and a pause of
   any length costs nothing. */
export const runSpent = (run, now = Date.now()) =>
  run ? Math.max(0, run.planned * 60 - runLeft(run, now)) : 0;

export const spentMinutes = (run, now = Date.now()) =>
  Math.round(runSpent(run, now) / 60);

export const startRun = (run, now = Date.now()) => {
  if (!run) return null;
  const left = runLeft(run, now);
  if (left <= 0) return run;
  return {
    ...run,
    endAt: now + left * 1000,
    left,
    startedAt: run.startedAt || now,
    at: now,
  };
};

export const pauseRun = (run, now = Date.now()) => {
  if (!run) return null;
  return { ...run, left: runLeft(run, now), endAt: null, at: now };
};

/* Abandoned, not finished. A run paused this long ago, or a deadline this
   far past, is a window that was shut rather than a round anybody is still
   in — and the only wrong answer is to treat it as work. */
export const runStale = (run, now = Date.now()) => {
  if (!run) return false;
  const since = run.endAt ? now - run.endAt : now - (run.at || now);
  return since > RUN_STALE_MS;
};

/* --- a logged round --------------------------------------------------- *
 *  `minutes` is what was worked and `planned` is what was asked for, so
 *  `full` is never a second opinion about the same row. `at` is the epoch
 *  the round started — the day key alone cannot say whether the work
 *  happened at six in the morning or at midnight, which is the question the
 *  hour bands below answer.
 * ---------------------------------------------------------------------- */
const dateOf = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : dayKey());

export const sessionShape = (s) => (
  (s = obj(s)),
  {
    id: s.id || uid(),
    date: dateOf(s.date),
    /* Null is allowed and gated on everywhere: every row written before
       this file existed carried a date and a length and nothing else. */
    at: Number.isFinite(+s.at) && +s.at > 0 ? +s.at : null,
    minutes: whole(s.minutes, 0, ROUND_MAX * 4, 0),
    planned: whole(s.planned, 0, ROUND_MAX * 4, whole(s.minutes, 0, ROUND_MAX * 4, 0)),
    taskId: s.taskId || null,
    label: labelOf(s.label, "", 120),
    interrupts: whole(s.interrupts, 0, INTERRUPT_MAX, 0),
    /* An older row was only ever written on completion, so an absent flag
       means a round that finished — not one that was cut short. */
    full: s.full === undefined ? true : !!s.full,
    note: labelOf(s.note, "", 160),
  }
);

/* The row a run leaves behind. A break leaves none: `state.sessions` has
   meant "جلسة تركيز" since the day it existed — in the data-health panel, in
   the recovery centre's row counts and in every total on this screen — and
   quietly filing rest in it would make all three say something they do not
   mean. */
export const sessionOf = (run, { minutes, full, note, now = Date.now() } = {}) => {
  if (!run || isBreak(run.phase)) return null;
  const done = Math.round(
    Number.isFinite(+minutes) ? +minutes : spentMinutes(run, now),
  );
  if (done < MIN_LOGGED) return null;
  const startedAt = run.startedAt || now;
  return sessionShape({
    /* Dated by the logical day the round *started* in, so a round begun at
       03:45 belongs to the night it was worked and not to the morning the
       bell rang in. Through `logicalNow`, because `dayKey(date)` with an
       argument means that exact calendar square — the shift is the whole
       point here. */
    date: dayKey(logicalNow(new Date(startedAt))),
    at: startedAt,
    minutes: done,
    planned: run.planned,
    taskId: run.taskId,
    label: run.label,
    interrupts: run.interrupts,
    full: full === undefined ? done >= run.planned : !!full,
    note,
  });
};

/* A round typed in by hand — work that happened away from the screen. Same
   shape, same cap, same honesty: it is marked `full` because there is no
   plan to have fallen short of. */
export const manualSession = ({ minutes, taskId = null, label = "", note = "", at = Date.now() } = {}) => {
  const done = whole(minutes, 0, ROUND_MAX * 4, 0);
  if (done < MIN_LOGGED) return null;
  return sessionShape({
    date: dayKey(logicalNow(new Date(at))),
    at,
    minutes: done,
    planned: done,
    taskId,
    label,
    note,
    full: true,
  });
};

export const addSession = (list, row) =>
  row ? [...rows(list), sessionShape(row)].slice(-SESSION_CAP) : rows(list);

/* --- what follows what ------------------------------------------------ *
 *  The long break every `every` rounds, the short one otherwise. Counted off
 *  rounds *completed*, so it is the fourth round that earns the long break
 *  and not the fifth.
 * ---------------------------------------------------------------------- */
export const nextBreak = (preset, round) => {
  const every = whole(preset && preset.every, EVERY_MIN, EVERY_MAX, 4);
  const n = whole(round, 0, 99, 0);
  return n > 0 && n % every === 0 ? "long" : "short";
};

export const breakMinutes = (preset, phase) =>
  phase === "long"
    ? whole(preset && preset.long, LONG_MIN, LONG_MAX, 15)
    : whole(preset && preset.brk, BREAK_MIN, BREAK_MAX, 5);

/* How many rounds are left before the long one. Said out loud on the screen,
   because a rhythm you cannot see the shape of is a rhythm you break. */
export const tillLong = (preset, round) => {
  const every = whole(preset && preset.every, EVERY_MIN, EVERY_MAX, 4);
  const n = whole(round, 0, 99, 0) % every;
  return every - n;
};

/* --- a run found already over ----------------------------------------- *
 *  Called on every mount and whenever the window becomes visible again,
 *  which is also the fix for a bell that rang in a background tab: Chrome
 *  throttles a hidden window's timers to once a minute, so the completion
 *  can fire late — but coming back to the window settles it on the spot,
 *  off the same absolute deadline the ring was drawn from.
 *
 *  Returns the row to append (never for a break), the run to keep, and
 *  whether anything actually happened — the screen needs all three to know
 *  whether to sound the bell and what to say.
 * ---------------------------------------------------------------------- */
export function settleRun(run, now = Date.now()) {
  if (!run) return { run: null, log: null, rang: false, dropped: false };
  if (runStale(run, now))
    /* A round still *counting* when it went stale writes nothing: nobody can
       say when he left it. A round he *paused* is the one case the amount
       worked is known exactly — `left` stopped moving the moment he pressed
       pause — so those minutes are handed back and kept, marked for what
       they are. Dropping them was the lossy half of this rule. */
    return {
      run: null,
      log: run.endAt ? null : sessionOf(run, { full: false, now }),
      rang: false,
      dropped: true,
    };
  if (!runDone(run, now)) return { run, log: null, rang: false, dropped: false };
  return {
    run: null,
    log: sessionOf(run, { minutes: run.planned, full: true, now }),
    rang: true,
    dropped: false,
  };
}

/* --- a phase closed, and what follows it ------------------------------- *
 *  The cycle counter, the row to file, and the next phase armed — the three
 *  things that happen together when a round ends, and they have to happen
 *  together or the rhythm comes apart: a round logged without advancing the
 *  counter is a long break that never arrives, and a counter advanced
 *  without logging is a break earned by work nobody recorded.
 *
 *  It was written inside the focus desk's own `endPhase` while the screen
 *  was the only thing that could end a round. The Telegram bot starts and
 *  stops rounds from a phone now, and two copies of this arithmetic is a bug
 *  waiting for the day they disagree about whether the fourth round earns
 *  the long break — so it lives here, with the rest of the rhythm, and both
 *  callers read it.
 *
 *  Pure, and it returns the slices rather than a whole state: the caller
 *  knows whether it is inside a `setState` or building a payload for the
 *  disk. The untouched lists are handed back **by identity**, never through
 *  `rows()` — a fresh array for an unchanged list is a re-render of every
 *  screen reading it.
 * ---------------------------------------------------------------------- */
export function closePhase(
  state,
  run,
  { log = true, minutes, full, advance = true, nextRun = null, at = Date.now() } = {},
) {
  const base = focusShape(obj(state).focus);
  if (!run) return { row: null, round: base.round, run: base.run, focus: base, sessions: state.sessions, tasks: state.tasks };
  const wasFocus = !isBreak(run.phase);
  /* A break leaves no row. `state.sessions` has meant «جلسة تركيز» since the
     day it existed, and filing rest in it would make the data-health panel,
     the recovery centre and every total on the desk say something they do
     not mean. */
  const row = log && wasFocus ? sessionOf(run, { minutes, full, now: at }) : null;
  const p = presetFor(base, run.presetId);
  /* A completed focus round adds one, a completed long break resets it, and
     anything else leaves it alone. A round cut short does not advance it —
     the long break is earned by rounds that were actually sat through. */
  const round = !advance
    ? base.round
    : wasFocus
      ? Math.min(EVERY_MAX * 2, base.round + 1)
      : run.phase === "long"
        ? 0
        : base.round;
  let next = nextRun;
  if (next === null && advance) {
    if (wasFocus && base.autoBreak) {
      const bp = nextBreak(p, round);
      next = armRun({
        phase: bp,
        planned: breakMinutes(p, bp),
        presetId: p.id,
        taskId: run.taskId,
        label: run.label,
        round,
        now: at,
      });
      /* The break arms *and* starts itself by default, because the break is
         the half of the technique that gets skipped. */
      if (base.autoStartBreak) next = startRun(next, at);
    } else if (!wasFocus) {
      next = armRun({
        phase: "focus",
        planned: p.min,
        presetId: p.id,
        taskId: run.taskId,
        label: run.label,
        round,
        now: at,
      });
      /* The next round does not start itself unless he said so: a round
         nobody chose to begin is a round nobody committed to. */
      if (base.autoNext) next = startRun(next, at);
    }
  }
  return {
    row,
    round,
    run: next,
    focus: { ...base, round, run: next },
    sessions: row ? addSession(state.sessions, row) : state.sessions,
    /* The old behaviour, opt-in and off by default: twenty-five minutes is
       not evidence that a task is finished. */
    tasks:
      wasFocus && row && base.autoDone && run.taskId
        ? rows(state.tasks).map((t) => (t.id === run.taskId ? { ...t, done: true } : t))
        : state.tasks,
  };
}

/* --- the desk's own state --------------------------------------------- */
export const focusShape = (f) => {
  f = obj(f);
  const kept = rows(f.presets).map(presetShape).slice(0, PRESET_CAP);
  /* An empty list is not a choice he can have made — the editor refuses to
     delete the last one — so it is a payload that lost them, and the seeds
     come back rather than leaving the screen with nothing to start. */
  const presets = kept.length ? kept : SEED_PRESETS();
  const pick = presets.some((p) => p.id === f.pick) ? f.pick : presets[0].id;
  return {
    presets,
    pick,
    goal: whole(f.goal, 0, FOCUS_GOAL_MAX, FOCUS_GOAL_DEFAULT),
    /* The break arms itself, because the break is the half of the technique
       that gets skipped. It does not *start* itself unless he says so. */
    autoBreak: f.autoBreak === undefined ? true : !!f.autoBreak,
    autoStartBreak: f.autoStartBreak === undefined ? true : !!f.autoStartBreak,
    /* The next round does not start itself by default: a round nobody chose
       to begin is a round nobody committed to, and a timer that rolls
       straight on is how an afternoon of "rounds" happens with the chair
       empty. */
    autoNext: !!f.autoNext,
    chime: f.chime === undefined ? true : !!f.chime,
    notify: f.notify === undefined ? true : !!f.notify,
    /* Keep the screen awake while a round runs. On by default — a screen
       that sleeps mid-round takes the countdown with it. */
    awake: f.awake === undefined ? true : !!f.awake,
    /* The old behaviour: a finished round silently marked its task done.
       Off, because twenty-five minutes is not evidence that a task is
       finished, and a task ticked by a timer is a task he has to go and
       untick. The end-of-round sheet asks instead. */
    autoDone: !!f.autoDone,
    /* Focus rounds completed in the current cycle — what the long break is
       counted off. Per-cycle and per-day, never cumulative. */
    round: whole(f.round, 0, 99, 0),
    run: runShape(f.run),
  };
};

/* What crosses a day rollover: the presets, the goal and the switches — and
   the run, because a round begun at 03:50 is still being worked at 04:01.
   The cycle count does not: four rounds yesterday must not hand today's
   first round a long break. */
export const focusCarry = (f) => ({ ...focusShape(f), round: 0 });

/* --- the readings ----------------------------------------------------- *
 *  Every number the screen prints comes from here, so the meter, the week
 *  bars, the streak and the per-task totals cannot disagree about the same
 *  minutes. All pure, all tested.
 * ---------------------------------------------------------------------- */
export const sessionsOn = (sessions, date = dayKey()) =>
  rows(sessions).filter((s) => dateOf(s.date) === date);

export const sessionMinutes = (list) =>
  rows(list).reduce((n, s) => n + whole(s.minutes, 0, ROUND_MAX * 4, 0), 0);

/* One day, counted once. `rounds` counts rows, `full` counts the ones that
   went the distance, and the two are reported side by side rather than as a
   percentage — three rounds of four is a fact, 75% is a grade. */
export const focusDay = (sessions, date = dayKey()) => {
  const list = sessionsOn(sessions, date);
  return {
    date,
    minutes: sessionMinutes(list),
    rounds: list.length,
    full: list.filter((s) => s.full).length,
    interrupts: list.reduce((n, s) => n + whole(s.interrupts, 0, INTERRUPT_MAX, 0), 0),
  };
};

/* Days in a row that met the goal, counting back from today. A streak whose
   last qualifying day was yesterday still counts today — the day is not
   over, and zeroing it at midnight would punish the man who works in the
   evening. The same rule `readStreak` keeps, for the same reason. */
export function focusStreak(sessions, goal) {
  const list = rows(sessions);
  if (!list.length || !(goal > 0)) return 0;
  const byDay = new Map();
  for (const s of list)
    byDay.set(dateOf(s.date), (byDay.get(dateOf(s.date)) || 0) + whole(s.minutes, 0, ROUND_MAX * 4, 0));

  const d = logicalNow();
  if ((byDay.get(dayKey(d)) || 0) < goal) d.setDate(d.getDate() - 1);

  let n = 0;
  for (;;) {
    if ((byDay.get(dayKey(d)) || 0) < goal) return n;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
}

/* The last `days` days, oldest first — the shape the bars are drawn from. A
   day with no work is a row with a zero and not a missing row, because a
   chart that only plots the days that happened flatters every week with a
   hole in it. */
export const focusWeek = (sessions, days = 7, today = dayKey()) => {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) out.push(focusDay(sessions, addDays(today, -i)));
  return out;
};

export const sessionsSince = (sessions, days = 30, today = dayKey()) => {
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  return rows(sessions).filter((s) => dateOf(s.date) >= from);
};

/* The hour bands the work actually landed in, over a window. Only rows that
   recorded a start time can answer — an older row knows its day and not its
   hour — so the count says how many it had to leave out rather than
   pretending the rest is the whole picture. */
export const focusBands = (sessions, days = 30, today = dayKey()) => {
  const list = sessionsSince(sessions, days, today);
  const byBand = new Map(HOUR_BANDS.map((b) => [b.id, 0]));
  let known = 0;
  for (const s of list) {
    if (!s.at) continue;
    const h = new Date(s.at).getHours();
    if (!Number.isFinite(h)) continue;
    const b = bandAt(h);
    byBand.set(b.id, (byBand.get(b.id) || 0) + whole(s.minutes, 0, ROUND_MAX * 4, 0));
    known += 1;
  }
  return {
    known,
    missing: list.length - known,
    bands: HOUR_BANDS.map((b) => ({ ...b, minutes: byBand.get(b.id) || 0 })),
  };
};

/* The band the most minutes landed in, or null while there is nothing to
   claim. A single round is not a pattern, so the floor is deliberate. */
export const bestBand = (sessions, days = 30, today = dayKey(), floor = 3) => {
  const { known, bands } = focusBands(sessions, days, today);
  if (known < floor) return null;
  const top = bands.slice().sort((a, b) => b.minutes - a.minutes)[0];
  return top && top.minutes > 0 ? top : null;
};

/* Minutes per task over a window, biggest first. The name is taken off the
   task when it still exists and off the row's own frozen label when it does
   not — a deleted task does not erase the afternoon that went into it. */
export const focusByTask = (sessions, tasks, days = 7, today = dayKey()) => {
  const list = sessionsSince(sessions, days, today);
  const names = new Map(rows(tasks).map((t) => [t.id, t.text]));
  const byTask = new Map();
  for (const s of list) {
    const key = s.taskId || `label:${s.label || ""}`;
    const row = byTask.get(key) || {
      key,
      taskId: s.taskId || null,
      label: names.get(s.taskId) || s.label || "بلا مهمة محدّدة",
      gone: !!s.taskId && !names.has(s.taskId),
      minutes: 0,
      rounds: 0,
    };
    row.minutes += whole(s.minutes, 0, ROUND_MAX * 4, 0);
    row.rounds += 1;
    byTask.set(key, row);
  }
  return [...byTask.values()].sort((a, b) => b.minutes - a.minutes);
};

/* The best day in a window, and the window's own total and average. The
   average is taken over *every* day in the window including the empty ones,
   for the same reason a gap row is never averaged away in the archive: an
   average over "the days that had work" is a number that improves every
   time a day is missed. */
export const focusSpan = (sessions, days = 30, today = dayKey()) => {
  const span = Math.max(1, Math.round(days));
  let total = 0;
  let rounds = 0;
  let best = null;
  let active = 0;
  for (let i = 0; i < span; i += 1) {
    const d = focusDay(sessions, addDays(today, -i));
    total += d.minutes;
    rounds += d.rounds;
    if (d.minutes > 0) active += 1;
    if (!best || d.minutes > best.minutes) best = d;
  }
  return {
    days: span,
    total,
    rounds,
    active,
    best,
    perDay: Math.round(total / span),
  };
};

/* Interruptions per round over a window, to one decimal — the number the
   technique is actually about. Null rather than zero when there are no
   rounds to divide by: no rounds is no reading, not a clean sheet. */
export const interruptRate = (sessions, days = 7, today = dayKey()) => {
  const list = sessionsSince(sessions, days, today);
  if (!list.length) return null;
  const n = list.reduce((a, s) => a + whole(s.interrupts, 0, INTERRUPT_MAX, 0), 0);
  return Math.round((n / list.length) * 10) / 10;
};
