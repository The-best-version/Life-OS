/* --- the rest of the system, reachable from a phone ---------------------
 *  The third bot suite, and the seam it holds is the widest: the calendar,
 *  the university desk, the goals vault, a day that is already closed, and
 *  the search over everything that was ever written down.
 *
 *  Same rules as the two beside it. Every module under test is pure — no
 *  grammY, no fetch, no disk — so this runs under the same
 *  `node --test tests/` the build gates on, with nothing installed. The one
 *  file deliberately absent is `voice.js`: it is network and nothing else,
 *  and a test of it would be a test of a mock of a transcriber.
 * --------------------------------------------------------------------- */
import test from "node:test";
import assert from "node:assert/strict";

import { parse, readWhen, readBack, BACK_MAX } from "../services/telegram-bot/parse.js";
import {
  addExpense,
  logReading,
  logFocus,
  tickHabit,
  untickHabit,
  tickOn,
  addEvent,
  whenKey,
  backKey,
  findCourses,
  markAbsence,
  addMark,
  findGoals,
  moveGoal,
} from "../services/telegram-bot/actions.js";
import { search } from "../services/telegram-bot/ask.js";
import { planToday, textFor, Snoozer } from "../services/telegram-bot/reminders.js";
import { sparkline, barRow } from "../services/telegram-bot/fmt.js";
import {
  freshState,
  dayKey,
  addDays,
  uid,
  rows,
  botShape,
  uniShape,
  courseShape,
  goalShape,
  eventShape,
  streakBaseFrom,
  STREAK_TARGET,
} from "../src/state/life-state.mjs";

/* --- a day that is not today ------------------------------------------- */

test("«أمس» is stripped and the rest is parsed exactly as it would have been", () => {
  /* One code path for both forms, so they cannot drift apart. */
  const plain = parse("صرفت ٣٥ غداء");
  const back = parse("أمس صرفت ٣٥ غداء");
  assert.equal(back.kind, "expense");
  assert.equal(back.amount, plain.amount);
  assert.equal(back.label, plain.label);
  assert.equal(back.back, 1);
  assert.equal(plain.back, undefined);
});

test("the reach back is bounded, and counted when it is said as a count", () => {
  assert.equal(parse("قبل يومين دخل ٢٠٠ توصيل").back, 2);
  assert.equal(readBack("قبل 3 ايام").days, 3);
  /* Past the window he is guessing, and a guessed row in a ledger is worse
     than a missing one. */
  assert.equal(readBack(`قبل ${BACK_MAX + 5} ايام`), null);
});

test("only the readings that can carry a date carry one", () => {
  /* A task has no date of its own, so «أمس» in front of one is part of what
     he wrote and not an instruction. */
  const t = parse("أمس اليوم: راجع المحاسبة");
  assert.equal(t.kind, "task");
  assert.equal(t.back, undefined);
  assert.equal(parse("أمس قرأت ٢٠ صفحة").back, 1);
  assert.equal(parse("أمس تمت صلاة العصر").back, 1);
});

test("a backdated row lands on the square it names", () => {
  const s = freshState();
  const y = addDays(dayKey(), -1);
  assert.equal(addExpense(s, { label: "غداء", amount: 35, back: 1 }).row.date, y);
  assert.equal(logReading(s, { pages: 10, back: 1 }).row.date, y);
  /* The focus row is dated from an epoch, and midnight would land it on the
     wrong side of the logical day boundary. */
  assert.equal(logFocus(s, { minutes: 40, back: 1 }).row.date, y);
  /* No `back` at all is today, which is the ordinary case. */
  assert.equal(backKey(0), dayKey());
  assert.equal(backKey(99), dayKey(), "an out-of-range reach is today, never a guess");
});

