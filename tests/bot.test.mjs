/* --- the Telegram bot's two pure halves --------------------------------
 *  `parse.js` reads a message and `actions.js` turns the reading into a new
 *  state. Neither imports grammY, fetches anything or touches the disk —
 *  which is the whole reason they are two files and not one with the bot in
 *  it: this suite runs with nothing installed, under the same
 *  `node --test tests/` the build already gates on.
 *
 *  What is NOT tested here is the seam to the server, because testing it
 *  without a server would mean testing a mock of one. `tests/server.test.mjs`
 *  holds the revision guard from the other side.
 * --------------------------------------------------------------------- */
import test from "node:test";
import assert from "node:assert/strict";

import { parse, fold, asciiDigits } from "../services/telegram-bot/parse.js";
import {
  addExpense,
  addIncome,
  addTask,
  finishTask,
  drinkWater,
  findHabits,
  tickHabit,
  undo,
  dayAt,
} from "../services/telegram-bot/actions.js";
import { quoteFor, planToday, textFor, Scheduler } from "../services/telegram-bot/reminders.js";
import {
  freshState,
  dayKey,
  TOP_TASK_CAP,
  WATER_GOAL_DEFAULT,
  disciplineOf,
  isGap,
  botShape,
} from "../src/state/life-state.mjs";

/* --- the reading ------------------------------------------------------- */

test("an expense is read out of an ordinary sentence", () => {
  const out = parse("صرفت ٣٥ غداء");
  assert.equal(out.kind, "expense");
  assert.equal(out.amount, 35);
  assert.equal(out.label, "غداء");
});

test("Arabic-Indic digits are not NaN", () => {
  assert.equal(asciiDigits("١٢٣"), "123");
  /* The Arabic decimal separator, which is not a full stop. */
  assert.equal(parse("صرفت ١٢٫٥ قهوة").amount, 12.5);
});

test("the currency word never ends up in the label", () => {
  /* `\b` is ASCII-only in JavaScript, so a currency pattern fenced with it
     silently matched nothing and «ريال» was stored as part of the label. */
  assert.equal(parse("صرفت 20 ريال قهوة").label, "قهوة");
  assert.equal(parse("دخل 90 ر.س توصيل").label, "توصيل");
});

test("income carries its hours when they were said", () => {
  const out = parse("دخل ٣٠٠ توصيل ٤ ساعات");
  assert.equal(out.kind, "income");
  assert.equal(out.amount, 300);
  assert.equal(out.hours, 4);
  assert.equal(out.label, "توصيل");
  /* «ساعتين» carries its count inside the word. */
  assert.equal(parse("دخل 250 توصيل ساعتين").hours, 2);
});

test("a thousands comma is one number, not two", () => {
  assert.equal(parse("دخل 1,500 استشارة").amount, 1500);
});

test("a trigger only counts at the start of the message", () => {
  /* The keyword hunted for anywhere is what turns a note to self into an
     expense of nothing. */
  assert.equal(parse("لازم أراجع كم صرفت").kind, "task");
  assert.equal(parse("تمتع بالحياة").kind, "task");
});

test("a money word with no number is a thought, not a transaction", () => {
  const out = parse("اشتريت هدية لأمي");
  assert.equal(out.kind, "task");
  assert.equal(out.today, false);
  assert.equal(out.label, "اشتريت هدية لأمي");
});

test("punctuation after the trigger does not hide it", () => {
  const out = parse("اليوم: راجع المحاسبة");
  assert.equal(out.kind, "task");
  assert.equal(out.today, true);
  assert.equal(out.label, "راجع المحاسبة");
});

test("water is glasses and never riyals", () => {
  assert.equal(parse("كاس ماء").count, 1);
  assert.equal(parse("ماء ٣").count, 3);
  /* A fat-fingered thirty does not fill the day in one message. */
  assert.equal(parse("ماء 30").count, 1);
  /* «شربت قهوة» is not a glass of water. */
  assert.equal(parse("شربت قهوة").kind, "task");
});

test("an unrecognised message is a task and keeps every word of it", () => {
  const out = parse("أسأل عن رسوم التسجيل في الجامعة");
  assert.equal(out.kind, "task");
  assert.equal(out.today, false);
  assert.equal(out.label, "أسأل عن رسوم التسجيل في الجامعة");
});

test("fold matches across hamza, ya and ta-marbuta", () => {
  assert.equal(fold("صلاة"), fold("صلاه"));
  assert.equal(fold("أذكار"), fold("اذكار"));
  assert.equal(fold("على"), fold("علي"));
});

/* --- the writing ------------------------------------------------------- */

const base = () => freshState();

