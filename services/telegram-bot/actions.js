/* --- what a message actually does to the day ---------------------------
 *  One function per thing the bot can change, and every one of them pure:
 *  `(state, args) → { next, before, … }` or `{ refused }`. Nothing here
 *  fetches, nothing here replies, nothing here imports grammY — which is
 *  what makes the whole file testable by `node --test tests/` with nothing
 *  installed.
 *
 *  Two rules every action keeps, both of them the app's own:
 *
 *  - **A row is written by its shape, never by hand.** `expenseShape`,
 *    `incomeShape` and `taskShape` are the one place each row's fields are
 *    decided. A second writer with its own idea of the fields is how `date`
 *    becomes a timestamp on one side and a day key on the other.
 *  - **`before` is the whole array, never the row.** An undo that puts one
 *    row back at the end of the list is an undo that moved it, which is its
 *    own small loss — the same reason `UndoBus` in the app arms with the
 *    whole array. It is spread over whatever the state is by then, so a
 *    change made in between is not undone with it.
 * --------------------------------------------------------------------- */
import {
  rows,
  uid,
  dayKey,
  expenseShape,
  incomeShape,
  MONEY_CAP,
  amountSum,
  netBalance,
  taskShape,
  capToday,
  clampGoal,
  stampToday,
  disciplineOf,
  scoredOf,
  bookForHabit,
  READ_GOAL_DEFAULT,
  sumPages,
  readStreak,
  focusShape,
  presetFor,
  armRun,
  startRun,
  pauseRun,
  runRunning,
  runLeft,
  settleRun,
  closePhase,
  spentMinutes,
  manualSession,
  addSession,
  isBreak,
  phaseOf,
  nextBreak,
  breakMinutes,
  urgeShape,
  stamp,
  cleanDays,
  prepShape,
  prepPickAdd,
  prepPicks,
  tomorrowKey,
  TOP_TASK_CAP,
} from "../../src/state/life-state.mjs";
import { fold } from "./parse.js";

/* --- the money -------------------------------------------------------- */

export function addExpense(state, { label, amount }) {
  const row = expenseShape({ label, amount });
  if (!row.amount) {
    return { refused: "ما فهمت المبلغ. مثال: «صرفت ٣٥ غداء»." };
  }
  return {
    kind: "expense",
    row,
    next: {
      ...state,
      expenses: [row, ...rows(state.expenses)].slice(0, MONEY_CAP),
    },
    before: { expenses: state.expenses },
    balance: netBalance(state.income, [row, ...rows(state.expenses)]),
  };
}

export function addIncome(state, { label, amount, hours }) {
  const row = incomeShape({ label, amount, hours });
  if (!row.amount) {
    return { refused: "ما فهمت المبلغ. مثال: «دخل ١٥٠٠ استشارة»." };
  }
  return {
    kind: "income",
    row,
    next: {
      ...state,
      income: [row, ...rows(state.income)].slice(0, MONEY_CAP),
    },
    before: { income: state.income },
    balance: netBalance([row, ...rows(state.income)], state.expenses),
  };
}

/* --- the tasks --------------------------------------------------------- *
 *  There is no separate inbox array and there must not be one: «مهم غير
 *  عاجل» is already the square of the matrix that asks for a decision
 *  instead of making one, which is what an inbox is. A second list would be
 *  a second place to triage from.
 * ---------------------------------------------------------------------- */
export function addTask(state, { label, today }) {
  const text = String(label ?? "").trim();
  if (!text) return { refused: "اكتب المهمة بعد الكلمة." };
  const row = taskShape({ text, today: !!today, quadrant: "q2" });
  const appended = [...rows(state.tasks), row];

  if (!today) {
    return {
      kind: "task",
      row,
      today: false,
      next: { ...state, tasks: appended },
      before: { tasks: state.tasks },
    };
  }

  /* The cap, read off the state layer rather than counted here. `capToday`
     keeps the first three in HIS order and takes the flag off the rest —
     appended last, this one is the one that loses, which is the correct
     answer and not an accident. */
  const capped = capToday(appended);
  const kept = capped.find((t) => t.id === row.id);
  if (!kept || !kept.today) {
    /* Refused as a *today* task and kept as a task: his words are never
       thrown away over a cap. The cap's job is to say no to a fourth
       priority, not to a fourth thought.
     *
     *  `capped` and not `appended` — the list that goes to disk is the one
     *  the cap has already been through, or the refusal would be a message
     *  saying no beside a fourth flagged task on the screen. */
    return {
      kind: "task",
      row: kept || { ...row, today: false },
      today: false,
      capped: true,
      next: { ...state, tasks: capped },
      before: { tasks: state.tasks },
    };
  }
  return {
    kind: "task",
    row,
    today: true,
    next: { ...state, tasks: capped },
    before: { tasks: state.tasks },
  };
}