test("yesterday is corrected through the same function «عدّل أمس» uses", () => {
  let s = freshState();
  const id = s.habits[0].id;
  const y = addDays(dayKey(), -1);
  s = { ...s, history: [{ date: y, pct: 0, done: [], all: s.habits.map((h) => h.id) }] };
  const out = tickOn(s, id, y, true);
  assert.equal(out.date, y);
  const row = out.next.history.find((h) => h.date === y);
  assert.deepEqual(row.done, [id]);
  /* And today has not moved: today is a different day, and the whole value
     of a hard boundary is that it holds. */
  assert.equal(out.next.habits.find((h) => h.id === id).done, false);
  /* The streak is recomputed from the rows, never nudged — a counter
     adjusted by hand is a second opinion about the same archive. */
  assert.equal(out.next.streakBase, streakBaseFrom(out.next.history));
  /* Twice is refused rather than written twice. */
  assert.ok(tickOn(out.next, id, y, true).refused);
  assert.ok(tickOn(s, id, y, false).refused);
});

/* --- taking a tick back ------------------------------------------------- */

test("unticking withdraws the pages it let through", () => {
  let s = freshState();
  const linked = s.habits.find((h) => h.book);
  const book = s.books.find((b) => b.status === "reading");
  s = tickHabit(s, linked.id).next;
  s = logReading(s, { pages: 25, habitId: linked.id }).next;
  assert.equal(s.books.find((b) => b.id === book.id).page, "25");

  const out = untickHabit(s, linked.id);
  assert.equal(out.pages, 25);
  assert.equal(out.next.habits.find((h) => h.id === linked.id).done, false);
  /* A log that keeps pages the user undid is worse than no log. */
  assert.deepEqual(rows(out.next.reading), []);
  assert.equal(out.next.books.find((b) => b.id === book.id).page, "0");
  /* And the whole of what it touched comes back, so one tap puts it all
     back. */
  for (const key of ["habits", "history", "reading", "books"]) {
    assert.ok(key in out.before, key);
  }
});

test("the floor mark leaves with the tick", () => {
  let s = freshState();
  const id = s.habits[0].id;
  s = tickHabit(s, id, true).next;
  assert.equal(s.habits.find((h) => h.id === id).tiny, true);
  const out = untickHabit(s, id);
  /* `tiny` without `done` is not a state this app has — the archive would
     read it back as a day that was carried. */
  assert.equal(out.next.habits.find((h) => h.id === id).tiny, false);
  assert.ok(untickHabit(out.next, id).refused);
});

/* --- the calendar ------------------------------------------------------- */

test("a day word becomes the square it means", () => {
  const t = dayKey();
  assert.equal(whenKey("today", t), t);
  assert.equal(whenKey("tomorrow", t), addDays(t, 1));
  assert.equal(whenKey("after", t), addDays(t, 2));
  assert.equal(whenKey(null, t), t, "no day said is today");
  /* The next one of that weekday, today included: «موعد الأحد» said on a
     Sunday morning is this Sunday, not next. */
  const sunday = "2027-03-07"; // a Sunday
  assert.equal(whenKey(0, sunday), sunday);
  assert.equal(whenKey(1, sunday), "2027-03-08");
  assert.equal(whenKey(6, sunday), "2027-03-13");
});

test("the hour is read the way an appointment is actually said", () => {
  /* HH:MM wins outright — the one form that cannot be misread. */
  assert.equal(readWhen("١٧:٣٠ مقابلة").time, "17:30");
  assert.equal(readWhen("٥ م الدكتور").time, "17:00");
  assert.equal(readWhen("٩ ص الجامعة").time, "09:00");
  /* A bare hour is a guess, and the guess is the one a person means: one to
     seven is an evening, eight to twelve a morning. The confirmation says it
     back, so a wrong guess is visible rather than hidden. */
  assert.equal(readWhen("٥ الدكتور").time, "17:00");
  assert.equal(readWhen("١٠ الدكتور").time, "10:00");
  /* Nothing to read is no time at all, never an invented one. */
  assert.equal(readWhen("الدكتور").time, "");
});

test("an appointment with nothing left over keeps the word that made it", () => {
  /* «اجتماع اليوم ٩ ص» is a complete sentence with an empty remainder, and
     falling through to the inbox would file an appointment as a thought. */
  const out = parse("اجتماع اليوم ٩ ص");
  assert.equal(out.kind, "event");
  assert.equal(out.title, "اجتماع");
  assert.equal(out.time, "09:00");
});