test("an expense row is written by its shape and lands newest first", () => {
  const out = addExpense(base(), { label: "غداء", amount: 35 });
  assert.equal(out.expenses, undefined); // the action returns a state, not a list
  assert.equal(out.next.expenses.length, 1);
  const row = out.next.expenses[0];
  assert.equal(row.date, dayKey());
  assert.equal(row.amount, 35);
  assert.equal(row.label, "غداء");
  assert.ok(row.id);
});

test("an expense with no amount is refused and writes nothing", () => {
  const out = addExpense(base(), { label: "غداء", amount: 0 });
  assert.ok(out.refused);
  assert.equal(out.next, undefined);
});

test("a nameless row still has a name", () => {
  assert.equal(addExpense(base(), { label: "", amount: 10 }).next.expenses[0].label, "مصروف");
  assert.equal(addIncome(base(), { label: "", amount: 10 }).next.income[0].label, "عمل مرن");
});

test("the balance reported is income minus expenses over the whole ledger", () => {
  let s = base();
  s = addIncome(s, { label: "توصيل", amount: 300 }).next;
  const out = addExpense(s, { label: "بنزين", amount: 120 });
  assert.equal(out.balance, 180);
});

test("a plain message lands in the one quadrant that asks for a decision", () => {
  const out = addTask(base(), { label: "أسأل عن الرسوم", today: false });
  const row = out.next.tasks.at(-1);
  assert.equal(row.quadrant, "q2");
  assert.equal(row.today, false);
  assert.equal(row.text, "أسأل عن الرسوم");
});

test("the fourth today-task is refused and the words are still kept", () => {
  /* The cap has four doors in the app and the bot is a fifth. It goes
     through `capToday` like every other one — and it keeps the task. */
  let s = base();
  s = { ...s, tasks: s.tasks.map((t) => ({ ...t, today: false })) };
  for (let i = 0; i < TOP_TASK_CAP; i++) {
    s = addTask(s, { label: "مهمة " + i, today: true }).next;
  }
  assert.equal(s.tasks.filter((t) => t.today).length, TOP_TASK_CAP);

  const out = addTask(s, { label: "الرابعة", today: true });
  assert.equal(out.capped, true);
  assert.equal(out.today, false);
  /* Written, not dropped — and not flagged. */
  const row = out.next.tasks.find((t) => t.text === "الرابعة");
  assert.ok(row);
  assert.equal(row.today, false);
  assert.equal(out.next.tasks.filter((t) => t.today).length, TOP_TASK_CAP);
});

test("ticking a habit writes today's archive row, not just the flag", () => {
  /* The bot is a second writer of that row. If it wrote only the flag, every
     tick made away from the laptop would be missing from the archive. */
  const s = base();
  const id = s.habits[0].id;
  const out = tickHabit(s, id);
  assert.equal(out.next.habits.find((h) => h.id === id).done, true);
  const row = out.next.history.find((h) => h.date === dayKey());
  assert.ok(row, "today's row has to exist");
  assert.deepEqual(row.done, [id]);
  assert.equal(row.all.length, s.habits.length);
  assert.equal(row.pct, disciplineOf(out.next.habits));
  assert.equal(isGap(row), false);
});

test("a tiny tick is a tick, and marked as one", () => {
  const s = base();
  const id = s.habits[0].id;
  const whole = tickHabit(s, id).next;
  const floor = tickHabit(s, id, true).next;
  assert.equal(disciplineOf(floor.habits), disciplineOf(whole.habits));
  const row = floor.history.find((h) => h.date === dayKey());
  assert.deepEqual(row.tiny, [id]);
  /* A subset of `done`, never a third state. */
  assert.ok(row.done.includes(id));
});

test("a habit already ticked is said so, never ticked twice", () => {
  const s = base();
  const id = s.habits[0].id;
  const once = tickHabit(s, id).next;
  const again = tickHabit(once, id);
  assert.ok(again.refused);
  assert.equal(again.next, undefined);
});

test("a few words find the habit they meant", () => {
  const s = {
    habits: [
      { id: "a", label: "صلاة العصر وأذكار", done: false },
      { id: "b", label: "أذكار المساء", done: false },
      { id: "c", label: "ساعة في النادي", done: true },
    ],
  };
  assert.deepEqual(findHabits(s.habits, "صلاة العصر").map((h) => h.id), ["a"]);
  /* Folded on both sides: ة/ه and أ/ا must not be the difference. */
  assert.deepEqual(findHabits(s.habits, "صلاه العصر").map((h) => h.id), ["a"]);
  assert.deepEqual(findHabits(s.habits, "اذكار").map((h) => h.id), ["a", "b"]);
  /* The open ones first, so the bot ticks one of those and only mentions a
     finished habit to say it is already done. */
  assert.deepEqual(findHabits(s.habits, "النادي").map((h) => h.id), ["c"]);
  assert.deepEqual(findHabits(s.habits, "لا شيء"), []);
});