/* Ticking one of today's three off. */
export function finishTask(state, id) {
  const list = rows(state.tasks);
  const t = list.find((x) => x.id === id);
  if (!t) return { refused: "هذه المهمة لم تعد موجودة." };
  if (t.done) return { refused: `«${t.text}» مُنجزة أصلاً ✅` };
  return {
    kind: "task-done",
    row: t,
    next: { ...state, tasks: list.map((x) => (x.id === id ? { ...x, done: true } : x)) },
    before: { tasks: state.tasks },
  };
}

/* --- the water -------------------------------------------------------- *
 *  `state.water` rides today's archive row like everything else written
 *  per-day, so the stamp is not optional: without it the calendar and the
 *  monthly tracker would read a day that never recorded its water.
 * ---------------------------------------------------------------------- */
export function drinkWater(state, count = 1) {
  const goal = clampGoal(state.waterGoal);
  const was = Math.max(0, Math.round(state.water || 0));
  const now = Math.min(goal, was + Math.max(1, Math.round(count)));
  if (now === was) {
    return { refused: `بلغت هدفك اليوم: ${goal} أكواب ✅` };
  }
  return {
    kind: "water",
    count: now,
    goal,
    next: stampToday({ ...state, water: now }),
    /* The archive row moves with it, so it has to come back with it. */
    before: { water: state.water, history: state.history },
  };
}

/* --- the habits ------------------------------------------------------- */

/* Which habits a few typed words could mean. Folded on both sides, so
   «صلاة العصر» finds «صلاة العصر وأذكار» and «صلاه العصر» finds it too. The
   ones still open come first: a tick is almost always meant for one of
   those, and the ones already done are only here so the bot can say «مسجّلة
   أصلاً» instead of «ما لقيتها». */
export function findHabits(habits, query) {
  const q = fold(query);
  if (!q) return [];
  const list = rows(habits);
  const hit = (h) => {
    const label = fold(h.label);
    return label === q || label.includes(q) || q.includes(label);
  };
  const found = list.filter(hit);
  return [...found.filter((h) => !h.done), ...found.filter((h) => h.done)];
}

/* A tick, and the same tick a tiny one. `tiny` is a second argument and
   never a second function, exactly as `useHabitTick` takes it in the app:
   a floor taken on a hard day counts for the score, the streak and the
   archive, and is only *marked* differently. */
export function tickHabit(state, id, tiny = false) {
  const list = rows(state.habits);
  const h = list.find((x) => x.id === id);
  if (!h) return { refused: "هذه العادة لم تعد في روتينك." };
  if (h.done) return { refused: `«${h.label}» مسجّلة أصلاً اليوم ✅` };
  const next = stampToday({
    ...state,
    habits: list.map((x) => (x.id === id ? { ...x, done: true, tiny: !!tiny } : x)),
  });
  return {
    kind: "habit",
    habit: h,
    tiny: !!tiny,
    pct: disciplineOf(next.habits),
    /* A habit can feed the library, and the tick is what opens the question.
       Handed back rather than acted on: the reply must land and the reward
       must be paid whether or not pages are then logged, exactly as the
       app's modal is skippable. */
    book: bookForHabit(h, rows(state.books)),
    next,
    before: { habits: state.habits, history: state.history },
  };
}