test("an appointment is written by the calendar's own shape", () => {
  const out = addEvent(freshState(), { title: "الدكتور", day: "tomorrow", time: "17:00" });
  assert.equal(out.row.date, addDays(dayKey(), 1));
  assert.equal(out.row.time, "17:00");
  assert.equal(out.row.kind, "note");
  assert.deepEqual(out.row.doneOn, [], "the shape filled every field it owns");
  assert.ok(addEvent(freshState(), { title: "  " }).refused);
  /* A meeting is a meeting; everything else stays a note rather than being
     tinted red by a guess. */
  assert.equal(addEvent(freshState(), { title: "مقابلة عمل" }).row.kind, "meet");
});

test("a timed entry today is armed, an untimed one is not", () => {
  const s = freshState();
  const today = dayKey();
  const bot = botShape({
    ...s.bot,
    morningOn: false,
    eveningOn: false,
    events: { on: true, before: 30 },
  });
  const timed = eventShape({ title: "الدكتور", date: today, time: "17:00" });
  const loose = eventShape({ title: "اتصل بأمي", date: today });
  const st = { ...s, bot, place: null, events: [timed, loose] };
  /* `now` has to be the same day the entries are dated, because the plan is
     for the day it is asked about — a 2027 clock over a row dated today
     would arm nothing and prove nothing. */
  const plan = planToday(st, new Date());
  assert.deepEqual(plan.map((p) => p.kind), ["event"]);
  /* Thirty minutes before five. */
  assert.equal(plan[0].when.getHours(), 16);
  assert.equal(plan[0].when.getMinutes(), 30);

  /* The text is read off the live calendar, not off the entry: an
     appointment moved at noon must fire with its new hour at five. */
  const said = textFor({ kind: "event", id: timed.id }, st);
  assert.ok(said.text.includes("الدكتور"));
  assert.equal(textFor({ kind: "event", id: "gone" }, st), null);
});

/* --- the blocks --------------------------------------------------------- */

test("a block nudge is anchored to the prayers, never to the clock", () => {
  const s = freshState();
  const bot = botShape({
    ...s.bot,
    morningOn: false,
    eveningOn: false,
    blocks: { on: true, after: 10 },
  });
  /* With no city there are no prayer times and so no blocks — an invented
     hour is worse than a missing reminder. */
  assert.deepEqual(planToday({ ...s, bot, place: null }, new Date()).map((p) => p.kind), []);

  const withCity = { ...s, bot };
  const plan = planToday(withCity, new Date(2027, 2, 4, 0, 1));
  assert.ok(plan.length >= 5, "one per block the sun reaches");
  assert.ok(plan.every((p) => p.kind === "block"));
  /* Sorted, and each one carries which block it is about. */
  assert.ok(plan.every((p) => typeof p.block === "string"));
});

test("a block with nothing open says nothing", () => {
  let s = freshState();
  const said = textFor({ kind: "block", block: "morning" }, s);
  assert.ok(said.text.includes("باقي"));
  assert.ok(said.habits.length >= 1);
  /* Every habit of that block ticked: silence is the right output, the same
     rule the task sweep keeps. */
  for (const h of s.habits.filter((x) => x.group === "morning")) {
    s = tickHabit(s, h.id).next;
  }
  assert.equal(textFor({ kind: "block", block: "morning" }, s), null);
});

/* --- «لاحقًا» ------------------------------------------------------------ */

test("a snooze re-arms the entry, never the words", () => {
  /* The text is rebuilt when it fires, so a water nudge deferred at eleven
     says what is left at noon. */
  const fired = [];
  const snoozer = new Snoozer((entry) => fired.push(entry));
  const token = snoozer.hold({ kind: "water" });
  assert.equal(snoozer.arm(token, 1), true);
  assert.equal(fired.length, 0, "it fires later, not now");
  snoozer.clear();
  /* A token the bus no longer has is said out loud rather than silently
     doing nothing. */
  assert.equal(snoozer.arm(token, 1), false);
  assert.equal(snoozer.arm("nope", 1), false);
});

