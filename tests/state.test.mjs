/* --- the only safety net over 21,000 lines ----------------------------
 *  `node --test tests/` — nothing installed, nothing fetched. The fixtures
 *  are real backups of a real year, not hand-written objects: a migration
 *  that passes on a fixture someone invented to make it pass has tested
 *  nothing.
 *
 *  What these are actually for. Every change to this app is a change to one
 *  file of twenty-odd thousand lines, and the failures that hurt are the
 *  quiet ones — a list that migrates to empty, a new feature left out of the
 *  carry so its data disappears at four in the morning, a score that two
 *  screens compute differently. None of those throw. All of them are caught
 *  below.
 * --------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  SCHEMA,
  CORE_CAP,
  TOP_TASK_CAP,
  DAY_START_HOUR,
  MORE_IDS,
  TAB_BAR,
  NAV_IDS,
  navSplit,
  orderNavIds,
  dayKey,
  yesterdayKey,
  fmtDay,
  logicalNow,
  freshState,
  carryOf,
  rollDay,
  migrate,
  addDays,
  HISTORY_CAP,
  GAP_REACH,
  isGap,
  fillGaps,
  firstDay,
  pctOfRow,
  setDayDone,
  streakBaseFrom,
  scoredOf,
  disciplineOf,
  coreOf,
  bookShape,
  goalShape,
  BLOCK_IDS,
  blockRank,
  remainingIn,
  uniPending,
  minsIn,
  taskShape,
  capToday,
  STEP_MAX,
  tomorrowKey,
  prepShape,
  prepPicks,
  prepFull,
  prepHas,
  prepPickAdd,
  prepPickDrop,
  prepPickEvent,
  prepReady,
  applyPrep,
  prepCarry,
  habitShape,
  HABIT_MIN_MAX,
  streakRunFrom,
  STREAK_FORGIVE,
  comebackFrom,
  COMEBACK_MIN,
} from "../life-state.mjs";
import { BLOCK_ANCHORS, blockAt } from "../prayer-times.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => JSON.parse(readFileSync(join(here, "fixtures", name), "utf8"));

const LISTS = [
  "habits",
  "tasks",
  "goals",
  "books",
  "history",
  "quotes",
  "reads",
  "badHabits",
  "events",
  "sessions",
  "income",
  "ventures",
  "prompts",
  "reviews",
  "pipeline",
  "reading",
];

const count = (s) =>
  Object.fromEntries(LISTS.map((k) => [k, Array.isArray(s[k]) ? s[k].length : 0]));

const ids = (list) => new Set((list || []).map((r) => r && r.id).filter(Boolean));

/* ===================================================================== *
 *  migrate — the one function that can lose a year
 * ===================================================================== */

for (const name of ["schema-19.json", "schema-20.json"]) {
  test(`migrate(${name}) loses no row`, () => {
    const raw = fixture(name);
    const out = migrate(raw);
    const before = count(raw);
    const after = count(out);
    for (const k of LISTS) {
      assert.ok(
        after[k] >= before[k],
        `${k}: ${before[k]} rows went in, ${after[k]} came out`,
      );
    }
    assert.equal(out.schema, SCHEMA);
  });

  test(`migrate(${name}) keeps every id`, () => {
    const raw = fixture(name);
    const out = migrate(raw);
    for (const k of LISTS) {
      const was = ids(raw[k]);
      const now = ids(out[k]);
      for (const id of was) assert.ok(now.has(id), `${k}: id ${id} vanished`);
    }
  });

  test(`migrate(${name}) is idempotent`, () => {
    const once = migrate(fixture(name));
    const twice = migrate(once);
    assert.deepEqual(twice, once);
  });

  test(`migrate(${name}) guesses nobody's core habits`, () => {
    /* Schema 20's whole point: which five habits carry a day is not a
       question a migration is in any position to answer, so it asks. */
    const out = migrate(fixture(name));
    const core = coreOf(out.habits);
    const raw = fixture(name);
    const wasCore = (raw.habits || []).filter((h) => h.core).length;
    assert.equal(core.length, wasCore);
  });
}

test("migrate survives damage that a hand-edited backup can carry", () => {
  const raw = fixture("schema-20.json");
  const broken = {
    ...raw,
    habits: [null, ...raw.habits, 7, "x"],
    history: [...raw.history, null, { noDate: true }],
    goals: [...raw.goals, null],
    books: null,
  };
  const out = migrate(broken);
  assert.equal(out.habits.length, raw.habits.length);
  assert.ok(out.history.every((h) => typeof h.date === "string"));
  assert.ok(Array.isArray(out.books));
});

test("migrate accepts what is not an object at all", () => {
  for (const junk of [null, undefined, 7, "x", []]) {
    const out = migrate(junk);
    assert.equal(out.schema, SCHEMA);
    assert.ok(Array.isArray(out.habits));
  }
});

test("migrate never lets the revision into the state", () => {
  /* `rev` belongs to the write, not to the day: it counts saves and lives in
     its own storage key. A copy inside the state would be stale the instant
     the next save moved it, and would then be written back as the truth. */
  const out = migrate({ ...fixture("schema-20.json"), rev: 412 });
  assert.equal("rev" in out, false);
});

test("a goal's parent is never a dangling or circular link", () => {
  const raw = fixture("schema-20.json");
  const first = raw.goals[0].id;
  const second = raw.goals[1].id;
  const out = migrate({
    ...raw,
    goals: [
      { ...raw.goals[0], parent: "does-not-exist" },
      { ...raw.goals[1], parent: second }, // pointed at itself
      ...raw.goals.slice(2),
    ],
  });
  const byId = new Map(out.goals.map((g) => [g.id, g]));
  for (const g of out.goals) {
    if (!g.parent) continue;
    assert.notEqual(g.parent, g.id, "a goal is its own parent");
    const seen = new Set([g.id]);
    let at = g.parent;
    while (at) {
      assert.ok(!seen.has(at), "the parent chain closes a loop");
      assert.ok(byId.has(at), "the parent chain leaves the list");
      seen.add(at);
      at = byId.get(at).parent || null;
    }
  }
  assert.equal(byId.get(first).parent, null);
});

/* ===================================================================== *
 *  the carry — the most expensive mistake this app can make
 * ===================================================================== */

/* A key in freshState that is missing from carryOf is data that exists all
   day and is gone by morning, with nothing on screen to say why. It has
   happened; it is the reason this test exists. The exceptions are the keys
   that belong to the day itself and are *meant* to reset. */
const DAY_ONLY = new Set([
  "schema", // the build's, not the day's
  "date", // the day's name
  "water", // yesterday's water is not today's
  "dayBanked", // whether today cleared the bar
  "streakBase", // recomputed at the rollover
  "rev", // belongs to the write, never to the state
]);