test("water is bounded by the goal and rides the archive row", () => {
  let s = base();
  const out = drinkWater(s, 1);
  assert.equal(out.count, 1);
  assert.equal(out.next.history.find((h) => h.date === dayKey()).water, 1);

  s = { ...s, water: WATER_GOAL_DEFAULT };
  const full = drinkWater(s, 1);
  assert.ok(full.refused);
  assert.equal(full.next, undefined);
});

test("a task is finished once", () => {
  const s = base();
  const id = s.tasks[0].id;
  const out = finishTask(s, id);
  assert.equal(out.next.tasks.find((t) => t.id === id).done, true);
  assert.ok(finishTask(out.next, id).refused);
});

/* --- putting one back -------------------------------------------------- */

test("an undo restores the whole list, and nothing done since", () => {
  /* `before` is the whole array for the same reason the app's undo bus arms
     with it: a row put back at the end is a row that moved. And it is spread
     over whatever the state is by then, so an unrelated change made in
     between survives the undo. */
  let s = base();
  const first = addExpense(s, { label: "غداء", amount: 35 });
  s = first.next;
  s = addIncome(s, { label: "توصيل", amount: 300 }).next;

  const back = undo(s, first.before).next;
  assert.equal(back.expenses.length, 0, "the expense is gone");
  assert.equal(back.income.length, 1, "the income added after it is not");
});

test("an undo with nothing to put back is refused, not silent", () => {
  assert.ok(undo(base(), null).refused);
});

/* --- the day, read ---------------------------------------------------- */

test("dayAt derives every figure and stores none", () => {
  let s = base();
  s = tickHabit(s, s.habits[0].id).next;
  s = addExpense(s, { label: "غداء", amount: 35 }).next;
  s = addIncome(s, { label: "توصيل", amount: 300 }).next;
  const day = dayAt(s);
  assert.equal(day.date, dayKey());
  assert.equal(day.pct, disciplineOf(s.habits));
  assert.equal(day.habitsDone, 1);
  assert.equal(day.spentWeek, 35);
  assert.equal(day.earnedWeek, 300);
  assert.equal(day.balance, 265);
  assert.equal(day.tasks.length, s.tasks.filter((t) => t.today).length);
});

/* --- the brief -------------------------------------------------------- */

test("the morning cue is the same all day and different tomorrow", () => {
  const quotes = Array.from({ length: 9 }, (_, i) => ({ id: String(i), text: "ق" + i }));
  /* Stable within a day — a brief read twice before noon must not quote two
     different things — and the date alone would walk in lockstep with the
     month and repeat every first. */
  assert.equal(quoteFor(quotes, "2027-03-04").text, quoteFor(quotes, "2027-03-04").text);
  const walk = new Set(
    ["2027-03-01", "2027-03-02", "2027-03-03", "2027-03-04", "2027-03-05"].map(
      (d) => quoteFor(quotes, d).text,
    ),
  );
  assert.ok(walk.size >= 4, "five days should not land on one quote");
  assert.equal(quoteFor([], "2027-03-04"), null);
});

/* --- what the bot sends unprompted -------------------------------------
   The schedule is `state.bot` and `planDay` turns it into minutes; the two
   tests below hold the half that cannot be pure — turning those minutes
   into moments, and turning a kind into a sentence built from the day as it
   stands when it fires rather than when it was armed. */

const withBot = (part) => {
  const s = freshState();
  return { ...s, bot: botShape({ ...s.bot, ...part }), place: null };
};

test("the plan becomes moments on the day it is asked about", () => {
  const noon = new Date(2027, 2, 4, 12, 0, 0);
  const state = withBot({ morningAt: "07:00", eveningAt: "20:00" });
  const plan = planToday(state, noon);
  assert.deepEqual(plan.map((p) => p.kind), ["morning", "evening"]);
  assert.equal(plan[0].when.getDate(), 4);
  assert.equal(plan[0].when.getHours(), 7);
  assert.equal(plan[1].when.getHours(), 20);
});

test("a reminder already past today is not armed, and one ahead is", () => {
  /* The arming rule the whole scheduler rests on: a brief whose hour has
     gone is tomorrow's problem, and tomorrow's arming is what picks it up.
     Arming it anyway would fire it the instant the bot restarts. */
  const nine = new Date(2027, 2, 4, 9, 0, 0);
  const state = withBot({ morningAt: "07:00", eveningAt: "20:00" });
  const sch = new Scheduler(() => {});
  assert.equal(sch.sync(state, nine), true);
  assert.deepEqual(sch.armed.map((p) => p.kind), ["evening"]);
  sch.clear();
});

