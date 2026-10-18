/* --- tasks, the matrix and جهّز غدك -------------------------------------
 *  The Eisenhower matrix's own tasks, and the evening prep that picks
 *  tomorrow's three from them. Kept together because the prep is entirely
 *  about tasks — it stores no text and no time of its own, only a task id
 *  and, once one is set, the id of the calendar entry that owns its hour.
 *
 *  Phase 1 additions: a task now carries its own weight — a due date, an
 *  estimate, an order inside its quadrant, and the day it was created.
 *
 *  Today-list additions: a task can be *scheduled* for today (the extra
 *  list, unlimited) or *today* (one of the three sacred ones, capped at
 *  three). The two flags are mutually exclusive — the row is in one list
 *  or the other, never both — and the toggle helpers below enforce that
 *  wherever they are called.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  dayKey,
  addDays,
  isKey,
  daysBetween,
  daysUntil,
} from "./life-state-util.mjs";

/* 80/20: three real tasks a day beat a list of twenty. Hard cap, on purpose. */
export const TOP_TASK_CAP = 3;

/* How long a task may be estimated to take, in minutes. Eight hours is the
   bound: a single "task" that claims more than a working day is not one
   task, it is a project, and one that should be broken down. */
export const ESTIMATE_MAX = 480;

/* When a task is old enough to be flagged. Two weeks is the point past
   which "I'll get to it" has quietly become "I'm not going to do this" —
   the task recedes visually rather than shouting, because the honest
   answer is usually to re-classify or delete it. */
export const AGED_DAYS = 14;

/* When a due date starts being shown prominently. Three days is a working
   week's notice — less and every task looks urgent, more and the colour
   stops meaning anything. */
export const DUE_SOON_DAYS = 3;

/* How many open tasks a quadrant may hold before the screen says so.
   `TOP_TASK_CAP` is the day's own cap and separate: this is the ceiling
   for the parking lot, not for today. The Eisenhower reading is the whole
   reason these differ — q1 is firefighting and should be tiny, q2 is where
   the growth is done and can hold more, q4 should be empty. */
export const QUADRANT_WIP = {
  q1: 5,
  q2: 12,
  q3: 7,
  q4: 3,
};

export const ADDED_TASKS = [
  { text: "جلسة مذاكرة PMP — ٩٠ دقيقة", quadrant: "q2" },
  { text: "تحديث LinkedIn: إبراز إدارة المرافق والتدريب التعاوني", quadrant: "q2" },
  { text: "ساعتان عمل توصيل مرن", quadrant: "q3" },
];

export const SEED_TASKS = [
  { id: uid(), text: "تسليم تقرير الجامعة", quadrant: "q1", today: true, done: false },
  { id: uid(), text: "مراجعة مكثفة لاختبار STEP", quadrant: "q2", today: true, done: false },
  ...ADDED_TASKS.map((t) => ({ id: uid(), today: false, done: false, ...t })),
  { id: uid(), text: "بناء صندوق الطوارئ", quadrant: "q2", today: false, done: false },
  { id: uid(), text: "الرد على الرسائل المتراكمة", quadrant: "q3", today: false, done: false },
  { id: uid(), text: "تصفّح مواقع التواصل بلا هدف", quadrant: "q4", today: false, done: false },
];

/* --- a task, and the first step of it --------------------------------- *
 *  A task is a sentence. The first step is the thing a body can start in
 *  the next ten minutes, and they are two different fields on purpose:
 *  «راجع للاختبار» and «افتح الملزمة على الفصل الثالث» are two different
 *  thoughts, and only the second one ever starts.
 *
 *  `taskShape` is the one place a task's fields are written, for the same
 *  reason `bookShape` is: the seed, the matrix's add form, the evening prep
 *  and the migration all go through it, so they cannot drift apart.
 *
 *  The four phase-1 fields default to nothing rather than to a guessed
 *  value: a task with no due date is not due today, and one with no
 *  estimate is not a guess at ninety minutes. `createdAt` in particular
 *  is left empty for an old task, because the day a task from before this
 *  field existed was written is not recoverable — and a date invented here
 *  would then be shown as fact by the aging rule below.
 * ---------------------------------------------------------------------- */