test("every key in freshState is carried across the day boundary", () => {
  const fresh = freshState();
  const carried = new Set(Object.keys(carryOf(fresh)));
  const orphans = Object.keys(fresh).filter((k) => !carried.has(k) && !DAY_ONLY.has(k));
  assert.deepEqual(
    orphans,
    [],
    "these keys exist all day and vanish at " +
      DAY_START_HOUR +
      ":00 — add them to carryOf: " +
      orphans.join(", "),
  );
});

test("carryOf invents nothing freshState does not have", () => {
  const fresh = freshState();
  for (const k of Object.keys(carryOf(fresh))) {
    assert.ok(k in fresh, `carryOf carries ${k}, which freshState never makes`);
  }
});

test("a migrated payload has every key freshState makes", () => {
  const out = migrate(fixture("schema-19.json"));
  for (const k of Object.keys(freshState())) {
    if (k === "rev") continue;
    assert.ok(k in out, `migrate drops ${k}`);
  }
});

/* ===================================================================== *
 *  rollDay
 * ===================================================================== */

test("rollDay unchecks and keeps everything else", () => {
  const today = migrate(fixture("schema-20.json"));
  const stale = { ...today, date: "2020-01-01", habits: today.habits.map((h) => ({ ...h, done: true })) };
  const rolled = rollDay(stale);
  assert.equal(rolled.date, dayKey());
  assert.equal(rolled.habits.length, stale.habits.length);
  assert.ok(rolled.habits.every((h) => h.done === false), "a habit stayed ticked");
  assert.ok(rolled.tasks.every((t) => t.done === false), "a task stayed ticked");
  /* The ticks reset; nothing else may. */
  assert.deepEqual(
    rolled.habits.map((h) => h.id),
    stale.habits.map((h) => h.id),
  );
  /* Not an equal count: a rollover now also writes down the days the app
     was never opened. What may never happen is a *recorded* row being lost
     or rewritten, which is what this checks instead. */
  for (const h of stale.history) {
    assert.deepEqual(
      rolled.history.find((x) => x.date === h.date),
      h,
      `${h.date} was lost or rewritten by the rollover`,
    );
  }
  assert.equal(
    rolled.history.filter((h) => !isGap(h)).length,
    stale.history.filter((h) => !isGap(h)).length,
    "the rollover invented a recorded day",
  );
  assert.equal(rolled.goals.length, stale.goals.length);
  assert.equal(rolled.books.length, stale.books.length);
  assert.equal(rolled.water, 0);
  assert.deepEqual(rolled.northStar, stale.northStar);
});

test("rollDay never clears the text a person typed", () => {
  const today = migrate(fixture("schema-20.json"));
  const stale = {
    ...today,
    date: "2020-01-01",
    northStar: { word: "انضباط", vision: "سطر" },
    habits: today.habits.map((h) => ({ ...h, done: true, label: h.label + " ." })),
  };
  const rolled = rollDay(stale);
  assert.equal(rolled.northStar.word, "انضباط");
  assert.deepEqual(
    rolled.habits.map((h) => h.label),
    stale.habits.map((h) => h.label),
  );
});

test("rollDay returns the same object when the day has not turned", () => {
  const today = { ...migrate(fixture("schema-20.json")), date: dayKey() };
  assert.equal(rollDay(today), today);
});

test("rollDay reads the streak off the archive, never off the counter", () => {
  /* The counter is gone: «+1 if yesterday banked, else 0» cannot forgive
     anything, because it has no idea what the day before yesterday was. */
  const base = migrate(fixture("schema-20.json"));
  const day = (n) => addDays(dayKey(), -n);
  const hit = (n) => ({ date: day(n), pct: 95, done: [], all: ["x"] });
  const miss = (n) => ({ date: day(n), pct: 10, done: [], all: ["x"] });

  const run = rollDay({
    ...base,
    date: yesterdayKey(),
    dayBanked: true,
    streakBase: 0, // deliberately wrong — the rows are the authority
    history: [hit(1), hit(2), hit(3), hit(4)],
  });
  assert.equal(run.streakBase, 4, "a stale counter was trusted over the rows");

  /* Yesterday fell short; the four before it did not. One bad day is
     stepped over and the run survives at the length it actually earned. */
  const forgiven = rollDay({
    ...base,
    date: yesterdayKey(),
    dayBanked: false,
    streakBase: 99,
    history: [miss(1), hit(2), hit(3), hit(4)],
  });
  assert.equal(forgiven.streakBase, 3);

  /* Two in a row is not a bad day, it is a stop. */
  const broken = rollDay({
    ...base,
    date: yesterdayKey(),
    dayBanked: false,
    streakBase: 99,
    history: [miss(1), miss(2), hit(3), hit(4)],
  });
  assert.equal(broken.streakBase, 0);

  /* Months away: fillGaps writes the unrecorded days and two of them in a
     row end the run, however many banked days sit behind them. */
  const skipped = rollDay({ ...base, date: "2020-01-01", dayBanked: true, streakBase: 4 });
  assert.equal(skipped.streakBase, 0, "a gap of months cannot continue a streak");
});

/* ===================================================================== *
 *  the score — one denominator, read through one function
 * ===================================================================== */

test("with no core set the score counts every habit", () => {
  const habits = [
    { id: "a", done: true, core: false },
    { id: "b", done: false, core: false },
    { id: "c", done: false, core: false },
    { id: "d", done: false, core: false },
  ];
  assert.equal(scoredOf(habits).length, 4);
  assert.equal(disciplineOf(habits), 25);
});

test("with a core set the score counts only the core", () => {
  /* The arithmetic that made the case: three real wins out of eighteen
     habits rendered as 17%, which is a screen telling someone who did three
     hard things that he failed. */
  const habits = Array.from({ length: 18 }, (_, i) => ({
    id: String(i),
    done: i < 3,
    core: i < 3,
  }));
  assert.equal(disciplineOf(habits), 100);
  assert.equal(scoredOf(habits).length, 3);
});

test("the score is 0, never NaN, with nothing to score", () => {
  assert.equal(disciplineOf([]), 0);
});

test("the two caps are the numbers the screens are built around", () => {
  assert.equal(CORE_CAP, 5);
  assert.equal(TOP_TASK_CAP, 3);
});

/* ===================================================================== *
 *  the day boundary
 * ===================================================================== */

test("the logical day starts at " + DAY_START_HOUR + ":00", () => {
  const night = new Date(2027, 2, 10, 1, 30);
  const morning = new Date(2027, 2, 10, 5, 0);
  /* logicalNow shifts a moment back onto the day it belongs to; 01:30
     belongs to the 9th, 05:00 to the 10th. */
  assert.equal(fmtDay(logicalNow(night)), "2027-03-09");
  assert.equal(fmtDay(logicalNow(morning)), "2027-03-10");
});

