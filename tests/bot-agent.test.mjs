/* --- the agent, held -----------------------------------------------------
 *  The one part of this bot with a brain that is not in this repository. The
 *  network call is the only thing here that is not tested, and it is the only
 *  thing that *cannot* be: everything else — which tool maps to which action,
 *  how a turn loops, what the model is allowed to see, what gets written and
 *  what gets handed to the undo button — is ordinary logic and is held below.
 *
 *  `ask` is injected for exactly that reason. Every test here drives a scripted
 *  model: a function that returns the tool calls and text a real reply would
 *  have carried, so the loop is exercised end to end with no key, no network
 *  and no cost.
 * --------------------------------------------------------------------- */
import test from "node:test";
import assert from "node:assert/strict";

import {
  TOOLS,
  MAX_STEPS,
  runTool,
  keepBefore,
  stateBrief,
  systemPrompt,
  runAgent,
  applyPlan,
  agentCall,
  textOf,
  toolsOf,
} from "../services/telegram-bot/agent.js";
import { freshState, rows, disciplineOf } from "../src/state/life-state.mjs";

/* A reply the way the Messages API shapes one. */
const says = (text) => ({ content: [{ type: "text", text }], stop_reason: "end_turn" });
const calls = (list, text = "") => ({
  content: [
    ...(text ? [{ type: "text", text }] : []),
    ...list.map((c, i) => ({
      type: "tool_use",
      id: `t${i}`,
      name: c.name,
      input: c.input,
    })),
  ],
  stop_reason: "tool_use",
});

/* A scripted model: hands back the next reply in the list each time it is
   asked, and records what it was asked with. */
function script(...replies) {
  const seen = [];
  let at = 0;
  const ask = async (req) => {
    seen.push(req);
    return replies[Math.min(at++, replies.length - 1)];
  };
  ask.seen = seen;
  ask.count = () => at;
  return ask;
}

const withHabit = () => {
  const s = freshState();
  return { state: s, habit: rows(s.habits)[0] };
};

/* --- the tools are a table, and the table is the contract -------------- */

test("every tool names an action that exists and can actually run", () => {
  const s = freshState();
  for (const tool of TOOLS) {
    assert.ok(tool.name, "a tool with no name");
    assert.ok(tool.description.length > 20, `${tool.name}: a description too short to steer on`);
    assert.equal(tool.input_schema.type, "object");
    /* Called with nothing at all, a tool may refuse — but it may never throw,
       because a model that sends a half-filled call must get a sentence back,
       not a crashed turn. */
    const out = runTool(s, tool.name, {});
    assert.ok(out && typeof out === "object", `${tool.name} returned nothing`);
    assert.ok(out.refused || out.next, `${tool.name} neither refused nor produced a state`);
  }
});

test("an unknown tool is refused, never thrown", () => {
  const out = runTool(freshState(), "launch_rocket", { to: "mars" });
  assert.ok(out.refused);
  assert.match(out.refused, /launch_rocket/);
});

test("a tool call reaches the real action and moves the real number", () => {
  const { state, habit } = withHabit();
  const out = runTool(state, "tick_habit", { id: habit.id });
  assert.ok(out.next, "the habit was not ticked");
  assert.equal(rows(out.next.habits).find((h) => h.id === habit.id).done, true);
  assert.equal(out.pct, disciplineOf(out.next.habits), "the score is the action's own");
});

/* --- what the model is allowed to see ---------------------------------- */

test("the brief carries the ids the tools need, and the day's real figures", () => {
  const { state, habit } = withHabit();
  const brief = stateBrief(state);
  assert.ok(brief.includes(state.date), "the date is missing");
  assert.ok(brief.includes(habit.id), "a habit id is missing — the model could talk but not act");
  assert.ok(brief.includes(habit.label), "a habit label is missing");
  assert.match(brief, /الانضباط/);
  assert.match(brief, /الماء/);
});

test("the system prompt forbids inventing a number and claiming an unmade write", () => {
  const prompt = systemPrompt(freshState());
  assert.match(prompt, /لا تخترع رقم/);
  assert.match(prompt, /لا تدّعِ/);
  assert.ok(prompt.includes(stateBrief(freshState()).split("\n")[0]), "the brief is not in the prompt");
});

