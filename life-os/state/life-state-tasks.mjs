/* --- tasks, the matrix and جهّز غدك -------------------------------------
 *  The Eisenhower matrix's own tasks, and the evening prep that picks
 *  tomorrow's three from them. Kept together because the prep is entirely
 *  about tasks — it stores no text and no time of its own, only a task id
 *  and, once one is set, the id of the calendar entry that owns its hour.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, dayKey, addDays, isKey } from "./life-state-util.mjs";

/* 80/20: three real tasks a day beat a list of twenty. Hard cap, on purpose. */
export const TOP_TASK_CAP = 3;

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
 * ---------------------------------------------------------------------- */
export const QUADRANT_IDS = new Set(["q1", "q2", "q3", "q4"]);
/* One line, not a paragraph — long enough to name an action and short
   enough that the row under a task stays a row. */
export const STEP_MAX = 90;
export const taskShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  text: typeof t.text === "string" ? t.text : "",
  /* An unknown quadrant lands in «مهم غير عاجل» rather than throwing: it is
     still his task and it still has to render somewhere, and q2 is the one
     square that asks for a decision instead of making one. */
  quadrant: QUADRANT_IDS.has(t.quadrant) ? t.quadrant : "q2",
  today: t.today === true,
  done: t.done === true,
  step: typeof t.step === "string" ? t.step.slice(0, STEP_MAX) : "",
});

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

/* --- جهّز غدك ----------------------------------------------------------- *
 *  The three tasks of a day get chosen the night before, or they get chosen
 *  at ten in the morning by whatever shouted loudest. So the evening window
 *  asks for them: up to `TOP_TASK_CAP` picks, each with the first step it
 *  starts with and, when it is owed an hour, that hour.
 *
 *  The prep stores no task text and no time of its own. A pick is a task id
 *  and — once a time has been set — the id of the calendar entry that time
 *  created. An hour belongs on the calendar; a copy of it here would be a
 *  second appointment quietly disagreeing with the first. Rename the task
 *  on the matrix and the prep follows it; move the entry on the calendar
 *  and the prep follows that.
 *
 *  `for` is the day it was prepared for, and it is the whole reason the prep
 *  is safe to carry: applied on the day it names, dropped on any other.
 *  Prep on Monday night, open on Thursday, and Monday's three are not
 *  promoted onto a day they were never chosen for.
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
    /* The cap is a property of the state and not of a button, so it is held
       where the shape is written too — no payload arrives with four. */
    if (picks.length >= TOP_TASK_CAP) break;
  }
  return { for: isKey(p.for) ? p.for : null, picks };
};

export const prepPicks = (p) => prepShape(p).picks;
export const prepFull = (p) => prepPicks(p).length >= TOP_TASK_CAP;
export const prepHas = (p, taskId) => prepPicks(p).some((x) => x.task === taskId);

/* Adding one. The fourth is refused here, not only on screen — the UI's job
   is to say why, and it cannot be the only thing standing between the rule
   and a fourth task. */
export function prepPickAdd(prep, taskId, day) {
  const p = prepShape(prep);
  const on = isKey(day) ? day : p.for;
  if (typeof taskId !== "string" || !taskId) return p;
  /* Picking for a different day than the one already in hand starts over
     rather than appending. A prep whose day has passed — a restored backup,
     a window left open through the rollover — holds three ids chosen for a
     morning that is gone, and carrying them into tomorrow's prep behind the
     user's back is the one thing a screen called «جهّز غدك» must not do. */
  const was = p.for === on ? p.picks : [];
  if (was.some((x) => x.task === taskId)) return { for: on, picks: was };
  if (was.length >= TOP_TASK_CAP) return { for: on, picks: was };
  return { for: on, picks: [...was, { task: taskId, event: null }] };
}

export function prepPickDrop(prep, taskId) {
  const p = prepShape(prep);
  return { ...p, picks: p.picks.filter((x) => x.task !== taskId) };
}

/* Which calendar entry carries a pick's hour — attached when a time is set,
   detached when it is cleared. */
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

/* The picks that still name a task the matrix actually holds, in his own
   order, and only on the day the prep was made for. A task deleted after
   being picked is simply not promoted: that is not an error and it is not
   worth a dialog at four in the morning. */
export function prepReady(prep, tasks, day) {
  const p = prepShape(prep);
  if (!isKey(day) || p.for !== day) return [];
  const have = new Set(rows(tasks).map((t) => t.id));
  return p.picks.filter((x) => have.has(x.task));
}

/* Tomorrow's three becoming today's. Nothing prepared — or a prep made for
   another day — leaves the flags exactly as they were, which is the
   behaviour this app had before the screen existed and the behaviour it has
   to keep for every day the screen is never opened. */
export function applyPrep(tasks, prep, day) {
  const ready = prepReady(prep, tasks, day);
  if (!ready.length) return capToday(tasks);
  const picked = new Set(ready.map((x) => x.task));
  return capToday(rows(tasks).map((t) => ({ ...t, today: picked.has(t.id) })));
}

/* What is left of a prep once the day it named has arrived: nothing. It was
   read by `applyPrep` on the way into this very state, and a prep left in
   place would promote its three again at every rollover after it. A prep for
   a day still ahead is kept untouched — that is the normal case, written
   last night and waiting. */
export function prepCarry(prep, day) {
  const p = prepShape(prep);
  if (!p.for || !isKey(day) || p.for <= day) return { for: null, picks: [] };
  return p;
}