test("dayKey with an argument means that calendar square, not the logical day", () => {
  assert.equal(dayKey(new Date(2027, 2, 10, 1, 30)), "2027-03-10");
});

test("yesterdayKey is the day before dayKey", () => {
  const a = new Date(dayKey() + "T12:00:00");
  const b = new Date(yesterdayKey() + "T12:00:00");
  assert.equal(Math.round((a - b) / 86400000), 1);
});

/* ===================================================================== *
 *  the tabs
 * ===================================================================== */

test("orderNavIds keeps the saved order, drops the unknown, appends the new", () => {
  const saved = ["graph", "routine", "not-a-tab", "graph"];
  const out = orderNavIds(saved);
  assert.equal(out[0], "graph");
  assert.equal(out[1], "routine");
  assert.equal(out.length, NAV_IDS.length, "a tab was hidden or doubled");
  assert.equal(new Set(out).size, out.length, "a tab appears twice");
  for (const id of NAV_IDS) assert.ok(out.includes(id), id + " is unreachable");
});

test("orderNavIds survives junk", () => {
  for (const junk of [null, undefined, 7, "routine", [null, 3]]) {
    assert.deepEqual(orderNavIds(junk), NAV_IDS);
  }
});

/* Which tabs answer only from «المزيد» is his, like the order is. The two
   are separate lists on purpose: a pushed-back tab keeps its place, so
   pulling it out again returns it there and not to the end. */
test("navSplit sends the named tabs behind «المزيد» and keeps the rest in order", () => {
  const order = ["routine", "graph", "agenda", "uni", "career", "matrix"];
  const { main, behind } = navSplit(order, ["graph", "career"]);
  assert.deepEqual(behind, ["graph", "career"]);
  assert.deepEqual(main.slice(0, 4), ["routine", "agenda", "uni", "matrix"]);
  assert.equal(
    main.length + behind.length,
    NAV_IDS.length,
    "a tab fell off both sides",
  );
  for (const id of NAV_IDS)
    assert.ok(main.includes(id) || behind.includes(id), id + " is unreachable");
});

test("navSplit defaults to MORE_IDS, and an empty list is a choice", () => {
  for (const missing of [null, undefined, 7, "graph"]) {
    assert.deepEqual(navSplit(null, missing).behind, MORE_IDS);
  }
  assert.deepEqual(navSplit(null, []).behind, [], "he pulled them all back");
});

test("navSplit never leaves the phone bar short", () => {
  /* Everything pushed back — a hand-edited payload, or a build with one tab
     more. The bar must still have four, taken from the top of his order. */
  const order = orderNavIds(null);
  const { main, behind } = navSplit(order, order.slice());
  assert.equal(main.length, TAB_BAR, "the bar came up short or over-filled");
  assert.deepEqual(main, order.slice(0, TAB_BAR), "it did not take his first four");
  assert.equal(main.length + behind.length, NAV_IDS.length);
});

test("navSplit ignores a tab this build no longer has", () => {
  const { main, behind } = navSplit(null, ["graph", "not-a-tab"]);
  assert.deepEqual(behind, ["graph"]);
  assert.ok(!main.includes("not-a-tab"));
});

test("migrate hands a schema-20 payload the default «المزيد» list, untouched order", () => {
  const order = ["routine", "graph", "agenda", "uni", "career"];
  const out = migrate({ schema: 20, navOrder: order });
  assert.deepEqual(out.navMore, MORE_IDS, "the map did not move behind المزيد");
  /* «اليوم» is placed at the front by schema 22 — see its own test. Every
     tab he had ordered keeps its place behind it. */
  assert.deepEqual(
    out.navOrder.slice(0, 6),
    ["today", ...order],
    "a tab lost its place in the order",
  );
  assert.equal(out.navOrder.length, NAV_IDS.length, "a tab left the order");
});

test("migrate keeps a list he has already set, empty included", () => {
  assert.deepEqual(migrate({ schema: 21, navMore: ["vault"] }).navMore, ["vault"]);
  assert.deepEqual(migrate({ schema: 21, navMore: [] }).navMore, []);
});

/* ===================================================================== *
 *  the shapes that everything else is built out of
 * ===================================================================== */

test("bookShape is total", () => {
  /* `obj()` is what makes it total: a default parameter fires for `undefined`
     and for nothing else, so `bookShape(null)` used to sail past `(b = {})`
     and throw on the first property read — and `null` is exactly what a
     hand-edited backup or a half-written download hands it. The id is not
     bookShape's to mint; the seed and the add form carry their own. */
  for (const junk of [null, undefined, 7, "x", []]) {
    const b = bookShape(junk);
    assert.equal(typeof b.title, "string");
    assert.equal(typeof b.status, "string");
    assert.ok(Array.isArray(b.notes));
  }
});

test("bookShape keeps what the user wrote", () => {
  const b = bookShape({ id: "k", title: "الكتاب", page: 40, notes: [{ text: "x", page: 3 }] });
  assert.equal(b.id, "k");
  assert.equal(b.title, "الكتاب");
  assert.equal(b.page, 40);
});

test("goalShape defaults to the 90-day horizon", () => {
  assert.equal(goalShape({ text: "x" }).horizon, "quarter");
});

/* ===================================================================== *
 *  «اليوم» — the screen the app opens on
 *
 *  Nothing below touches a render. What is tested is the arithmetic the
 *  screen is a drawing of: which block the day is in, what is still open in
 *  it, what is behind you, and what is owed next — plus the one thing a
 *  migration can get wrong here, which is burying the new tab at the end of
 *  a fifteen-tab order where a phone never shows it.
 * ===================================================================== */

test("the day's blocks run in one order, in both modules", () => {
  /* `BLOCK_IDS` ranks «فاتك»; `BLOCK_ANCHORS` pins each block to a prayer.
     Two lists, one day — if they ever disagree, the screen says a habit is
     behind you while the clock says its block has not opened. */
  assert.deepEqual(
    BLOCK_ANCHORS.map((b) => b.id),
    BLOCK_IDS,
  );
});

test("blockRank puts an unknown block last, not first", () => {
  assert.equal(blockRank("morning"), 0);
  assert.equal(blockRank("night"), BLOCK_IDS.length - 1);
  /* The safe side: a habit from a damaged payload is "still ahead", never
     announced as missed. */
  assert.equal(blockRank("not-a-block"), BLOCK_IDS.length);
  assert.equal(blockRank(undefined), BLOCK_IDS.length);
});

test("blockAt walks the day through its six blocks", () => {
  const place = { lat: 24.7136, lng: 46.6753, tz: 3, asr: 1 };
  const at = (h, m = 30) => blockAt(place, new Date(2026, 9, 6, h, m)).id;
  assert.equal(at(5), "morning");
  assert.equal(at(9), "morning");
  assert.equal(at(13), "afternoon");
  assert.equal(at(16), "asr");
  assert.equal(at(23), "night");
});