export const QUADRANT_IDS = new Set(["q1", "q2", "q3", "q4"]);
/* One line, not a paragraph — long enough to name an action and short
   enough that the row under a task stays a row. */
export const STEP_MAX = 90;
export const taskShape = (t) => {
  t = obj(t);
  const estimate = Number.isFinite(+t.estimate)
    ? Math.max(0, Math.min(ESTIMATE_MAX, Math.round(+t.estimate)))
    : 0;
  /* The two "today" flags are mutually exclusive. `today` wins if both are
     set on the same row — it is the stronger claim, and the alternative
     (silently dropping the sacred flag) is how a task the user thinks is
     one of his three disappears from the card. */
  const today = t.today === true;
  return {
    id: t.id || uid(),
    text: typeof t.text === "string" ? t.text : "",
    /* An unknown quadrant lands in «مهم غير عاجل» rather than throwing: it is
       still his task and it still has to render somewhere, and q2 is the one
       square that asks for a decision instead of making one. */
    quadrant: QUADRANT_IDS.has(t.quadrant) ? t.quadrant : "q2",
    today,
    scheduled: !today && t.scheduled === true,
    done: t.done === true,
    step: typeof t.step === "string" ? t.step.slice(0, STEP_MAX) : "",
    /* "" is "no due date", never today — a task with no date is one he has
       not decided about, and rolling it into today would make every task
       overdue by tomorrow morning. */
    due: isKey(t.due) ? t.due : "",
    estimate,
    /* Position inside its own quadrant, ascending. Ten apart so an insert
       between two neighbours does not have to renumber the whole list. */
    order: Number.isFinite(+t.order) ? Math.max(0, Math.round(+t.order)) : 0,
    /* Empty means "we do not know when this was written", which is the
       honest reading of a task from before this field existed. */
    createdAt: isKey(t.createdAt) ? t.createdAt : "",
    
    // 👇 التعديل الجديد تم إضافته هنا 👇
    linkedGoalId: typeof t.linkedGoalId === "string" ? t.linkedGoalId : null,
  };
};

/* The cap, applied to a list rather than to a click.
 *
 *  `TOP_TASK_CAP` has been refused-with-a-reason on the matrix's promote
 *  button since the rule existed, but that is one door. A hand-edited
 *  backup is a second, a restored snapshot a third, and the evening prep is
 *  a fourth. So the arithmetic lives here and every door calls it.
 *
 *  It keeps the first three in HIS order and takes the flag off the rest —
 *  the flag, never the task. A task demoted out of today is still a task.
 */
export function capToday(tasks) {
  let n = 0;
  return rows(tasks).map((t) => {
    if (!t.today) return t;
    n += 1;
    return n <= TOP_TASK_CAP ? t : { ...t, today: false };
  });
}

/* --- order and the quadrant view -------------------------------------- *
 *  The order helpers are pure and separate from the UI on purpose: the
 *  matrix sorts by them, the prep reads them, and a second sort written
 *  inside a component is a second answer to "which task is first".
 * ---------------------------------------------------------------------- */

/* The highest order in a quadrant, plus ten. New tasks append at the end. */
export const nextOrder = (tasks, quadrant) => {
  const list = rows(tasks).filter((t) => t.quadrant === quadrant);
  if (!list.length) return 10;
  const max = Math.max(...list.map((t) => Number(t.order) || 0));
  return max + 10;
};

/* Open tasks in a quadrant, sorted: his order first, then the earlier due
   date, then the older creation. Sorting by due as a tiebreaker means a
   task with a date rises above one without — which is the whole point of
   setting a date, and it happens without him dragging anything. */
export const orderedOpen = (tasks, quadrant) =>
  rows(tasks)
    .filter((t) => t.quadrant === quadrant && !t.done)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      const ad = a.due || "9999-12-31";
      const bd = b.due || "9999-12-31";
      if (ad !== bd) return ad < bd ? -1 : 1;
      const ac = a.createdAt || "9999-12-31";
      const bc = b.createdAt || "9999-12-31";
      return ac < bc ? -1 : ac > bc ? 1 : 0;
    });