/* --- a turn ------------------------------------------------------------ */

test("a question with no tool call writes nothing and plans nothing", async () => {
  const ask = script(says("انضباطك اليوم ٠٪ وباقي عليك كل العادات."));
  const out = await runAgent(freshState(), "وش وضعي اليوم؟", { ask });

  assert.equal(out.text, "انضباطك اليوم ٠٪ وباقي عليك كل العادات.");
  assert.deepEqual(out.plan, [], "a question must not plan a write");
  assert.equal(ask.count(), 1);
});

test("a tool call runs, its result goes back to the model, and the plan records it", async () => {
  const { state, habit } = withHabit();
  const ask = script(
    calls([{ name: "tick_habit", input: { id: habit.id } }]),
    says("سجّلتها لك ✅"),
  );
  const out = await runAgent(state, `سجّل ${habit.label}`, { ask });

  assert.equal(out.text, "سجّلتها لك ✅");
  assert.deepEqual(out.plan, [{ name: "tick_habit", input: { id: habit.id } }]);

  /* The model's second turn must carry the first turn's result, or it is
     answering about a write it never saw land. */
  const second = ask.seen[1].messages;
  const result = second[second.length - 1].content[0];
  assert.equal(result.type, "tool_result");
  assert.ok(String(result.content).includes(habit.label));
});

test("a refused tool comes back as an error result, and is kept out of the plan", async () => {
  const { state, habit } = withHabit();
  const ticked = runTool(state, "tick_habit", { id: habit.id }).next;
  const ask = script(
    calls([{ name: "tick_habit", input: { id: habit.id } }]),
    says("هي مسجّلة أصلًا."),
  );
  const out = await runAgent(ticked, `سجّل ${habit.label}`, { ask });

  assert.deepEqual(out.plan, [], "a refusal must never become a planned write");
  const second = ask.seen[1].messages;
  const result = second[second.length - 1].content[0];
  assert.equal(result.is_error, true);
  assert.match(String(result.content), /أصلا|أصلاً/);
});

test("the turn stops at the step ceiling instead of looping forever", async () => {
  const { state, habit } = withHabit();
  /* A model that only ever asks for one more tool. */
  const ask = script(calls([{ name: "add_task", input: { label: "مهمة" } }]));
  const out = await runAgent(state, "سوّ شيئًا", { ask });

  assert.equal(ask.count(), MAX_STEPS, "the ceiling did not hold");
  assert.equal(out.plan.length, MAX_STEPS);
  assert.match(out.text, /أوقفت الدور|طال/);
});

test("an empty message is refused before any call is made", async () => {
  const ask = script(says("..."));
  const out = await runAgent(freshState(), "   ", { ask });
  assert.ok(out.refused);
  assert.equal(ask.count(), 0, "an empty message must not cost a call");
});

/* --- the plan, applied ------------------------------------------------- *
 *  The half that actually writes. It runs inside the disk lock on state read
 *  fresh, so it is deliberately a second, separate execution of the same
 *  calls — not a reuse of whatever the model's working copy ended up as.
 * ---------------------------------------------------------------------- */

test("the plan replays onto fresh state and hands back one undo for the whole turn", () => {
  const { state, habit } = withHabit();
  const out = applyPlan(state, [
    { name: "tick_habit", input: { id: habit.id } },
    { name: "add_task", input: { label: "اتصل بالجامعة" } },
    { name: "drink_water", input: { count: 2 } },
  ]);

  assert.equal(rows(out.next.habits).find((h) => h.id === habit.id).done, true);
  assert.ok(rows(out.next.tasks).some((t) => t.text === "اتصل بالجامعة"));
  assert.equal(out.next.water, 2);
  assert.equal(out.done.length, 3);

  /* One undo for the turn, not one per step: `before.habits` must still be
     the roster as it stood *before* the first write, not after it. */
  assert.equal(rows(out.before.habits).find((h) => h.id === habit.id).done, false);
  assert.equal(out.before.water, state.water);
  assert.ok(Array.isArray(out.before.tasks));
});