test("after midnight the day is still in its last block", () => {
  /* The same mistake the evening prompt made with `getHours() >= 20`: the
     logical day rolls at 04:00 and Fajr can be later still, so 00:30 and
     03:30 are «قبل النوم» of the evening that has not finished. A null there
     would tell someone plainly awake in his day that it has not started. */
  const place = { lat: 24.7136, lng: 46.6753, tz: 3, asr: 1 };
  for (const h of [0, 2, 3]) {
    assert.equal(blockAt(place, new Date(2026, 9, 6, h, 30)).id, "night");
  }
});

test("remainingIn splits what is open by where the day has got to", () => {
  const habits = [
    { id: "a", group: "morning", done: true },
    { id: "b", group: "morning", done: false },
    { id: "c", group: "asr", done: false },
    { id: "d", group: "asr", done: true },
    { id: "e", group: "night", done: false },
  ];
  const { here, missed, later } = remainingIn(habits, "asr");
  assert.deepEqual(
    here.map((h) => h.id),
    ["c"],
  );
  assert.deepEqual(
    missed.map((h) => h.id),
    ["b"],
    "a ticked habit is not missed, and a closed block's open one is",
  );
  assert.deepEqual(
    later.map((h) => h.id),
    ["e"],
  );
});

test("remainingIn keeps his own order and survives junk", () => {
  const habits = [
    { id: "z", group: "morning", done: false },
    { id: "y", group: "morning", done: false },
    null,
    7,
    { id: "x", group: "wiped-block", done: false },
  ];
  const { here, later } = remainingIn(habits, "morning");
  assert.deepEqual(
    here.map((h) => h.id),
    ["z", "y"],
    "the list was re-sorted — the order on this screen is the user's",
  );
  assert.deepEqual(
    later.map((h) => h.id),
    ["x"],
    "a habit from a damaged payload must still render somewhere",
  );
  assert.deepEqual(remainingIn(null, "morning"), { here: [], missed: [], later: [] });
});

test("remainingIn holds a habit that was just ticked", () => {
  /* The reward has to play on a mounted row. Without the hold, the ripple,
     the pop and the emerald glow all fire on a row the same render removes,
     and ticking a habit here pays out nothing. */
  const habits = [
    { id: "a", group: "asr", done: true },
    { id: "b", group: "asr", done: false },
  ];
  assert.deepEqual(
    remainingIn(habits, "asr", new Set(["a"])).here.map((h) => h.id),
    ["a", "b"],
  );
  assert.deepEqual(
    remainingIn(habits, "asr", ["a"]).here.map((h) => h.id),
    ["a", "b"],
    "an array of ids reads the same as a set",
  );
  assert.deepEqual(
    remainingIn(habits, "asr").here.map((h) => h.id),
    ["b"],
    "nothing held, nothing kept",
  );
  assert.deepEqual(remainingIn(habits, "asr", "junk").here.map((h) => h.id), ["b"]);
});

test("uniPending puts the overdue first and drops what is done", () => {
  const uni = {
    tasks: [
      { id: "1", title: "واجب", due: "2026-10-09", time: "" },
      { id: "2", title: "كويز", due: "2026-10-02", time: "10:00" },
      { id: "3", title: "مسلّم", due: "2026-10-01", time: "", done: true },
      { id: "4", title: "عرض", due: "2026-10-02", time: "08:00" },
    ],
  };
  assert.deepEqual(
    uniPending(uni, "2026-10-06").map((t) => t.id),
    ["4", "2", "1"],
    "date then clock, and a finished deliverable is not owed",
  );
});

test("uniPending is total", () => {
  for (const junk of [null, undefined, 7, "x", {}, { tasks: [null, 3] }]) {
    assert.deepEqual(uniPending(junk, "2026-10-06"), []);
  }
});

test("minsIn reads a clock and refuses a half-typed one", () => {
  assert.equal(minsIn("08:30"), 510);
  assert.equal(minsIn("00:00"), 0);
  /* Null, never zero: a row with no time sorts after the timed ones, and a
     zero would float every one of them to dawn. */
  assert.equal(minsIn(""), null);
  assert.equal(minsIn("8"), null);
  assert.equal(minsIn(undefined), null);
});

test("«اليوم» is the first tab, and migrate puts it at the front", () => {
  assert.equal(NAV_IDS[0], "today");
  /* Appended by `orderNavIds` it would land sixteenth, which on a phone is
     behind «المزيد» — the opposite of a screen whose whole job is to be the
     one the app opens on. */
  const out = migrate({ schema: 21, navOrder: ["routine", "goals", "uni"] });
  assert.equal(out.navOrder[0], "today");
  assert.deepEqual(
    out.navOrder.slice(1, 4),
    ["routine", "goals", "uni"],
    "placing the new tab reshuffled the order he set",
  );
  assert.equal(out.navOrder.length, NAV_IDS.length);
  assert.ok(!out.navMore.includes("today"), "the landing screen must not hide");
});

test("migrate leaves «اليوم» where he has already put it", () => {
  const order = ["routine", "today", "uni"];
  const out = migrate({ schema: 21, navOrder: order });
  assert.deepEqual(out.navOrder.slice(0, 3), order);
});

test("«اليوم» takes a row on the phone bar", () => {
  /* It is the landing screen: if it can be pushed out of the four the bar
     shows, the app opens on a screen with no way back to itself. */
  const { main } = navSplit(null, null);
  assert.ok(main.slice(0, TAB_BAR).includes("today"));
});

/* ===================================================================== *
 *  Unrecorded days — the difference between a zero and a silence
 * ===================================================================== */

test("fillGaps writes a row for every day nobody recorded", () => {
  const out = fillGaps(
    [
      { date: "2026-09-29", pct: 0, done: [], all: ["a"] },
      { date: "2026-10-02", pct: 40, done: ["a"], all: ["a"] },
    ],
    "2026-09-29",
    "2026-10-03",
  );
  assert.deepEqual(
    out.map((h) => h.date),
    ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"],
    "the archive must come out in date order, with no day skipped",
  );
  assert.deepEqual(
    out.filter(isGap).map((h) => h.date),
    ["2026-09-30", "2026-10-01", "2026-10-03"],
  );
  /* A recorded day is never touched, whatever it scored. */
  assert.deepEqual(out[0], { date: "2026-09-29", pct: 0, done: [], all: ["a"] });
});

