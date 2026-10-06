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
  assert.equal(rolled.history.length, stale.history.length);
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

test("rollDay banks the streak only on a continued day", () => {
  const base = migrate(fixture("schema-20.json"));
  const banked = rollDay({ ...base, date: yesterdayKey(), dayBanked: true, streakBase: 4 });
  assert.equal(banked.streakBase, 5);
  const dropped = rollDay({ ...base, date: yesterdayKey(), dayBanked: false, streakBase: 4 });
  assert.equal(dropped.streakBase, 0);
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