/* Done tasks in a quadrant, newest first — the row he just finished is at
   the top of the collapsed section, which is where he expects to find it. */
export const orderedDone = (tasks, quadrant) =>
  rows(tasks)
    .filter((t) => t.quadrant === quadrant && t.done)
    .slice()
    .reverse();

/* What the quadrant is about to cost, in minutes. Excludes done tasks —
   the number is a warning about what is coming, not a ledger. */
export const estimateTotal = (tasks, quadrant = null) => {
  let list = rows(tasks).filter((t) => !t.done);
  if (quadrant) list = list.filter((t) => t.quadrant === quadrant);
  return list.reduce((n, t) => n + (Number.isFinite(t.estimate) ? t.estimate : 0), 0);
};

/* --- readings of a single task ---------------------------------------- *
 *  All four take a `today` so they are testable without a fake clock, and
 *  all four return the falsy answer for a task that has nothing to say —
 *  an empty due date is never "overdue", and a task with no `createdAt`
 *  is never "aged".
 * ---------------------------------------------------------------------- */

export const taskAge = (task, today = dayKey()) => {
  if (!task || !task.createdAt) return 0;
  return daysBetween(task.createdAt, today);
};

export const taskOverdue = (task, today = dayKey()) =>
  !!task && !task.done && !!task.due && task.due < today;

export const taskDueToday = (task, today = dayKey()) =>
  !!task && !task.done && !!task.due && task.due === today;

export const taskDueSoon = (task, today = dayKey()) => {
  if (!task || task.done || !task.due) return false;
  const left = daysUntil(task.due, today);
  return left !== null && left >= 0 && left <= DUE_SOON_DAYS;
};

/* The level the quadrant header reads to decide whether to show the bar,
   and the bar's colour. Deliberately coarse: `calm` and `full` are both
   fine, and the difference between "getting busy" and "past the limit" is
   the one worth saying out loud. */
export const wipOf = (tasks, quadrant) => {
  const n = rows(tasks).filter((t) => t.quadrant === quadrant && !t.done).length;
  const cap = QUADRANT_WIP[quadrant] || 8;
  if (n > cap * 1.5) return "chaos";
  if (n > cap) return "crowded";
  return "calm";
};

/* --- what is on today's additional list ------------------------------- *
 *  The tasks that are on the day but not among the three sacred ones. This
 *  is the list `TodayExtras` renders, and the list the ☀️ button on a
 *  `TaskChip` toggles. It is deliberately separate from `today` — that is
 *  capped at three, this has no ceiling, and the whole reason the day holds
 *  more than three things is that the three are a *minimum*, not a quota.
 *
 *  Ordered by array position, oldest first: this is a queue of "today",
 *  and the thing he put in first is the thing he most likely meant to do
 *  first.
 * ---------------------------------------------------------------------- */
export const scheduledTasks = (tasks) =>
  rows(tasks).filter((t) => t.scheduled && !t.today);

/* --- reordering within a quadrant ------------------------------------- *
 *  Drag A onto B and A sits where B was; everything between shifts by one.
 *  The whole quadrant is renumbered in tens after the move, which is what
 *  keeps `order` a small integer instead of a growing fraction, and what
 *  makes the sort above a plain numeric comparison with no tie-breaker.
 *
 *  Cross-quadrant drops are the caller's problem — this only ever fires
 *  when the two tasks already share a quadrant, and it does nothing at all
 *  when they do not, rather than half-move something.
 * ---------------------------------------------------------------------- */
export function reorderWithin(tasks, dragId, targetId) {
  if (!dragId || !targetId || dragId === targetId) return tasks;
  const drag = rows(tasks).find((t) => t.id === dragId);
  const target = rows(tasks).find((t) => t.id === targetId);
  if (!drag || !target) return tasks;
  if (drag.quadrant !== target.quadrant) return tasks;
  /* A done task is not a drop target: it is behind him, and slipping a
     live task into the archive by accident is a task that disappears. */
  if (target.done) return tasks;

  const q = drag.quadrant;
  const list = orderedOpen(tasks, q);
  const di = list.findIndex((t) => t.id === dragId);
  if (di < 0) return tasks;

  const [moved] = list.splice(di, 1);
  const newTi = list.findIndex((t) => t.id === targetId);
  if (newTi < 0) return tasks;
  list.splice(newTi, 0, moved);

  const orderMap = new Map(list.map((t, i) => [t.id, (i + 1) * 10]));
  return rows(tasks).map((t) =>
    orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t,
  );
}

