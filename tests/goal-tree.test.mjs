/* نموّ شجرة الأهداف: مقروء من الصفوف، لا مخزَّن. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  GROWTH_STAGES,
  GROWTH_STREAK_FULL,
  treeGrowth,
  weekPace,
} from "../src/state/life-state-goals.mjs";

const day = (pct) => ({ date: "2026-10-01", pct, done: [], all: [] });
const gap = () => ({ date: "2026-10-02", gap: true });

test("weekPace counts gaps and never averages them", () => {
  const w = weekPace([day(100), gap(), day(50)]);
  assert.equal(w.pct, 75);
  assert.equal(w.recorded, 2);
  assert.equal(w.gaps, 1);
});

test("weekPace of nothing is zero, not NaN", () => {
  const w = weekPace([]);
  assert.equal(w.pct, 0);
  assert.equal(w.gaps, 0);
});

test("weekPace reads the last seven days only", () => {
  const old = Array.from({ length: 10 }, () => day(0));
  const w = weekPace([...old, ...Array.from({ length: 7 }, () => day(100))]);
  assert.equal(w.pct, 100);
});

test("an empty vault is a seed, not a crash", () => {
  const t = treeGrowth([], [], [], 0);
  assert.equal(t.stage.id, "seed");
  assert.equal(t.growth, 0);
  assert.equal(t.leaves, 0);
});

test("the three readings move the tree, and nothing else does", () => {
  const goals = [
    { id: "a", horizon: "quarter", done: true },
    { id: "b", horizon: "quarter" },
  ];
  const bare = treeGrowth(goals, [], [], 0);
  assert.equal(bare.parts.goals, 0.5);
  assert.equal(bare.parts.week, 0);
  assert.equal(bare.parts.streak, 0);
  assert.ok(Math.abs(bare.growth - 0.25) < 1e-9);

  const walked = treeGrowth(goals, [], [day(100)], GROWTH_STREAK_FULL);
  assert.ok(walked.growth > bare.growth, "الروتين يُنمي الشجرة");
  assert.equal(walked.parts.streak, 1, "السلسلة تُسقَف عند ٢١ يومًا");
});

test("the ninety-day goals are what is scored, never counted twice", () => {
  const goals = [
    { id: "big", horizon: "h3" },
    { id: "yr", horizon: "year", parent: "big" },
    { id: "q", horizon: "quarter", parent: "yr", done: true },
  ];
  assert.equal(treeGrowth(goals).parts.goals, 1);
  assert.equal(treeGrowth(goals).leaves, 1);
  assert.equal(treeGrowth(goals).fruit, 1);
});

test("with no ninety-day goal the higher horizons still score", () => {
  const t = treeGrowth([{ id: "yr", horizon: "year", done: true }]);
  assert.equal(t.parts.goals, 1);
  assert.equal(t.leaves, 0);
});

test("growth is capped at one and the last stage is reachable", () => {
  const t = treeGrowth(
    [{ id: "q", horizon: "quarter", done: true }],
    [],
    [day(100)],
    99,
  );
  assert.equal(t.growth, 1);
  assert.equal(t.stage.id, GROWTH_STAGES[GROWTH_STAGES.length - 1].id);
});

test("the stage table is ordered and starts at zero", () => {
  assert.equal(GROWTH_STAGES[0].at, 0);
  for (let i = 1; i < GROWTH_STAGES.length; i++)
    assert.ok(GROWTH_STAGES[i].at > GROWTH_STAGES[i - 1].at);
});