test("the oldest `before` wins, so an undo reaches past the middle of the turn", () => {
  const first = { habits: "الأقدم", water: 0 };
  const later = { habits: "الأحدث", tasks: [] };
  const merged = keepBefore(keepBefore({}, first), later);
  assert.equal(merged.habits, "الأقدم");
  assert.equal(merged.water, 0);
  assert.deepEqual(merged.tasks, []);
});

test("a plan whose every step is refused writes nothing and says why", () => {
  const { state, habit } = withHabit();
  const ticked = runTool(state, "tick_habit", { id: habit.id }).next;
  const out = applyPlan(ticked, [{ name: "tick_habit", input: { id: habit.id } }]);
  assert.ok(out.refused, "a turn that wrote nothing must refuse, not report success");
  assert.equal(out.next, undefined, "nothing may be written");
});

test("a partly refused plan keeps what landed and still says what did not", () => {
  const { state, habit } = withHabit();
  const out = applyPlan(state, [
    { name: "tick_habit", input: { id: habit.id } },
    { name: "tick_habit", input: { id: "لا-وجود-له" } },
  ]);
  assert.equal(out.done.length, 1, "the good step must survive the bad one");
  assert.equal(out.skipped.length, 1, "the bad step must still be reported");
  assert.ok(out.next);
});

/* The bug this test exists for was found by driving the real bot against a
   stub Telegram and a stub model: a turn that fully succeeded replied with
   «⚠️ » and nothing else, while the write had already landed on disk.
   `apply()` in bot.js reads `out.refused` as "nothing happened, say this",
   and an empty array is truthy — so a successful turn carrying `refused: []`
   was read as a refusal with an empty message. A success may never carry
   that key at all. */
test("a turn that fully succeeded never carries the key that means failure", () => {
  const { state, habit } = withHabit();
  const out = applyPlan(state, [{ name: "tick_habit", input: { id: habit.id } }]);
  assert.ok(out.next, "the write must be there");
  assert.equal(
    "refused" in out,
    false,
    "a success carrying `refused` is read as a failure by apply()",
  );
  assert.deepEqual(out.skipped, [], "what fell out of the plan has its own name");
});

test("an empty plan is a refusal, not a silent success", () => {
  assert.ok(applyPlan(freshState(), []).refused);
  assert.ok(applyPlan(freshState(), null).refused);
});

/* --- who the message was for ------------------------------------------- */

test("the agent is called by name, and everything else is left to the rules", () => {
  assert.equal(agentCall("مساعد وش وضعي؟"), "وش وضعي؟");
  assert.equal(agentCall("/ai what is left today"), "what is left today");
  assert.equal(agentCall("/مساعد سجّل قراءة"), "سجّل قراءة");
  /* The word alone is a call with nothing after it — a different answer
     from "this was not a call", which is why one is "" and the other null. */
  assert.equal(agentCall("مساعد"), "");
  assert.equal(agentCall("صرفت ٣٥ غداء"), null, "an ordinary sentence must reach parse.js");
  assert.equal(agentCall("قرأت ٢٠ صفحة"), null);
  /* «مساعدة» is the old help screen and must stay it: fold turns ة into ه,
     so the two words never collide. */
  assert.equal(agentCall("مساعدة"), null);
});

/* --- reading a reply --------------------------------------------------- */

test("text and tool calls are read out of a reply the way the API shapes it", () => {
  const mixed = calls([{ name: "add_task", input: { label: "x" } }], "خلني أسجّلها");
  assert.equal(textOf(mixed), "خلني أسجّلها");
  assert.equal(toolsOf(mixed).length, 1);
  assert.equal(textOf(says("جواب")), "جواب");
  assert.deepEqual(toolsOf(says("جواب")), []);
  /* A reply shaped wrong must come back empty rather than throwing — the
     bot has to keep answering even when the service hands back nonsense. */
  assert.equal(textOf(null), "");
  assert.deepEqual(toolsOf(undefined), []);
});