test("a gap row is not a zero: no score, no roster", () => {
  const [row] = fillGaps([], "2026-10-01", "2026-10-01");
  assert.deepEqual(row, { date: "2026-10-01", gap: true });
  assert.equal("pct" in row, false, "a day nobody recorded cannot have a score");
  assert.equal("done" in row, false, "and it cannot have a roll call");
  /* Which is what keeps it out of every consumer that reads the archive —
     all of them gate on `Array.isArray(row.done)`. */
  assert.equal(Array.isArray(row.done), false);
});

test("fillGaps refuses a range it cannot walk", () => {
  const h = [{ date: "2026-10-01", pct: 1 }];
  for (const [a, b] of [
    [null, "2026-10-05"],
    ["2026-10-01", "x"],
    ["2026-02-31", "2026-10-05"],
    ["2026-10-05", "2026-10-01"],
  ]) {
    assert.equal(fillGaps(h, a, b), h, `${a} → ${b} should have been refused whole`);
  }
});

test("fillGaps cannot blow the archive open", () => {
  /* A clock that ran away, or a payload whose `date` is years stale. Reach
     is bounded, so the real days are never pushed out of a capped archive by
     invented silences — and the recorded row is still there afterwards. */
  const out = fillGaps([{ date: "2020-01-01", pct: 5 }], "2020-01-01", "2026-10-05");
  assert.ok(out.length <= GAP_REACH + 1, `${out.length} rows came out`);
  assert.ok(out.length <= HISTORY_CAP);
  assert.deepEqual(out[0], { date: "2020-01-01", pct: 5 });
  assert.equal(out.filter(isGap).length, GAP_REACH);
});

test("migrate fills the days the old payload never recorded", () => {
  const raw = fixture("schema-20.json");
  const out = migrate(raw);
  const by = new Map(out.history.map((h) => [h.date, h]));
  /* The two real holes in the first week of October. */
  for (const d of ["2026-10-01", "2026-10-03"]) {
    assert.ok(by.has(d), `${d} is still missing from the archive`);
    assert.ok(isGap(by.get(d)), `${d} came back as something other than a gap`);
  }
  /* And every day he did record is still there, untouched. */
  for (const h of raw.history) {
    assert.deepEqual(by.get(h.date), h, `${h.date} was rewritten by the migration`);
  }
});

test("migrate invents no day before the first one he recorded", () => {
  const out = migrate(fixture("schema-20.json"));
  const first = fixture("schema-20.json")
    .history.map((h) => h.date)
    .sort()[0];
  assert.ok(
    out.history.every((h) => h.date >= first),
    "the archive reaches back before the first day there was an app to open",
  );
});

test("migrate leaves today alone — today is still being lived", () => {
  const out = migrate({ schema: 20, date: dayKey(), history: [{ date: "2026-01-01", pct: 3 }] });
  const today = out.history.find((h) => h.date === dayKey());
  assert.ok(!today || !isGap(today), "today was written down as unrecorded");
});

test("rollDay writes down the days the app was never opened", () => {
  const two = addDays(dayKey(), -3);
  const s = {
    ...freshState(),
    date: two,
    history: [{ date: two, pct: 50, done: [], all: [] }],
  };
  const out = rollDay(s);
  const gaps = out.history.filter(isGap).map((h) => h.date);
  assert.deepEqual(gaps, [addDays(dayKey(), -2), addDays(dayKey(), -1)]);
  /* The day being left behind already had its own row and keeps it. */
  assert.ok(out.history.some((h) => h.date === two && !isGap(h)));
});

test("firstDay ignores what is not a date", () => {
  assert.equal(
    firstDay([{ date: "x" }, { date: "2026-05-04" }, null, { date: "2026-02-30" }]),
    "2026-05-04",
  );
  assert.equal(firstDay([]), null);
  assert.equal(firstDay(null), null);
});

/* ===================================================================== *
 *  A past day's score, and correcting one
 * ===================================================================== */

test("pctOfRow reads the same denominator the ring reads", () => {
  const habits = [
    { id: "a", core: true },
    { id: "b", core: true },
    { id: "c" },
    { id: "d" },
  ];
  /* Two of four ticked is 50% with no core set... */
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "c"] }, habits.map((h) => ({ id: h.id }))), 50);
  /* ...and one of the two core habits is also 50% — but for a different
     reason, and the two must be computed by the same function or the archive
     and the ring will disagree about the same day. */
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "c"] }, habits), 50);
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "b", "c"] }, habits), 100);
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["c", "d"] }, habits), 0);
});

test("pctOfRow scores the day the roster it actually had", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  /* Three were asked that day and one of them has since been deleted. It
     still counts: dropping it would rescore a finished day every time the
     routine is edited, and the roll call lists it as «عادة لم تعد في روتينك»
     rather than forgetting it — so one of three, not one of two. */
  assert.equal(pctOfRow({ all: ["a", "b", "gone"], done: ["a"] }, habits), 33);
  /* And a deleted habit can never be core, because the core is a choice
     about the live routine. */
  assert.equal(
    pctOfRow({ all: ["a", "b", "gone"], done: ["a"] }, [{ id: "a", core: true }, { id: "b" }]),
    100,
  );
});

test("re-opening a day that was never edited previews the score it was lived at", () => {
  /* The bug this rule exists for: the editor showed 21% beside the 35% the
     day was recorded at, because three of that day's habits had been deleted
     since. An untouched row must preview exactly what it stored. */
  const all = ["a", "b", "c", "d", "e", "f"];
  const row = { date: "2026-10-05", all, done: ["a", "b"], pct: 33 };
  assert.equal(pctOfRow(row, [{ id: "a" }, { id: "b" }, { id: "c" }]), row.pct);
});

test("pctOfRow falls back to the live roster for a row that has none", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  assert.equal(pctOfRow({ done: ["a"] }, habits), 50);
  assert.equal(pctOfRow({}, habits), 0);
  assert.equal(pctOfRow(null, []), 0);
});

test("setDayDone rewrites one row and nothing else", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  const history = [
    { date: "2026-10-04", pct: 0, done: [], all: ["a", "b"] },
    { date: "2026-10-05", pct: 0, done: [], all: ["a", "b"], distraction: "النوم" },
  ];
  const out = setDayDone(history, "2026-10-05", ["a"], habits);
  assert.deepEqual(out[0], history[0], "the day before was touched");
  assert.equal(out[1].pct, 50);
  assert.deepEqual(out[1].done, ["a"]);
  /* Merged, never rebuilt: the row also carries the evening reflection. */
  assert.equal(out[1].distraction, "النوم");
});

test("setDayDone turns a gap into an ordinary day", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  const out = setDayDone([{ date: "2026-10-03", gap: true }], "2026-10-03", ["a", "b"], habits);
  assert.equal(out.length, 1);
  assert.equal(isGap(out[0]), false);
  assert.equal("gap" in out[0], false, "`gap: false` is a second shape meaning one thing");
  assert.equal(out[0].pct, 100);
  assert.deepEqual(out[0].all, ["a", "b"], "a gap has no roster, so the live one is used");
});