/* --- the library ------------------------------------------------------- *
 *  The app logs pages from a modal that opens the instant a reading habit is
 *  ticked. The same thing from a phone is one sentence — «قرأت ٢٠ صفحة» — and
 *  it writes exactly what the modal writes: a row on `state.reading` and the
 *  book's page counter moved forward, bounded by the book's own total.
 *
 *  Which book is not a question the bot asks. A reading habit ticked a
 *  moment ago names one; otherwise it is whichever book is marked «أقرأه
 *  الآن», which is the same answer `READ_ACTIVE` gives the app.
 * ---------------------------------------------------------------------- */
export function logReading(state, { pages, habitId = null } = {}) {
  const n = Math.round(Number(pages) || 0);
  if (n < 1) return { refused: "كم صفحة؟ مثال: «قرأت ٢٠ صفحة»." };
  const books = rows(state.books);
  const habit = habitId ? rows(state.habits).find((h) => h.id === habitId) : null;
  const book =
    (habit && bookForHabit(habit, books)) ||
    books.find((b) => b.status === "reading") ||
    null;
  if (!book) {
    return {
      refused: "ما فيه كتاب معلّم «أقرأه الآن» على الرف — علّم واحدًا من المكتبة أولًا.",
    };
  }
  const total = parseInt(book.pages, 10);
  const at = parseInt(book.page, 10);
  const base = Number.isFinite(at) ? at : 0;
  /* Bounded by the book's own total when it has one, exactly as the modal
     bounds it: a counter past the last page is a book that reads as
     finished and is not. */
  const next =
    Number.isFinite(total) && total > 0 ? Math.min(total, base + n) : base + n;
  const row = { id: uid(), date: dayKey(), bookId: book.id, habitId: habit?.id || null, pages: n };
  const goal = Number.isFinite(+state.readGoal) ? +state.readGoal : READ_GOAL_DEFAULT;
  const reading = [...rows(state.reading), row];
  return {
    kind: "reading",
    row,
    book: { ...book, page: String(next) },
    pages: n,
    at: next,
    total: Number.isFinite(total) && total > 0 ? total : null,
    goal,
    today: sumPages(reading.filter((r) => r.date === dayKey())),
    streak: readStreak(reading, goal),
    next: {
      ...state,
      reading,
      books: books.map((b) => (b.id === book.id ? { ...b, page: String(next) } : b)),
    },
    before: { reading: state.reading, books: state.books },
  };
}

/* --- the focus desk, from a phone -------------------------------------- *
 *  The run is state and is counted off an absolute `endAt`, which is the
 *  whole reason this is possible at all: a round started from a message and
 *  a round started from the screen are the same row, and either side can end
 *  it. Nothing here re-decides the rhythm — `closePhase` in the state layer
 *  owns the cycle counter, the row and the next phase, and both writers call
 *  it.
 * ---------------------------------------------------------------------- */

/* A run found already over is settled before anything else is decided.
   Otherwise a round that finished three hours ago would still be «counting»
   when the next message arrives, and the minutes it earned would be lost
   the moment it was replaced. */
const settled = (state, now) => {
  const focus = focusShape(state.focus);
  const out = settleRun(focus.run, now);
  if (out.run === focus.run) return { focus, state, closed: null };
  /* A finished round goes through `closePhase` so the counter advances and
     the break is armed exactly as it would have been on screen. */
  if (out.rang && focus.run) {
    const next = closePhase(state, focus.run, { minutes: focus.run.planned, full: true, at: now });
    return {
      focus: next.focus,
      state: { ...state, sessions: next.sessions, focus: next.focus, tasks: next.tasks },
      closed: { phase: focus.run.phase, row: next.row },
    };
  }
  /* Stale: the minutes of a paused round are kept, a round still counting
     when it went stale writes nothing. `settleRun` already drew that line. */
  const sessions = out.log ? addSession(state.sessions, out.log) : state.sessions;
  const focusNext = { ...focus, run: null };
  return {
    focus: focusNext,
    state: { ...state, sessions, focus: focusNext },
    closed: { phase: focus.run?.phase, row: out.log, dropped: true },
  };
};

