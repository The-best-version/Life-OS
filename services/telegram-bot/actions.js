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
    next,
    before: { habits: state.habits, history: state.history },
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