test("the snooze bus forgets the oldest, never the newest", () => {
  const snoozer = new Snoozer(() => {}, 3);
  const first = snoozer.hold({ kind: "water" });
  const second = snoozer.hold({ kind: "water" });
  snoozer.hold({ kind: "water" });
  const fourth = snoozer.hold({ kind: "water" });
  assert.equal(snoozer.arm(first, 1), false, "pushed out");
  assert.equal(snoozer.arm(second, 1), true);
  assert.equal(snoozer.arm(fourth, 1), true);
  snoozer.clear();
});

/* --- the university desk ------------------------------------------------ */

const withCourse = (part) => {
  const s = freshState();
  const course = courseShape({
    id: "c1",
    code: "ACCT 101",
    name: "مبادئ المحاسبة",
    absenceCap: 6,
    ...part,
  });
  return { ...s, uni: uniShape({ ...s.uni, courses: [course] }) };
};

test("a course is found by its name or its code", () => {
  const s = withCourse({});
  assert.equal(findCourses(s.uni, "محاسبة")[0].id, "c1");
  assert.equal(findCourses(s.uni, "ACCT")[0].id, "c1");
  assert.deepEqual(findCourses(s.uni, "فيزياء"), []);
  /* Nothing typed hands back the whole list, which is what the «أي مادة؟»
     question is built from. */
  assert.equal(findCourses(s.uni, "").length, 1);
});

test("the second absence on one day is refused, not counted", () => {
  /* The easiest mistake on that screen and the hardest to notice: the number
     is simply wrong from then on. */
  const out = markAbsence(withCourse({ absences: 2 }), "c1");
  assert.equal(out.count, 3);
  assert.equal(out.cap, 6);
  assert.ok(out.next.uni.courses[0].absentOn.includes(dayKey()));
  assert.ok(markAbsence(out.next, "c1").refused);
  /* `absences` stays authoritative — a term usually starts with absences
     taken before the app did. */
  assert.equal(out.next.uni.courses[0].absences, 3);
});

test("a mark is a pair, and a pair is what gets parsed", () => {
  const said = parse("درجة محاسبة الكويز ١٨ من ٢٠");
  assert.equal(said.kind, "uni");
  assert.equal(said.act, "mark");
  assert.equal(said.score, 18);
  assert.equal(said.max, 20);
  assert.ok(said.query.includes("محاسبة"));
  /* One number alone says nothing without what it was out of, so it is not
     read as a mark at all. */
  assert.notEqual(parse("درجة محاسبة ١٨").kind, "uni");
});

test("a mark is written by the desk's own shape", () => {
  const out = addMark(withCourse({}), "c1", { label: "الكويز", score: 18, max: 20 });
  const row = out.next.uni.courses[0].marks[0];
  assert.equal(row.score, 18);
  assert.equal(row.max, 20);
  assert.equal(row.weight, 0, "the shape filled what the sentence did not say");
  assert.ok(addMark(withCourse({}), "c1", { label: "x", score: 1, max: 0 }).refused);
});

/* --- the goals vault ---------------------------------------------------- */

const withGoal = (part) => {
  const s = freshState();
  return {
    ...s,
    goals: [
      goalShape({ id: "g1", text: "حفظ جزء عمّ", target: 100, current: 20, unit: "صفحة", ...part }),
      goalShape({ id: "g2", text: "هدف بلا عدّاد" }),
    ],
  };
};

test("a goal's meter is set by a number and advanced by a sign", () => {
  const s = withGoal({});
  const set = moveGoal(s, "g1", { value: 30 });
  assert.equal(set.now, 30);
  const add = moveGoal(s, "g1", { value: 5, add: true });
  assert.equal(add.now, 25, "«+٥» advances, a bare number sets");
  /* Bounded by the goal's own target: a meter past it is a goal that reads
     as done and is not. */
  assert.equal(moveGoal(s, "g1", { value: 500 }).now, 100);
  assert.equal(moveGoal(s, "g1", { value: -5 }).now, 0);
});