test("setDayDone cannot tick a habit that day never asked", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  const out = setDayDone(
    [{ date: "2026-10-05", done: [], all: ["a"] }],
    "2026-10-05",
    ["a", "b", "a"],
    habits,
  );
  assert.deepEqual(out[0].done, ["a"], "a habit off that day's roster, or listed twice");
  assert.equal(out[0].pct, 100);
});

test("setDayDone refuses a date that is not one", () => {
  const h = [{ date: "2026-10-05", done: [], all: [] }];
  for (const d of [null, "", "x", "2026-02-31"]) assert.equal(setDayDone(h, d, [], []), h);
});

test("streakBaseFrom counts back from yesterday", () => {
  const day = (n) => addDays(dayKey(), -n);
  const hit = (n) => ({ date: day(n), pct: 90, done: [], all: [] });
  assert.equal(streakBaseFrom([hit(1), hit(2), hit(3)]), 3);
  /* Today is not part of the base — `dayBanked` adds it, and counting it
     twice is how a streak reads one day ahead of itself. */
  assert.equal(streakBaseFrom([{ date: dayKey(), pct: 100, done: [], all: [] }]), 0);
});

test("the archive still carries no gap once it has been filled", () => {
  /* Idempotence where it matters: filling twice must not double the rows. */
  const once = fillGaps([{ date: "2026-10-01", pct: 1 }], "2026-10-01", "2026-10-04");
  const twice = fillGaps(once, "2026-10-01", "2026-10-04");
  assert.deepEqual(twice, once);
});

/* ===================================================================== *
 *  جهّز غدك — the three chosen the night before
 * ===================================================================== */

const T3 = (n) => [...Array(n)].map((_, i) => ({ id: `t${i}`, text: `م${i}`, today: false }));
const prepOf = (day, ...ids) => ({
  for: day,
  picks: ids.map((id) => ({ task: id, event: null })),
});

test("taskShape gives every task a step and invents no quadrant", () => {
  const t = taskShape({ id: "a", text: "x" });
  assert.equal(t.step, "");
  assert.equal(t.quadrant, "q2");
  assert.equal(t.today, false);
  assert.equal(t.done, false);
  /* A damaged payload must not throw on the way in. */
  assert.equal(taskShape(null).text, "");
  assert.equal(taskShape(undefined).step, "");
  /* His own text is bounded, never dropped. */
  assert.equal(taskShape({ step: "ب".repeat(400) }).step.length, STEP_MAX);
});

test("taskShape keeps the step the user typed, every load", () => {
  const once = taskShape({ id: "a", step: "افتح الملزمة على الفصل الثالث" });
  const twice = taskShape(once);
  assert.deepEqual(twice, once);
  assert.equal(twice.step, "افتح الملزمة على الفصل الثالث");
});

test("capToday refuses a fourth and keeps the first three in his order", () => {
  const list = [
    { id: "a", today: true },
    { id: "b", today: false },
    { id: "c", today: true },
    { id: "d", today: true },
    { id: "e", today: true },
  ];
  const out = capToday(list);
  assert.deepEqual(
    out.filter((t) => t.today).map((t) => t.id),
    ["a", "c", "d"],
  );
  /* The flag comes off; the task never does. */
  assert.equal(out.length, list.length);
  assert.equal(out.filter((t) => t.today).length, TOP_TASK_CAP);
  /* A list already inside the rule is handed back unchanged. */
  const fine = [{ id: "a", today: true }, { id: "b", today: false }];
  assert.deepEqual(capToday(fine), fine);
});

test("tomorrowKey is the day after the logical today", () => {
  assert.equal(tomorrowKey(), addDays(dayKey(), 1));
});

test("prepShape cannot hold a fourth pick, a duplicate, or a hole", () => {
  const p = prepShape({
    for: tomorrowKey(),
    picks: [
      { task: "a" },
      { task: "a" },
      null,
      { task: "" },
      { task: "b", event: "e1" },
      { task: "c" },
      { task: "d" },
    ],
  });
  assert.equal(p.picks.length, TOP_TASK_CAP);
  assert.deepEqual(p.picks.map((x) => x.task), ["a", "b", "c"]);
  assert.equal(p.picks[1].event, "e1");
  assert.equal(p.picks[0].event, null);
  /* A damaged or absent prep is an empty one, never a throw. */
  assert.deepEqual(prepShape(null), { for: null, picks: [] });
  assert.equal(prepShape({ for: "2026-02-31" }).for, null);
});

test("prepPickAdd refuses the fourth in the state, not on the screen", () => {
  const day = tomorrowKey();
  let p = prepPickAdd(null, "a", day);
  p = prepPickAdd(p, "b", day);
  p = prepPickAdd(p, "c", day);
  assert.equal(prepFull(p), true);
  assert.deepEqual(prepPickAdd(p, "d", day), p, "a fourth pick was accepted");
  /* And the same task twice is one pick. */
  assert.deepEqual(prepPickAdd(p, "a", day), p);
  assert.equal(prepHas(p, "b"), true);
  assert.equal(prepHas(p, "d"), false);
  assert.equal(p.for, day);
});

test("prepPickDrop and prepPickEvent move one pick and nothing else", () => {
  const day = tomorrowKey();
  const p = prepOf(day, "a", "b", "c");
  assert.deepEqual(prepPickDrop(p, "b").picks.map((x) => x.task), ["a", "c"]);
  assert.equal(prepPickDrop(p, "zz").picks.length, 3);
  const withEv = prepPickEvent(p, "b", "ev9");
  assert.deepEqual(withEv.picks.map((x) => x.event), [null, "ev9", null]);
  /* Clearing the time detaches the entry rather than storing an empty id. */
  assert.equal(prepPickEvent(withEv, "b", "").picks[1].event, null);
  assert.equal(prepPickEvent(withEv, "b", null).picks[1].event, null);
  assert.equal(prepPicks(p).length, 3);
});

test("a prep is only ever applied to the day it was made for", () => {
  const tasks = T3(4);
  const day = "2026-10-08";
  const prep = prepOf(day, "t1", "t3");
  assert.deepEqual(prepReady(prep, tasks, day).map((x) => x.task), ["t1", "t3"]);
  /* The day it was prepared for came and went; the three do not follow it. */
  assert.deepEqual(prepReady(prep, tasks, "2026-10-09"), []);
  assert.deepEqual(prepReady(prep, tasks, "2026-10-07"), []);
  assert.deepEqual(prepReady(prep, tasks, "nope"), []);
});