export function startFocus(state, { minutes = 0, label = "", taskId = null } = {}, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (runRunning(focus.run)) {
    return {
      refused: `${phaseOf(focus.run.phase).label} تعدّ الآن — باقي ${Math.ceil(
        runLeft(focus.run, now) / 60,
      )} دقيقة. أرسل «أوقف» أولًا.`,
    };
  }
  const preset = presetFor(focus, focus.pick);
  const planned = minutes >= 1 ? minutes : preset.min;
  const run = startRun(
    armRun({
      phase: "focus",
      planned,
      presetId: preset.id,
      taskId,
      label,
      round: focus.round,
      now,
    }),
    now,
  );
  return {
    kind: "focus-start",
    run,
    preset,
    next: { ...base.state, focus: { ...focus, run } },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

/* The break, armed and started on purpose. A break that has to be asked for
   is still better than one that never comes, which is what a timer with no
   break at all guarantees. */
export function breakFocus(state, { minutes = 0 } = {}, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (runRunning(focus.run) && !isBreak(focus.run.phase)) {
    return { refused: "جولة تركيز تعدّ الآن. أرسل «أوقف» ثم «استراحة»." };
  }
  const preset = presetFor(focus, focus.pick);
  const phase = nextBreak(preset, focus.round);
  const planned = minutes >= 1 ? minutes : breakMinutes(preset, phase);
  const run = startRun(
    armRun({ phase, planned, presetId: preset.id, round: focus.round, now }),
    now,
  );
  return {
    kind: "focus-break",
    run,
    next: { ...base.state, focus: { ...focus, run } },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

export function pauseFocus(state, now = Date.now()) {
  const focus = focusShape(state.focus);
  if (!runRunning(focus.run)) return { refused: "ما فيه شي يعدّ الآن." };
  const run = pauseRun(focus.run, now);
  return {
    kind: "focus-pause",
    run,
    spent: spentMinutes(run, now),
    next: { ...state, focus: { ...focus, run } },
    before: { focus: state.focus },
  };
}

export function resumeFocus(state, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (!focus.run) return { refused: "ما فيه جولة موقوفة. أرسل «ابدأ تركيز»." };
  if (runRunning(focus.run)) return { refused: "هي تعدّ أصلاً." };
  const run = startRun(focus.run, now);
  return {
    kind: "focus-resume",
    run,
    next: { ...base.state, focus: { ...focus, run } },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

/* Stopped, and logged as the minutes it actually was. The old timer wrote
   nothing unless the round finished, so eighty minutes of a ninety-minute
   round simply never existed — `full: false` is what makes the row honest
   instead of absent. A round cut short does not advance the cycle counter:
   the long break is earned by rounds that were sat through. */
export function stopFocus(state, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (!focus.run) return { refused: "ما فيه جولة قائمة." };
  const run = focus.run;
  const mins = spentMinutes(run, now);
  const out = closePhase(base.state, run, {
    minutes: mins,
    full: false,
    advance: false,
    nextRun: null,
    at: now,
  });
  return {
    kind: "focus-stop",
    run,
    minutes: mins,
    logged: !!out.row,
    next: { ...base.state, sessions: out.sessions, focus: { ...out.focus, run: null }, tasks: out.tasks },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

/* A stale run, accepted or thrown away by hand — the two buttons the coach
   offers when it finds one. Accepting is what `settleRun` would have done
   on its own; dropping is the one case the user overrules it. */
export function settleFocus(state, now = Date.now()) {
  const focus = focusShape(state.focus);
  if (!focus.run) return { refused: "ما فيه جولة معلّقة." };
  const base = settled(state, now);
  if (!base.closed) return { refused: "الجولة ما زالت قائمة — ما فيه شي يُعتمد." };
  return {
    kind: "focus-settle",
    minutes: base.closed.row ? base.closed.row.minutes : 0,
    next: base.state,
    before: { focus: state.focus, sessions: state.sessions },
  };
}

export function dropFocus(state) {
  const focus = focusShape(state.focus);
  if (!focus.run) return { refused: "ما فيه جولة معلّقة." };
  return {
    kind: "focus-drop",
    next: { ...state, focus: { ...focus, run: null } },
    before: { focus: state.focus },
  };
}

/* Work that happened away from any timer. Marked `full` because there was no
   plan to have fallen short of. */
export function logFocus(state, { minutes, label = "", taskId = null } = {}, now = Date.now()) {
  const row = manualSession({ minutes, label, taskId, at: now });
  if (!row) return { refused: "كم دقيقة؟ مثال: «ركزت ٤٥ دقيقة على المحاسبة»." };
  return {
    kind: "focus-log",
    row,
    next: { ...state, sessions: addSession(state.sessions, row) },
    before: { sessions: state.sessions },
  };
}

/* --- the breaker ------------------------------------------------------- *
 *  A hold never touches `startDate`: surviving the urge is the run
 *  continuing, not an event in it. A fall stamps the run that just ended
 *  onto the log, so the record outlives the counter it cost.
 * ---------------------------------------------------------------------- */
function oneBad(state, query) {
  const list = rows(state.badHabits);
  if (!list.length) return { refused: "ما فيه عادة مسجّلة في كاسر العادات." };
  if (!query) return list.length === 1 ? { bad: list[0] } : { many: list };
  const q = fold(query);
  const hit = list.filter((b) => {
    const t = fold(b.title);
    return t === q || t.includes(q) || q.includes(t);
  });
  if (!hit.length) return list.length === 1 ? { bad: list[0] } : { many: list };
  return hit.length === 1 ? { bad: hit[0] } : { many: hit };
}

export function holdUrge(state, id, { tag = "", mood = "", trigger = "" } = {}) {
  const list = rows(state.badHabits);
  const bad = list.find((b) => b.id === id);
  if (!bad) return { refused: "هذي العادة لم تعد موجودة." };
  const row = urgeShape({ ...stamp(), tag, mood, trigger }, "hold");
  return {
    kind: "hold",
    bad,
    row,
    days: cleanDays(bad),
    next: stampToday({
      ...state,
      badHabits: list.map((b) =>
        b.id === id ? { ...b, urges: [...rows(b.urges), row] } : b,
      ),
    }),
    before: { badHabits: state.badHabits, history: state.history },
  };
}

export function fallUrge(state, id, { tag = "", mood = "", trigger = "" } = {}) {
  const list = rows(state.badHabits);
  const bad = list.find((b) => b.id === id);
  if (!bad) return { refused: "هذي العادة لم تعد موجودة." };
  const was = cleanDays(bad);
  const row = urgeShape(
    { ...stamp(), days: was, tag, mood, trigger },
    "fall",
  );
  return {
    kind: "fall",
    bad,
    row,
    was,
    next: stampToday({
      ...state,
      badHabits: list.map((b) =>
        b.id === id
          ? { ...b, logs: [...rows(b.logs), row], startDate: dayKey() }
          : b,
      ),
    }),
    before: { badHabits: state.badHabits, history: state.history },
  };
}

export { oneBad };

/* --- tomorrow's three, tonight ----------------------------------------- *
 *  `prepPickAdd` holds the cap and refuses the fourth outright, which is one
 *  of its four doors. Nothing here counts picks itself.
 * ---------------------------------------------------------------------- */
export function pickTomorrow(state, taskId) {
  const task = rows(state.tasks).find((t) => t.id === taskId);
  if (!task) return { refused: "هذي المهمة لم تعد موجودة." };
  const day = tomorrowKey();
  /* `prepPickAdd` refuses by handing the prep back unchanged rather than by
     returning nothing — it is written for a screen, where a no-op button is
     the whole of a refusal. In a chat a silent no-op is indistinguishable
     from a write that failed, so the two cases it refuses for are read here
     and each one is said out loud. The cap itself is still the state
     layer's: nothing below counts picks to decide whether to allow one. */
  const was = prepShape(state.prep);
  const already = was.for === day ? was.picks : [];
  if (already.some((x) => x.task === taskId)) {
    return { refused: `«${task.text}» مختارة لغد أصلاً.` };
  }
  if (already.length >= TOP_TASK_CAP) {
    return {
      refused: `مهام الغد مكتملة بـ${TOP_TASK_CAP} — والحد مقصود. اشطب واحدة من «جهّز غدك».`,
    };
  }
  const prep = prepPickAdd(state.prep, taskId, day);
  return {
    kind: "prep",
    task,
    picks: prepPicks(prep).length,
    next: { ...state, prep },
    before: { prep: state.prep },
  };
}

/* --- one of today's three, chosen from the matrix ---------------------- *
 *  The flag, not a new task: the coach offers what is already in the
 *  quadrants rather than asking him to type it twice. `capToday` is the
 *  gate, as it is for every other door.
 * ---------------------------------------------------------------------- */
export function flagToday(state, taskId) {
  const list = rows(state.tasks);
  const task = list.find((t) => t.id === taskId);
  if (!task) return { refused: "هذي المهمة لم تعد موجودة." };
  if (task.done) return { refused: `«${task.text}» مُنجزة أصلاً ✅` };
  if (task.today) return { refused: `«${task.text}» من مهام اليوم أصلاً.` };
  const capped = capToday(list.map((t) => (t.id === taskId ? { ...t, today: true } : t)));
  const kept = capped.find((t) => t.id === taskId);
  if (!kept || !kept.today) {
    return {
      refused: `مهام اليوم مكتملة بـ${TOP_TASK_CAP} — والحد مقصود. أنجِز واحدة أولًا.`,
    };
  }
  return {
    kind: "top",
    row: kept,
    next: { ...state, tasks: capped },
    before: { tasks: state.tasks },
  };
}

/* --- the evening reflection -------------------------------------------- *
 *  Written onto today's archive row, which is where the app writes it. The
 *  row is stamped first so it exists and is current, then the field is
 *  merged — `stampToday` spreads the previous entry precisely so anything
 *  written per-day survives a habit toggle, and this is one of those things.
 * ---------------------------------------------------------------------- */
export function reflect(state, { field, note }) {
  const text = String(note ?? "").trim();
  if (!text) return { refused: "اكتب الجواب بعد الكلمة." };
  if (field !== "distraction" && field !== "fix") {
    return { refused: "ما فهمت أي جزء من التقييم." };
  }
  const today = dayKey();
  const stamped = stampToday(state);
  return {
    kind: "reflect",
    field,
    note: text.slice(0, 300),
    next: {
      ...stamped,
      history: rows(stamped.history).map((h) =>
        h.date === today ? { ...h, [field]: text.slice(0, 300) } : h,
      ),
    },
    before: { history: state.history },
  };
}

/* --- putting one back ------------------------------------------------- *
 *  Spread over whatever the state is by then rather than over the state the
 *  change was made on: an unrelated row added in the meantime is not undone
 *  along with this one.
 * ---------------------------------------------------------------------- */
export function undo(state, before) {
  if (!before || typeof before !== "object") {
    return { refused: "ما فيه شي أرجّعه." };
  }
  return { kind: "undo", next: { ...state, ...before } };
}

/* --- what the day looks like ------------------------------------------ *
 *  Read-only, and every figure derived. Used by the two briefs and by
 *  «/يومي», so there is one reading of the day and not three.
 * ---------------------------------------------------------------------- */
export function dayAt(state) {
  const habits = rows(state.habits);
  const scored = scoredOf(habits);
  const tasks = rows(state.tasks).filter((t) => t.today);
  return {
    date: state.date,
    pct: disciplineOf(habits),
    scored,
    openScored: scored.filter((h) => !h.done),
    habitsDone: habits.filter((h) => h.done).length,
    habitsAll: habits.length,
    tasks,
    tasksOpen: tasks.filter((t) => !t.done),
    water: Math.max(0, Math.round(state.water || 0)),
    waterGoal: clampGoal(state.waterGoal),
    spentWeek: amountSum(rows(state.expenses).filter((e) => e.date >= weekAgo(state.date))),
    earnedWeek: amountSum(rows(state.income).filter((e) => e.date >= weekAgo(state.date))),
    balance: netBalance(state.income, state.expenses),
  };
}

/* Six days back from the day in hand, as a key. String comparison on day
   keys is what every window in the state layer uses — an ISO key sorts
   lexicographically, and parsing it into a Date only invites a timezone to
   move it. */
function weekAgo(date) {
  const [y, m, d] = String(date || "").split("-").map(Number);
  if (!y) return "0000-00-00";
  const x = new Date(y, m - 1, d - 6);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