test("a goal with no meter is told so, not given one", () => {
  const out = moveGoal(withGoal({}), "g2", { value: 10 });
  assert.ok(out.refused);
  assert.ok(out.refused.includes("عدّاد"));
  /* And moving it to where it already is is a refusal rather than a write
     that changes nothing. */
  assert.ok(moveGoal(withGoal({}), "g1", { value: 20 }).refused);
});

test("the goals that can take a number come first", () => {
  const s = {
    ...freshState(),
    goals: [
      goalShape({ id: "a", text: "حفظ القرآن" }),
      goalShape({ id: "b", text: "حفظ القرآن", target: 30 }),
    ],
  };
  assert.equal(findGoals(s.goals, "حفظ")[0].id, "b");
  /* A finished goal is not offered at all. */
  const done = { ...s, goals: s.goals.map((g) => goalShape({ ...g, done: true })) };
  assert.deepEqual(findGoals(done.goals, "حفظ"), []);
});

/* --- the search --------------------------------------------------------- */

test("the search reaches the things that live behind a date", () => {
  let s = freshState();
  const y = addDays(dayKey(), -3);
  s = {
    ...s,
    history: [{ date: y, pct: 40, done: [], all: [], distraction: "الجوال في السرير", fix: "الدرج" }],
    expenses: [{ id: uid(), date: dayKey(), label: "قهوة الصباح", amount: 18 }],
  };
  const out = search(s, "الجوال");
  /* An evening reflection is the hardest thing in this app to find again:
     one per archive row, behind a date. */
  assert.ok(out.includes("تقييمات المساء"));
  assert.ok(out.includes(y));
  assert.ok(search(s, "قهوة").includes("قهوة الصباح"));
  assert.ok(search(s, "زقزقة").includes("ما لقيت"));
  /* One letter matches half the app, so it is refused rather than answered
     with a wall. */
  assert.ok(search(s, "ا").includes("كلمتين"));
});

test("the search folds hamza and ta-marbuta like every other match", () => {
  const s = { ...freshState(), tasks: [{ id: "t1", text: "مراجعة المحاسبه", done: false }] };
  assert.ok(search(s, "المحاسبة").includes("مراجعة"));
});

/* --- the chart that costs nothing --------------------------------------- */

test("a sparkline is scaled against a stated maximum, not its own best day", () => {
  /* Normalised to the data's own peak, every week looks identical — which is
     exactly the comparison a review exists to make. */
  assert.equal(sparkline([100], 100), "█");
  assert.equal(sparkline([50], 100), "▄");
  assert.equal(sparkline([50], 50), "█");
  /* Zero gets its own mark and never the shortest bar: «nothing happened»
     and «barely happened» are different facts. */
  assert.equal(sparkline([0, 100], 100), "·█");
  assert.equal(sparkline([], 100), "");
  assert.equal(sparkline(null, 100), "");
});

test("a bar row fills from its own end and never past it", () => {
  assert.equal(barRow("x", 10, 10, 4), "x ████");
  assert.equal(barRow("x", 0, 10, 4), "x ░░░░");
  assert.equal(barRow("x", 99, 10, 4), "x ████", "bounded at full");
  assert.equal(barRow("x", 5, 0, 4), "x ░░░░", "no maximum is not a division by zero");
});

/* --- the schedule's new entries, off until he says otherwise ------------ */

test("the blocks and the events are off in a fresh schedule", () => {
  const fresh = botShape({});
  assert.equal(fresh.blocks.on, false);
  assert.equal(fresh.events.on, false);
  /* And an older payload keeps everything it had. */
  const old = botShape({ morningAt: "07:30", water: { on: true, every: 90 } });
  assert.equal(old.blocks.on, false);
  assert.equal(old.events.on, false);
  assert.equal(old.water.every, 90);
  /* The snooze has a default rather than a zero: «later» meaning «now» is
     the one value it must never take. */
  assert.ok(fresh.snooze >= 5);
  assert.equal(botShape({ snooze: 1 }).snooze >= 5, true, "bounded at both ends");
  assert.equal(botShape({ snooze: 9999 }).snooze <= 240, true);
});