/* --- جهّز غدك ----------------------------------------------------------- *
 *  The three tasks of a day get chosen the night before, or they get chosen
 *  at ten in the morning by whatever shouted loudest. So the evening window
 *  asks for them: up to `TOP_TASK_CAP` picks, each with the first step it
 *  starts with and, when it is owed an hour, that hour.
 *
 *  The prep stores no task text and no time of its own. A pick is a task id
 *  and — once a time has been set — the id of the calendar entry that time
 *  created. An hour belongs on the calendar; a copy of it here would be a
 *  second appointment quietly disagreeing with the first.
 *
 *  `for` is the day it was prepared for, and it is the whole reason the prep
 *  is safe to carry: applied on the day it names, dropped on any other.
 * ---------------------------------------------------------------------- */
export const tomorrowKey = () => addDays(dayKey(), 1);

export const prepShape = (p) => {
  p = obj(p);
  const seen = new Set();
  const picks = [];
  for (const row of rows(p.picks)) {
    const task = typeof row.task === "string" ? row.task : "";
    if (!task || seen.has(task)) continue;
    seen.add(task);
    picks.push({
      task,
      event: typeof row.event === "string" && row.event ? row.event : null,
    });
    if (picks.length >= TOP_TASK_CAP) break;
  }
  return { for: isKey(p.for) ? p.for : null, picks };
};

export const prepPicks = (p) => prepShape(p).picks;
export const prepFull = (p) => prepPicks(p).length >= TOP_TASK_CAP;
export const prepHas = (p, taskId) => prepPicks(p).some((x) => x.task === taskId);

export function prepPickAdd(prep, taskId, day) {
  const p = prepShape(prep);
  const on = isKey(day) ? day : p.for;
  if (typeof taskId !== "string" || !taskId) return p;
  const was = p.for === on ? p.picks : [];
  if (was.some((x) => x.task === taskId)) return { for: on, picks: was };
  if (was.length >= TOP_TASK_CAP) return { for: on, picks: was };
  return { for: on, picks: [...was, { task: taskId, event: null }] };
}

export function prepPickDrop(prep, taskId) {
  const p = prepShape(prep);
  return { ...p, picks: p.picks.filter((x) => x.task !== taskId) };
}

export function prepPickEvent(prep, taskId, eventId) {
  const p = prepShape(prep);
  return {
    ...p,
    picks: p.picks.map((x) =>
      x.task === taskId
        ? { ...x, event: typeof eventId === "string" && eventId ? eventId : null }
        : x,
    ),
  };
}

export function prepReady(prep, tasks, day) {
  const p = prepShape(prep);
  if (!isKey(day) || p.for !== day) return [];
  const have = new Set(rows(tasks).map((t) => t.id));
  return p.picks.filter((x) => have.has(x.task));
}

export function applyPrep(tasks, prep, day) {
  const ready = prepReady(prep, tasks, day);
  if (!ready.length) return capToday(tasks);
  const picked = new Set(ready.map((x) => x.task));
  return capToday(
    rows(tasks).map((t) => ({
      ...t,
      today: picked.has(t.id),
      /* A task promoted from last night's prep is one of the three sacred
         ones, not on today's extras. The flag is cleared here as well as
         everywhere else the two lists touch, because "the row is in one
         list or the other, never both" has to hold on the way in from the
         disk as well as on the way in from a click. */
      scheduled: picked.has(t.id) ? false : t.scheduled,
    })),
  );
}

export function prepCarry(prep, day) {
  const p = prepShape(prep);
  if (!p.for || !isKey(day) || p.for <= day) return { for: null, picks: [] };
  return p;
}