test("applyPrep promotes exactly the prepared three", () => {
  const day = "2026-10-08";
  const tasks = [
    { id: "t0", today: true },
    { id: "t1", today: false },
    { id: "t2", today: false },
    { id: "t3", today: false },
  ];
  const out = applyPrep(tasks, prepOf(day, "t1", "t3"), day);
  assert.deepEqual(out.filter((t) => t.today).map((t) => t.id), ["t1", "t3"]);
  assert.equal(out.length, tasks.length, "a task was lost on the way through");
});

test("a task deleted after being picked is simply not promoted", () => {
  const day = "2026-10-08";
  const tasks = [{ id: "t1", today: false }, { id: "t2", today: false }];
  const out = applyPrep(tasks, prepOf(day, "t1", "gone"), day);
  assert.deepEqual(out.filter((t) => t.today).map((t) => t.id), ["t1"]);
});

test("nothing prepared leaves the flags exactly where they were", () => {
  const tasks = [
    { id: "a", today: true },
    { id: "b", today: false },
    { id: "c", today: true },
  ];
  /* The behaviour this app had before the screen existed, and the behaviour
     it keeps for every day the screen is never opened. */
  assert.deepEqual(applyPrep(tasks, null, "2026-10-08"), tasks);
  assert.deepEqual(applyPrep(tasks, prepOf("2026-10-20", "b"), "2026-10-08"), tasks);
  /* But the cap is still asserted on the way through. */
  const four = [
    { id: "a", today: true },
    { id: "b", today: true },
    { id: "c", today: true },
    { id: "d", today: true },
  ];
  assert.equal(
    applyPrep(four, null, "2026-10-08").filter((t) => t.today).length,
    TOP_TASK_CAP,
  );
});

test("a spent prep is cleared, a waiting one is kept", () => {
  const prep = prepOf("2026-10-08", "a");
  /* Read by applyPrep on the way into this same state — leaving it there
     would re-promote its three at every rollover after it. */
  assert.deepEqual(prepCarry(prep, "2026-10-08"), { for: null, picks: [] });
  assert.deepEqual(prepCarry(prep, "2026-10-09"), { for: null, picks: [] });
  assert.deepEqual(prepCarry(prep, "2026-10-07"), prep);
  assert.deepEqual(prepCarry(null, "2026-10-07"), { for: null, picks: [] });
});

test("rollDay promotes last night's three and spends the prep", () => {
  const s = {
    ...freshState(),
    date: addDays(dayKey(), -1),
    tasks: [
      { id: "p0", text: "صفر", today: true, done: true },
      { id: "p1", text: "واحد", today: false, done: false, step: "افتح الملف" },
      { id: "p2", text: "اثنان", today: false, done: false },
      { id: "p3", text: "ثلاثة", today: false, done: false },
    ],
    tomorrow: prepOf(dayKey(), "p1", "p3"),
  };
  const next = rollDay(s);
  assert.equal(next.date, dayKey());
  assert.deepEqual(next.tasks.filter((t) => t.today).map((t) => t.id), ["p1", "p3"]);
  /* The step he typed last night is still under the task this morning. */
  assert.equal(next.tasks.find((t) => t.id === "p1").step, "افتح الملف");
  /* Yesterday's done flags are cleared, as they always were. */
  assert.equal(next.tasks.every((t) => !t.done), true);
  /* And the prep is spent, so the day after does not inherit tonight. */
  assert.deepEqual(next.tomorrow, { for: null, picks: [] });
});

test("a prep made for a day he slept through is dropped, not applied late", () => {
  const s = {
    ...freshState(),
    date: addDays(dayKey(), -4),
    tasks: [
      { id: "a", today: true, done: false },
      { id: "b", today: false, done: false },
    ],
    /* Prepared for the morning after the night he wrote it — three days ago. */
    tomorrow: prepOf(addDays(dayKey(), -3), "b"),
  };
  const next = rollDay(s);
  assert.deepEqual(next.tasks.filter((t) => t.today).map((t) => t.id), ["a"]);
  assert.deepEqual(next.tomorrow, { for: null, picks: [] });
});

test("migrate repairs a payload carrying a fourth today-task", () => {
  const raw = fixture("schema-20.json");
  raw.tasks = raw.tasks.map((t) => ({ ...t, today: true }));
  const out = migrate(raw);
  assert.equal(out.tasks.length, raw.tasks.length, "a task was dropped, not demoted");
  assert.equal(out.tasks.filter((t) => t.today).length, TOP_TASK_CAP);
});

test("picking for a new day does not inherit a stale day's three", () => {
  /* A restored backup, or a window left open through the rollover, can hand
     this a prep whose day is gone. Its three were chosen for a morning that
     has passed, and carrying them into tomorrow unasked is the one thing a
     screen called «جهّز غدك» must not do. */
  const stale = prepOf("2026-10-02", "old1", "old2", "old3");
  const out = prepPickAdd(stale, "fresh", "2026-10-09");
  assert.equal(out.for, "2026-10-09");
  assert.deepEqual(out.picks.map((x) => x.task), ["fresh"]);
  /* And a full stale prep does not refuse the first pick of a new day. */
  assert.equal(prepFull(stale), true);
  assert.equal(prepPickAdd(stale, "fresh", "2026-10-09").picks.length, 1);
});

/* ===================================================================== *
 *  السلسلة المتسامحة — one day is forgiven, two in a row are not
 * ===================================================================== */

const dayBack = (n) => addDays(dayKey(), -n);
const hit = (n) => ({ date: dayBack(n), pct: 95, done: [], all: ["x"] });
const miss = (n) => ({ date: dayBack(n), pct: 30, done: [], all: ["x"] });
const gapOn = (n) => ({ date: dayBack(n), gap: true });

test("one day under the target does not break the run", () => {
  /* The day a run dies is never the day something was hard — it is the day
     something was impossible. Ninety days going to zero over one fever is
     what teaches people to stop looking at the number. */
  assert.equal(streakBaseFrom([miss(1), hit(2), hit(3), hit(4)]), 3);
  assert.equal(streakBaseFrom([hit(1), miss(2), hit(3), hit(4)]), 3);
  assert.equal(streakBaseFrom([hit(1), hit(2), miss(3), hit(4)]), 3);
});

test("the forgiven day is not counted in the run either", () => {
  /* Forgiven is not the same as counted. The number still means «days I
     actually cleared the bar», or the softening has inflated it. */
  const run = streakRunFrom([miss(1), hit(2), hit(3), hit(4)]);
  assert.equal(run.days, 3);
  assert.equal(run.forgiven, 1);
  assert.equal(run.since, dayBack(4));
});

test("two days in a row under the target end it", () => {
  /* One is the whole tolerance. Raising it is a decision about what the
     number means, not a tuning knob — so the test names it. */
  assert.equal(STREAK_FORGIVE, 1);
  assert.equal(streakBaseFrom([miss(1), miss(2), hit(3), hit(4)]), 0);
  assert.equal(streakBaseFrom([hit(1), miss(2), miss(3), hit(4)]), 1);
  assert.equal(streakBaseFrom([hit(1), hit(2), miss(3), miss(4), hit(5)]), 2);
});