test("the scheduler re-arms when the schedule moves and not otherwise", () => {
  /* Re-arming every tick would cancel and recreate a dozen timers a minute
     for nothing; re-arming on none of them would mean an edit that never
     takes effect until tomorrow. */
  const nine = new Date(2027, 2, 4, 9, 0, 0);
  const sch = new Scheduler(() => {});
  const state = withBot({ eveningAt: "20:00" });
  assert.equal(sch.sync(state, nine), true, "first sync always arms");
  assert.equal(sch.sync(state, new Date(2027, 2, 4, 9, 1, 0)), false, "a minute later, nothing moved");
  const moved = withBot({ eveningAt: "21:30" });
  assert.equal(sch.sync(moved, nine), true, "an edited time re-arms");
  assert.equal(sch.armed[0].when.getHours(), 21);
  sch.clear();
});

test("the water window is a window, and a backwards one arms nothing", () => {
  const noon = new Date(2027, 2, 4, 0, 1, 0);
  const on = withBot({
    morningOn: false,
    eveningOn: false,
    water: { on: true, every: 120, from: "08:00", to: "14:00" },
  });
  const plan = planToday(on, noon);
  assert.deepEqual(
    plan.map((p) => p.when.getHours()),
    [10, 12, 14],
    "every two hours after the start, up to and including the end",
  );
  const backwards = withBot({
    morningOn: false,
    eveningOn: false,
    water: { on: true, every: 60, from: "22:00", to: "06:00" },
  });
  assert.deepEqual(planToday(backwards, noon), [], "a window that ends before it starts is a mistake, not a wrap");
});

test("a custom reminder only fires on the days it names", () => {
  const thursday = new Date(2027, 2, 4, 0, 1, 0); // getDay() === 4
  assert.equal(thursday.getDay(), 4);
  const base2 = { morningOn: false, eveningOn: false };
  const onThu = withBot({
    ...base2,
    customs: [{ id: "r1", on: true, at: "09:00", text: "اتصل بالجامعة", days: [4] }],
  });
  assert.equal(planToday(onThu, thursday).length, 1);
  const onSun = withBot({
    ...base2,
    customs: [{ id: "r1", on: true, at: "09:00", text: "اتصل بالجامعة", days: [0] }],
  });
  assert.equal(planToday(onSun, thursday).length, 0);
  /* No days named means every day — an explicit all-seven and an empty list
     would be two shapes meaning one thing. */
  const always = withBot({
    ...base2,
    customs: [{ id: "r1", on: true, at: "09:00", text: "اتصل بالجامعة", days: [] }],
  });
  assert.equal(planToday(always, thursday).length, 1);
});

test("the master switch silences the plan without forgetting it", () => {
  const noon = new Date(2027, 2, 4, 0, 1, 0);
  const off = withBot({ on: false, morningAt: "07:00" });
  assert.deepEqual(planToday(off, noon), []);
  /* Off is mute, not uninstall: the schedule it was holding is still there. */
  assert.equal(off.bot.morningAt, "07:00");
});

test("a reminder says what is actually left, or says nothing", () => {
  let s = freshState();
  s = { ...s, water: 2, waterGoal: 9 };
  const said = textFor({ kind: "water" }, s);
  assert.match(said.text, /2/);
  assert.equal(said.water, true);
  /* The goal met: the message that fires to say «nothing» is the one that
     teaches you to ignore the rest. */
  assert.equal(textFor({ kind: "water" }, { ...s, water: 9 }), null);

  const noTasks = { ...s, tasks: s.tasks.map((t) => ({ ...t, today: false })) };
  assert.equal(textFor({ kind: "tasks" }, noTasks), null);
  assert.ok(textFor({ kind: "tasks" }, s).text.includes("باقي"));
});

test("a custom reminder fires with the words it has now, not the ones it was armed with", () => {
  const armed = { kind: "custom", id: "r1", text: "النصّ القديم" };
  const s = freshState();
  const now = { ...s, bot: botShape({ customs: [{ id: "r1", on: true, at: "09:00", text: "النصّ الجديد" }] }) };
  assert.match(textFor(armed, now).text, /الجديد/);
  /* Switched off between arming and firing: nothing is sent. */
  const muted = { ...s, bot: botShape({ customs: [{ id: "r1", on: false, at: "09:00", text: "ن" }] }) };
  assert.equal(textFor(armed, muted), null);
});