test("a miss at the near end is forgiven, a miss at the far end is not credited", () => {
  /* Yesterday short, the run behind it intact: the run stands and yesterday
     adds nothing. */
  const near = streakRunFrom([miss(1), hit(2), hit(3)]);
  assert.equal(near.days, 2);
  assert.equal(near.forgiven, 1);
  /* And the miss that ENDS the walk was never stepped over by anything, so
     it is not reported as a tolerance that was used. */
  const far = streakRunFrom([hit(1), hit(2), hit(3)]);
  assert.equal(far.days, 3);
  assert.equal(far.forgiven, 0, "a tolerance was claimed that nothing used");
});

test("a day nobody recorded is forgiven like any other miss, and never counted", () => {
  /* A gap is a day he was away, and being away is exactly what the
     tolerance is for — but it still cannot be claimed as part of a run. */
  const run = streakRunFrom([gapOn(1), hit(2), hit(3)]);
  assert.equal(run.days, 2);
  assert.equal(run.forgiven, 1);
  assert.equal(streakBaseFrom([hit(1), gapOn(2), hit(3)]), 2);
  /* Two unrecorded days in a row are a stop, same as two short ones. */
  assert.equal(streakBaseFrom([gapOn(1), gapOn(2), hit(3), hit(4)]), 0);
  /* And a gap beside a short day is still two in a row. */
  assert.equal(streakBaseFrom([miss(1), gapOn(2), hit(3)]), 0);
});

test("an empty archive is a run of nothing, not a crash", () => {
  assert.equal(streakBaseFrom([]), 0);
  assert.equal(streakBaseFrom(null), 0);
  assert.deepEqual(streakRunFrom([]), { days: 0, forgiven: 0, since: null });
});

test("migrate recomputes the stored streak under the forgiving rule", () => {
  /* The counter was computed under the old rule, where one short day ended
     everything. Leaving it would leave the counter and the archive
     disagreeing about the same run. */
  const raw = fixture("schema-20.json");
  const out = migrate({
    ...raw,
    schema: 24,
    streakBase: 0,
    history: [miss(1), hit(2), hit(3), hit(4)],
  });
  assert.equal(out.streakBase, 3);
  /* A payload already on this schema keeps the number it brought. */
  const kept = migrate({ ...out, streakBase: 7 });
  assert.equal(kept.streakBase, 7);
});

/* ===================================================================== *
 *  النسخة الصغيرة — the floor under a habit
 * ===================================================================== */

test("habitShape gives every habit a floor and nothing else changes", () => {
  const h = habitShape({ id: "a", label: "نادي", group: "morning" });
  assert.equal(h.min, "");
  assert.equal(h.tiny, false);
  assert.equal(h.core, false);
  assert.equal(h.book, null);
  assert.equal(habitShape(null).label, "");
  assert.equal(habitShape({ min: "ع".repeat(300) }).min.length, HABIT_MIN_MAX);
});

test("a habit's group is kept exactly as written, never re-pointed", () => {
  /* blockRank lands an unknown id last and groupOf renders it in the night
     block; rewriting it here would move his habit on the strength of a
     damaged payload. */
  assert.equal(habitShape({ group: "evening" }).group, "evening");
});

test("tiny without done is not a state this app has", () => {
  assert.equal(habitShape({ done: false, tiny: true }).tiny, false);
  assert.equal(habitShape({ done: true, tiny: true }).tiny, true);
});

test("the floor survives every load, and the tiny mark does not survive the day", () => {
  const raw = fixture("schema-20.json");
  const first = raw.habits[0].id;
  const out = migrate({
    ...raw,
    schema: 24,
    habits: raw.habits.map((h) =>
      h.id === first ? { ...h, min: "عشر دقائق مشي", done: true, tiny: true } : h,
    ),
  });
  assert.equal(out.habits.find((h) => h.id === first).min, "عشر دقائق مشي");
  assert.equal(out.habits.find((h) => h.id === first).tiny, true);
  /* A new day unticks it and takes the mark with it: `tiny` is this day's
     answer about this habit, not a property of the habit. */
  const next = freshState(carryOf(out));
  assert.equal(next.habits.find((h) => h.id === first).min, "عشر دقائق مشي");
  assert.equal(next.habits.find((h) => h.id === first).tiny, false);
  assert.equal(next.habits.find((h) => h.id === first).done, false);
});

test("a tiny tick is a tick as far as the score is concerned", () => {
  /* It counts. A completion that pays out less than it costs is a
     completion nobody takes. */
  const habits = [
    { id: "a", done: true, tiny: true, core: true },
    { id: "b", done: true, tiny: false, core: true },
    { id: "c", done: false, tiny: false, core: true },
    { id: "d", done: false, tiny: false, core: true },
  ];
  assert.equal(disciplineOf(habits), 50);
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "b"] }, habits), 50);
});

/* ===================================================================== *
 *  وضع الرجوع — two days away, and no verdict waiting
 * ===================================================================== */

test("comebackFrom counts the unrecorded days immediately before today", () => {
  const h = [hit(5), hit(4), gapOn(3), gapOn(2), gapOn(1)];
  assert.equal(comebackFrom(h), 3);
  assert.equal(comebackFrom([hit(3), hit(2), gapOn(1)]), 1);
  assert.equal(comebackFrom([hit(3), gapOn(2), hit(1)]), 0);
});

test("a day that went to zero is not a day nobody recorded", () => {
  /* The whole reason gap rows exist: an empty square cannot otherwise say
     whether the day went to zero or was never opened. */
  assert.equal(comebackFrom([hit(3), miss(2), miss(1)]), 0);
  assert.equal(comebackFrom([hit(3), gapOn(2), miss(1)]), 0);
});

test("a missing row counts as unrecorded, a brand-new profile does not", () => {
  /* Nothing written for yesterday at all is the same fact as a gap row. */
  assert.equal(comebackFrom([hit(4), hit(3)]), 2);
  /* But a profile that starts today has not been away — greeting a new user
     with «رجعت» is nonsense, so the walk is floored at the first day he
     ever recorded. */
  assert.equal(comebackFrom([{ date: dayKey(), pct: 40, done: [], all: [] }]), 0);
  assert.equal(comebackFrom([]), 0);
  assert.equal(comebackFrom(null), 0);
});

test("the comeback threshold is two, and the walk is bounded", () => {
  assert.ok(COMEBACK_MIN === 2);
  /* A year of silence cannot walk a year of dates. */
  const long = [{ date: "2020-01-01", pct: 90, done: [], all: [] }];
  assert.ok(comebackFrom(long) <= GAP_REACH);
});
