#!/usr/bin/env node
/* --- 2027 Life OS, from the phone --------------------------------------
 *  The app lives at http://127.0.0.1:47615 on one machine, which is right
 *  for a year of habits and wrong for the thirty seconds after lunch when
 *  the thing worth recording actually happens. This is that thirty seconds:
 *  a message, a confirmation, and an undo button.
 *
 *  It owns no data. Every change goes through `lifeos-client.js` to the sync
 *  server's own `POST /sync`, which carries the revision, refuses a write
 *  that is behind and stows a shrinking one — and every row it writes is
 *  built by the same shape function the screens use. The browser window
 *  stays the working copy; this is one more way to reach the disk.
 *
 *  **One consequence worth knowing.** If a browser window is open while the
 *  bot writes, that window is then holding a revision behind the disk and
 *  its next save is refused with the conflict bar — «حمّل الأحدث» adopts the
 *  disk copy, bot row and all. That is the designed answer and not a bug;
 *  nothing is lost either way. In practice the bot is used when the laptop
 *  is not.
 *
 *  Security is one rule, enforced before anything else runs: only
 *  TELEGRAM_CHAT_ID is answered, and everything else is dropped without a
 *  reply. A bot token makes a public endpoint — anyone who learns the bot's
 *  name can message it — so the whitelist is the whole of the access
 *  control, and it must be the first middleware in the chain.
 * --------------------------------------------------------------------- */
import { Bot, InlineKeyboard } from "grammy";
import { CONFIG, configProblems } from "./config.js";
import { withState, readLife, DiskError } from "./lifeos-client.js";
import { parse, fold } from "./parse.js";
import * as act from "./actions.js";
import * as V from "./views.js";
import { Scheduler, Bell, Snoozer, textFor, quoteFor } from "./reminders.js";
import { coachReply } from "./insight.js";
import { answer, weekReview, search } from "./ask.js";
import { readVoice, VoiceError } from "./voice.js";
import { startHealth, maskId } from "./health.js";
import { BOT_API, URGE_TAGS, botShape } from "../../src/state/life-state.mjs";

const problems = configProblems();
if (problems.length) {
  console.error("\nالبوت ما بدأ. الإعدادات ناقصة:\n");
  for (const p of problems) console.error("  • " + p);
  console.error("\nانسخ services/telegram-bot/.env.example إلى .env واملأه.\n");
  process.exit(1);
}

const bot = new Bot(CONFIG.token, { client: { apiRoot: CONFIG.apiRoot } });

/* --- the gate ---------------------------------------------------------- *
 *  `chat.id` AND `from.id`, both. In a private chat they are the same
 *  number, and that is exactly why both are checked: if the bot is ever
 *  added to a group, `chat.id` is the group's and `from.id` is whoever
 *  typed — and requiring both to be the configured id is the only test that
 *  stays correct in either shape.
 *
 *  Dropped silently, with no reply. An error message tells a stranger the
 *  bot is alive and has an owner; silence tells them nothing.
 * ---------------------------------------------------------------------- */
bot.use(async (ctx, next) => {
  const chat = ctx.chat?.id;
  const from = ctx.from?.id;
  if (String(chat) !== CONFIG.chatId || String(from) !== CONFIG.chatId) {
    if (chat !== undefined) console.warn(`رُفض: chat=${chat} from=${from}`);
    return;
  }
  await next();
});

/* --- the undo bus ----------------------------------------------------- *
 *  The same idea as `UndoBus` in the app: a label and the whole array as it
 *  stood, never the row. In memory only — a pending undo is not state that
 *  has to survive anything, and the moment it were written to disk it would
 *  be a second copy of the day arguing with the first.
 *
 *  The app's window is eight seconds, and that is the wrong window here: a
 *  message sits in a chat, and the answer to «was that the right amount?»
 *  usually arrives after a glance at something else. So a token lives until
 *  `UNDO_KEEP` newer ones have pushed it out, and a button pressed after
 *  that says so rather than silently doing nothing.
 * ---------------------------------------------------------------------- */
const UNDO_KEEP = 40;
const undos = new Map();
let undoSeq = 0;
function armUndo(before) {
  const token = String(++undoSeq);
  undos.set(token, before);
  while (undos.size > UNDO_KEEP) undos.delete(undos.keys().next().value);
  return token;
}

/* --- a choice whose payload does not fit in a button ------------------- *
 *  Telegram caps callback data at 64 bytes. «درجة الكويز ١٨ من ٢٠» has to
 *  survive the question «أي مادة؟», and an Arabic mark label blows that cap
 *  on its own — so the payload stays here under a token and the button
 *  carries the token and the row's id.
 *
 *  The same shape as the undo bus above, and in memory for the same reason:
 *  a half-finished question is not state that has to survive a restart, and
 *  a button pressed after one says so plainly instead of writing a mark onto
 *  a course nobody chose.
 * ---------------------------------------------------------------------- */
const asked = new Map();
let askSeq = 0;
function hold(payload) {
  const token = String(++askSeq);
  asked.set(token, payload);
  while (asked.size > UNDO_KEEP) asked.delete(asked.keys().next().value);
  return token;
}
const stale = (ctx) =>
  ctx.reply("⚠️ انتهت صلاحية هذا السؤال. أرسل الجملة مرة ثانية.");

/* Every write goes through here, so the reply, the undo button and the error
   handling are written once. `run` is one of the pure actions in actions.js;
   `say` turns its result into Arabic. */
async function apply(ctx, run, say) {
  let out;
  try {
    out = await withState(run);
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "صار خطأ غير متوقّع. ما كُتب شي.";
    console.error("apply: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);
  /* A write may have started or ended a focus round, and the bell is armed
     off a moment rather than off a clock time — so it is re-read here rather
     than waiting for the next minute's tick. A one-minute round started from
     a message would otherwise ring late or not at all. */
  if (out.next) bell.sync(out.next);
  const keys = out.before ? V.undoKeys(armUndo(out.before)) : null;
  return ctx.reply(say(out), keys ? { reply_markup: keys } : undefined);
}

/* A keyboard, or nothing. Telegram refuses a markup with no buttons in it,
   and a day with no open task has none. */
const keysOr = (kb) =>
  kb && kb.inline_keyboard.some((r) => r.length) ? { reply_markup: kb } : undefined;

/* The day, or a sentence saying why not. `readLife` throws when the sync
   server is down, and a throw inside a handler is caught by `bot.catch` and
   logged — which leaves the phone with no answer at all, the one failure
   mode that reads as a dead bot. So every read path goes through here. */
async function dayOrTell(ctx) {
  try {
    const state = await readLife();
    if (!state) {
      await ctx.reply("⚠️ ما فيه نسخة على القرص بعد. افتح 2027 Life OS مرة على الحاسب.");
      return null;
    }
    return { state, day: act.dayAt(state) };
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "ما قدرت أقرأ الحالة.";
    console.error("read: " + (e && e.message ? e.message : e));
    await ctx.reply("⚠️ " + msg);
    return null;
  }
}

/* --- the four things a sentence cannot ask for ------------------------- *
 *  Telegram only marks `/name` as a command when the name is ASCII, so
 *  «/صباح» arrives as ordinary text and a `bot.command("صباح")` would never
 *  fire. The commands are therefore ASCII, and the Arabic words that mean
 *  the same thing are matched as plain text below — which is the interface
 *  this bot is supposed to have anyway.
 * ---------------------------------------------------------------------- */
async function showToday(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.today(got.state, got.day), keysOr(V.taskKeys(got.day)));
}

async function showOpen(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(
    got.day.openScored.length
      ? "باقي من عاداتك الأساسية — اضغط ما أنجزته، أو حدّها الأدنى:"
      : "كل عاداتك الأساسية مسجّلة اليوم ✅",
    keysOr(V.openKeys(got.state)),
  );
}

/* --- the half nobody asked for, asked for ----------------------------- *
 *  The same sweep the scheduled coach runs, with a floor under it: a button
 *  pressed that answers with silence reads as a dead bot, so `coachReply`
 *  always has something to say even when `coachNote` would not.
 * ---------------------------------------------------------------------- */
async function showCoach(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  const note = coachReply(got.state);
  const out = note.more
    ? `${note.text}\n\n${"‏"}و${note.more} ملاحظة أخرى — أرسل «يومي» لترى الصورة كاملة.`
    : note.text;
  return ctx.reply(out, keysOr(V.coachKeys(note.actions)));
}

async function showWeek(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(weekReview(got.state));
}

async function showFocus(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.focusStand(got.state), keysOr(V.focusKeys(got.state.focus?.run || null)));
}

/* Keyed on the *folded* word, because that is what the lookup is given:
   «مساعدة» and «مساعده» and «الآن» and «الان» have to be one entry each, and
   folding the keys here is what keeps the table readable while making them
   so. A bare «اليوم» is the day and not a task — the table is consulted
   first, deliberately. */
const WORDS = new Map(
  [
    ["مساعدة", (ctx) => ctx.reply(V.HELP)],
    ["يومي", showToday],
    ["اليوم", showToday],
    ["الآن", showOpen],
    ["باقي", showOpen],
    ["صباح", (ctx) => sendMorning(ctx.chat.id)],
    ["مساء", (ctx) => sendEvening(ctx.chat.id)],
    ["المدرب", showCoach],
    ["مدرب", showCoach],
    ["وجهني", showCoach],
    ["الأسبوع", showWeek],
    ["مراجعة", showWeek],
    ["القائمة", (ctx) => ctx.reply("اختر:", { reply_markup: V.menuKeys() })],
    ["قائمة", (ctx) => ctx.reply("اختر:", { reply_markup: V.menuKeys() })],
  ].map(([word, run]) => [fold(word), run]),
);

bot.command(["start", "help"], (ctx) => ctx.reply(V.HELP, { reply_markup: V.menuKeys() }));
bot.command("today", showToday);
bot.command("now", showOpen);
bot.command("coach", showCoach);
bot.command("week", showWeek);
bot.command("focus", showFocus);
bot.command("menu", (ctx) => ctx.reply("اختر:", { reply_markup: V.menuKeys() }));
bot.command("find", async (ctx) => {
  const q = ctx.match?.trim();
  if (!q) return ctx.reply("اكتب ما تبحث عنه بعد الأمر. مثال: /find التسويف");
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(search(got.state, q));
});
bot.command("morning", (ctx) => sendMorning(ctx.chat.id));
bot.command("evening", (ctx) => sendEvening(ctx.chat.id));

/* --- the buttons ------------------------------------------------------- */
bot.on("callback_query:data", async (ctx) => {
  /* Split into parts and not a pair: the breaker's tag buttons carry
     `holdt:<badId>:<tag>`, and a two-way split would read the tag as part of
     the id. Telegram caps the whole string at 64 bytes, which three short
     fields stay well inside. */
  const [kind, arg, extra] = String(ctx.callbackQuery.data).split(":");
  /* Answered first and always: an unanswered callback leaves the button
     spinning on the phone for a minute, which reads as a dead bot. */
  await ctx.answerCallbackQuery().catch(() => {});

  if (kind === "undo") {
    const before = undos.get(arg);
    if (!before) {
      return ctx.reply("⚠️ ما عندي نسخة أرجّعها — البوت أُعيد تشغيله بعدها.");
    }
    undos.delete(arg);
    /* No undo button under an undo: a second one would be a redo wearing the
       same label. */
    return apply(ctx, (s) => ({ ...act.undo(s, before), before: null }), V.undone);
  }
  if (kind === "tick") return tickAndMaybeRead(ctx, arg, false);
  if (kind === "tiny") return tickAndMaybeRead(ctx, arg, true);
  if (kind === "task") return apply(ctx, (s) => act.finishTask(s, arg), V.savedTaskDone);
  if (kind === "water") {
    return apply(ctx, (s) => act.drinkWater(s, Number(arg) || 1), V.savedWater);
  }
  if (kind === "read") {
    const pages = Number(arg) || 0;
    /* «لاحقًا» is a real answer and writes nothing. The habit is already
       ticked by the time this keyboard exists, so skipping the pages must
       never undo the completion — the same rule the app's modal keeps. */
    if (!pages) return ctx.reply("تمام — العادة مسجّلة، والصفحات تُسجّل وقت ما تجي.");
    return apply(ctx, (s) => act.logReading(s, { pages }), V.savedReading);
  }
  if (kind === "top") return apply(ctx, (s) => act.flagToday(s, arg), V.savedTop);
  if (kind === "prep") return apply(ctx, (s) => act.pickTomorrow(s, arg), V.savedPrep);

  if (kind === "focus") return runFocus(ctx, arg);
  if (kind === "unt") return apply(ctx, (s) => act.untickHabit(s, arg), V.savedUntick);

  /* The three questions whose answer needs a payload bigger than a button. */
  if (kind === "gset") {
    const want = asked.get(arg);
    if (!want) return stale(ctx);
    asked.delete(arg);
    return apply(ctx, (s) => act.moveGoal(s, extra, want), V.savedGoal);
  }
  if (kind === "uabs") {
    const want = asked.get(arg);
    if (!want) return stale(ctx);
    asked.delete(arg);
    return apply(ctx, (s) => act.markAbsence(s, extra), V.savedAbsence);
  }
  if (kind === "umrk") {
    const want = asked.get(arg);
    if (!want) return stale(ctx);
    asked.delete(arg);
    return apply(ctx, (s) => act.addMark(s, extra, want), V.savedMark);
  }

  /* «لاحقًا». The entry is re-armed, never the rendered text — a water nudge
     deferred at eleven must say what is left at noon. */
  if (kind === "snooze" || kind === "snz") {
    let mins = 60;
    try {
      const now = await readLife();
      if (now) mins = botShape(now.bot).snooze;
    } catch {
      /* The disk is unreachable; the default is still a sane later. */
    }
    if (!snoozer.arm(arg, mins)) {
      return ctx.reply("⚠️ ما عاد عندي هذا التذكير — البوت أُعيد تشغيله بعده.");
    }
    return ctx.reply(`⏰ تمام، أذكّرك بعد ${mins} دقيقة.`);
  }

  /* The breaker, in two taps. The first names which habit, the second names
     the trigger — and the second is skippable, because a hold logged with no
     trigger is still a hold the mirror counts. */
  if (kind === "hold" || kind === "fall") {
    return ctx.reply(
      kind === "fall" ? "ما الذي سبقها؟" : "ما المحرّك الذي صمدت أمامه؟",
      { reply_markup: V.tagKeys(kind, arg, URGE_TAGS) },
    );
  }
  if (kind === "holdt") {
    return apply(ctx, (s) => act.holdUrge(s, arg, { tag: extra || "" }), V.savedHold);
  }
  if (kind === "fallt") {
    return apply(ctx, (s) => act.fallUrge(s, arg, { tag: extra || "" }), V.savedFall);
  }

  if (kind === "menu") {
    if (arg === "today") return showToday(ctx);
    if (arg === "open") return showOpen(ctx);
    if (arg === "coach") return showCoach(ctx);
    if (arg === "week") return showWeek(ctx);
    if (arg === "focus") return showFocus(ctx);
    return ctx.reply(V.HELP);
  }
});

/* --- a tick, and the question it opens -------------------------------- *
 *  A habit can feed the library, and the pages are asked for *after* the
 *  tick has landed — never before. The reward has to be paid and the habit
 *  has to stay done whether or not a number follows, which is the one rule
 *  the app's own reading modal keeps.
 * ---------------------------------------------------------------------- */
async function tickAndMaybeRead(ctx, id, tiny) {
  let out;
  try {
    out = await withState((s) => act.tickHabit(s, id, tiny));
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "صار خطأ غير متوقّع. ما كُتب شي.";
    console.error("tick: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);
  const keys = out.before ? V.undoKeys(armUndo(out.before)) : null;
  await ctx.reply(V.savedHabit(out), keys ? { reply_markup: keys } : undefined);
  if (out.book) {
    await ctx.reply(`📖 «${out.book.title}» — كم صفحة؟`, { reply_markup: V.readKeys() });
  }
  return undefined;
}

/* --- a day that is already closed -------------------------------------- *
 *  Forgetting to tick is not the same as not having done it. `tickOn` goes
 *  through `setDayDone`, which is the same function «عدّل أمس» uses on the
 *  routine screen, and the streak is recomputed from the rows afterwards
 *  rather than nudged — a counter adjusted by hand is a second opinion about
 *  the same archive.
 * ---------------------------------------------------------------------- */
function editPastDay(ctx, found, back, on) {
  if (found.length > 1) {
    return ctx.reply(
      "أيّ واحدة؟ (ويُسجَّل في ذلك اليوم، لا في اليوم)",
      { reply_markup: V.habitKeys(found, on ? "tick" : "untick") },
    );
  }
  const date = act.backKey(back);
  return apply(ctx, (s) => act.tickOn(s, found[0].id, date, on), V.savedDayEdit);
}

/* --- the focus desk's buttons and words ------------------------------- */
function runFocus(ctx, what) {
  if (what === "start") return apply(ctx, (s) => act.startFocus(s, {}), V.savedFocusStart);
  if (what === "break") return apply(ctx, (s) => act.breakFocus(s, {}), V.savedFocusBreak);
  if (what === "pause") return apply(ctx, (s) => act.pauseFocus(s), V.savedFocusPause);
  if (what === "resume") return apply(ctx, (s) => act.resumeFocus(s), V.savedFocusResume);
  if (what === "stop") return apply(ctx, (s) => act.stopFocus(s), V.savedFocusStop);
  if (what === "settle") return apply(ctx, (s) => act.settleFocus(s), V.savedFocusSettle);
  if (what === "drop") return apply(ctx, (s) => act.dropFocus(s), V.savedFocusDrop);
  return showFocus(ctx);
}

/* --- the sentence ----------------------------------------------------- */
bot.on("message:text", (ctx) => handleText(ctx));

async function handleText(ctx) {
  const raw = ctx.message.text.trim();
  const word = WORDS.get(fold(raw.replace(/^\//, "")));
  if (word) return word(ctx);

  const said = parse(raw);

  if (said.kind === "expense") {
    return apply(ctx, (s) => act.addExpense(s, said), (o) =>
      V.savedExpense(o.row, o.balance),
    );
  }
  if (said.kind === "income") {
    return apply(ctx, (s) => act.addIncome(s, said), (o) =>
      V.savedIncome(o.row, o.balance),
    );
  }
  if (said.kind === "water") {
    return apply(ctx, (s) => act.drinkWater(s, said.count), V.savedWater);
  }
  if (said.kind === "habit") {
    /* A habit is matched against the live roster, so the match needs the
       state — read here without writing. One open match ticks; several ask
       which, because guessing between «صلاة العصر وأذكار» and «أذكار
       المساء» is how a tick lands on the wrong row. */
    const got = await dayOrTell(ctx);
    if (!got) return;
    const found = act.findHabits(got.state.habits, said.query);
    if (!found.length) {
      return ctx.reply(`⚠️ ما لقيت عادة تشبه «${said.query}». أرسل «باقي» لتشوف المفتوح.`);
    }
    /* «أمس تمت صلاة العصر» rewrites one archive row and moves nothing else:
       today's habits do not shift, because today is a different day and the
       whole value of a hard boundary is that it holds. */
    if (said.back) return editPastDay(ctx, found, said.back, true);
    const open = found.filter((h) => !h.done);
    if (!open.length) {
      return ctx.reply(`✅ «${found[0].label}» مسجّلة أصلاً اليوم.`);
    }
    if (open.length > 1) {
      const kb = new InlineKeyboard();
      for (const h of open.slice(0, 6)) kb.text(`✓ ${h.label}`, `tick:${h.id}`).row();
      return ctx.reply("أيّ واحدة؟", { reply_markup: kb });
    }
    return apply(ctx, (s) => act.tickHabit(s, open[0].id), V.savedHabit);
  }
  if (said.kind === "reading") {
    return apply(
      ctx,
      (s) => act.logReading(s, { pages: said.pages, back: said.back }),
      V.savedReading,
    );
  }
  if (said.kind === "focus") {
    if (said.act === "status") return showFocus(ctx);
    if (said.act === "log") {
      return apply(
        ctx,
        (s) => act.logFocus(s, { minutes: said.minutes, label: said.label, back: said.back }),
        V.savedFocusLog,
      );
    }
    if (said.act === "start") {
      return apply(
        ctx,
        (s) => act.startFocus(s, { minutes: said.minutes, label: said.label }),
        V.savedFocusStart,
      );
    }
    if (said.act === "break") {
      return apply(ctx, (s) => act.breakFocus(s, { minutes: said.minutes }), V.savedFocusBreak);
    }
    return runFocus(ctx, said.act);
  }
  if (said.kind === "urge") {
    /* Which habit is matched against the live list, so it needs the state —
       read here without writing. One match logs after the tag question; more
       than one asks which, because a fall recorded against the wrong habit
       resets the wrong counter. */
    const got = await dayOrTell(ctx);
    if (!got) return;
    const pick = act.oneBad(got.state, said.query);
    if (pick.refused) return ctx.reply("⚠️ " + pick.refused);
    if (pick.many) {
      return ctx.reply("أيّ واحدة؟", { reply_markup: V.badKeys(pick.many, said.act) });
    }
    return ctx.reply(
      said.act === "fall" ? "ما الذي سبقها؟" : "ما المحرّك الذي صمدت أمامه؟",
      { reply_markup: V.tagKeys(said.act, pick.bad.id, URGE_TAGS) },
    );
  }
  if (said.kind === "reflect") {
    return apply(ctx, (s) => act.reflect(s, said), V.savedReflect);
  }
  if (said.kind === "event") {
    return apply(ctx, (s) => act.addEvent(s, said), V.savedEvent);
  }
  if (said.kind === "search") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    return ctx.reply(search(got.state, said.query));
  }
  if (said.kind === "untick") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    /* Matched against what is actually ticked: «ألغِ صلاة» with three
       prayers ticked is a question, not a guess at which one. */
    const found = act
      .findHabits(got.state.habits, said.query)
      .filter((h) => (said.back ? true : h.done));
    if (!found.length) {
      return ctx.reply(`⚠️ ما لقيت عادة مؤشّرة تشبه «${said.query}».`);
    }
    if (said.back) return editPastDay(ctx, found, said.back, false);
    if (found.length > 1) {
      return ctx.reply("أيّ واحدة؟", { reply_markup: V.habitKeys(found, "untick") });
    }
    return apply(ctx, (s) => act.untickHabit(s, found[0].id), V.savedUntick);
  }
  if (said.kind === "goal") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const found = act.findGoals(got.state.goals, said.query);
    if (!found.length) {
      return ctx.reply(`⚠️ ما لقيت هدفًا مفتوحًا يشبه «${said.query}».`);
    }
    const want = { value: said.value, add: said.add };
    if (found.length > 1) {
      return ctx.reply("أيّ هدف؟", {
        reply_markup: V.goalKeys(found, hold(want)),
      });
    }
    return apply(ctx, (s) => act.moveGoal(s, found[0].id, want), V.savedGoal);
  }
  if (said.kind === "uni") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const found = act.findCourses(got.state.uni, said.query);
    if (!found.length) {
      const all = act.findCourses(got.state.uni, "");
      if (!all.length) return ctx.reply("⚠️ ما فيه مواد في مكتب الجامعة بعد.");
      return ctx.reply(
        `⚠️ ما لقيت مادة تشبه «${said.query}». أيّ واحدة؟`,
        {
          reply_markup:
            said.act === "absence"
              ? V.courseKeys(all, "uabs", hold({ at: Date.now() }))
              : V.courseKeys(all, "umrk", hold(said)),
        },
      );
    }
    if (found.length > 1) {
      return ctx.reply("أيّ مادة؟", {
        reply_markup:
          said.act === "absence"
            ? V.courseKeys(found, "uabs", hold({ at: Date.now() }))
            : V.courseKeys(found, "umrk", hold(said)),
      });
    }
    if (said.act === "absence") {
      return apply(ctx, (s) => act.markAbsence(s, found[0].id), V.savedAbsence);
    }
    return apply(ctx, (s) => act.addMark(s, found[0].id, said), V.savedMark);
  }
  /* A question is answered and nothing is written — which is the whole point
     of reading it as one. An unrecognised subject is not filed as a task
     either: a question misfiled in the inbox is a row he then has to go and
     delete. */
  if (said.kind === "ask") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const text = answer(got.state, said);
    if (text) return ctx.reply(text, keysOr(answerKeys(said.topic, got)));
    return ctx.reply(
      "❓ ما فهمت السؤال. اسأل عن: المال، الانتظام، القراءة، التركيز، الصلاة، المهام، الجامعة، الأهداف.",
      { reply_markup: V.menuKeys() },
    );
  }
  if (said.kind === "task") {
    return apply(ctx, (s) => act.addTask(s, said), V.savedTask);
  }
  return ctx.reply(V.HELP);
}

/* An answer that can be acted on comes with the action under it. An answer
   that cannot — the prayer times, the money — comes bare, because a keyboard
   under a number nobody can change is a keyboard that teaches him the
   buttons mean nothing. */
function answerKeys(topic, got) {
  if (topic === "habits") return V.openKeys(got.state);
  if (topic === "tasks") return V.taskKeys(got.day);
  if (topic === "water") return V.openKeys(got.state, 0);
  if (topic === "read") return V.readKeys();
  if (topic === "focus") return V.focusKeys(got.state.focus?.run || null);
  return null;
}

/* --- the briefs ------------------------------------------------------- */
/* Both briefs are reached two ways — the timer and a word typed by hand —
   so the failure is reported to the chat rather than only to the log: a
   brief asked for and silently missing is indistinguishable from a bot that
   has stopped. */
async function brief(chatId, build) {
  let state;
  try {
    state = await readLife();
  } catch (e) {
    console.error("brief: " + (e && e.message ? e.message : e));
    await bot.api
      .sendMessage(chatId, "⚠️ " + (e instanceof DiskError ? e.message : "ما قدرت أقرأ الحالة."))
      .catch(() => {});
    return;
  }
  if (!state) {
    await bot.api.sendMessage(chatId, "⚠️ ما فيه نسخة على القرص بعد.").catch(() => {});
    return;
  }
  const { text, keys } = build(state, act.dayAt(state));
  await bot.api.sendMessage(chatId, text, keysOr(keys));
}

const sendMorning = (chatId) =>
  brief(chatId, (state, day) => ({
    text: V.morning(state, day, quoteFor(state.quotes, state.date)),
    keys: V.taskKeys(day),
  }));

const sendEvening = (chatId) =>
  brief(chatId, (state, day) => ({
    text: V.evening(state, day),
    keys: V.openKeys(state),
  }));

/* --- a voice note ------------------------------------------------------ *
 *  The fastest way to record something is to say it, and the moment worth
 *  recording is almost always a moment with a hand full of something else.
 *
 *  It ends where `parse` begins: the transcript goes down the *same* path a
 *  typed message does, so every trigger, every question and every
 *  confirmation works unchanged and there is no second grammar to keep in
 *  step. The text is echoed back first, because a transcriber that misheard
 *  «صرفت ثلاثين» as «صرفت ثلاثمئة» must be caught by eye and not by a
 *  ledger that is quietly wrong — and the undo button under the write is
 *  then one tap away.
 * ---------------------------------------------------------------------- */
bot.on(["message:voice", "message:audio"], async (ctx) => {
  const file = ctx.message.voice || ctx.message.audio;
  let text;
  try {
    text = await readVoice(ctx.api, file.file_id);
  } catch (e) {
    const msg =
      e instanceof VoiceError ? e.message : "ما قدرت أقرأ المقطع الصوتي.";
    console.error("voice: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  await ctx.reply(`🎙️ «${text}»`);
  /* Replayed through the ordinary text handler by swapping the message's
     own text in — so there is exactly one route from a sentence to a row,
     whether it was typed or spoken. */
  ctx.message.text = text;
  return handleText(ctx);
});

/* Anything grammY could not hand to a handler. Reported and swallowed: a bot
   that exits on one bad update is a bot that is down until somebody
   notices. */
bot.catch((err) => console.error("bot: " + (err?.message || err)));

/* --- the schedule ------------------------------------------------------ *
 *  Everything the bot sends unprompted comes off `state.bot`, which the
 *  control hub in the app edits and the sync server keeps on disk. There is
 *  no command channel between the screen and this process and there must not
 *  be one: the screen saves, the disk changes, and the tick below notices.
 *
 *  A minute is the resolution. It costs one local HTTP read, it is how the
 *  bot learns about an edit made thirty seconds ago, and it is also how the
 *  day rollover arrives — `Scheduler.sync` re-arms only when the plan it
 *  depends on has actually moved, so the other 1,439 ticks do nothing.
 * ---------------------------------------------------------------------- */
const TICK = 60 * 1000;

async function deliver(entry) {
  let state;
  try {
    state = await readLife();
  } catch (e) {
    console.error("reminder: " + (e && e.message ? e.message : e));
    return;
  }
  if (!state) return;

  if (entry.kind === "morning") return sendMorning(CONFIG.chatId);
  if (entry.kind === "evening") return sendEvening(CONFIG.chatId);

  /* Built from the state at the moment it fires, never at the moment it was
     armed: a water nudge armed at 07:00 that still says «باقي ٨ أكواب» at
     three in the afternoon has stopped being true. `null` means there is
     nothing worth saying, and silence is the right output for that. */
  const said = textFor(entry, state);
  if (!said) return;

  const keys =
    said.water
      ? new InlineKeyboard().text("💧 + كاس ماء", "water:1")
      : said.tasks
        ? V.taskKeys(act.dayAt(state))
        : said.coach
          ? V.coachKeys(said.actions)
          : said.habits
            ? V.habitKeys(said.habits, "tick")
            : new InlineKeyboard();

  /* Every unprompted message gets «لاحقًا». A nudge that cannot be deferred
     is one you mute, and a muted reminder takes the rest of the schedule
     with it. The weekly review is the exception — it is a report, and
     deferring a report by an hour means nothing. */
  if (!said.weekly) {
    V.snoozeKey(keys.row(), snoozer.hold(entry), botShape(state.bot).snooze);
  }

  await bot.api.sendMessage(CONFIG.chatId, said.text, keysOr(keys)).catch((e) => {
    console.error("reminder send: " + (e?.message || e));
  });
}

/* --- the bell ---------------------------------------------------------- *
 *  A round that finished while the laptop was shut has to be written down by
 *  somebody, and the only process awake is this one. So the bell settles the
 *  run first and announces it second — `settleFocus` is the same function the
 *  screen's own settle goes through, so the session row, the cycle counter
 *  and the armed break come out identical either way.
 *
 *  A refusal here is the ordinary case and not an error: if a window was
 *  open, it already settled the round, and this write finds nothing left to
 *  do. The bell still rings, because the round still ended.
 * ---------------------------------------------------------------------- */
async function ringBell(what) {
  let settled = null;
  try {
    settled = await withState((s) => act.settleFocus(s));
  } catch (e) {
    console.error("bell settle: " + (e && e.message ? e.message : e));
  }
  const lines = [`‏🔔 ${what.label} انتهت.`];
  if (settled && !settled.refused && settled.minutes) {
    lines.push(`‏سُجّلت ${settled.minutes} دقيقة.`);
  }
  lines.push(
    what.phase === "focus"
      ? "‏خُذ راحتك — الراحة نصف الطريقة."
      : "‏جولة أخرى؟",
  );
  /* The keyboard is read off the state after the settle, so it offers the
     break that was actually armed rather than the one that would have
     been. */
  let run = null;
  try {
    const now = await readLife();
    run = now?.focus?.run || null;
  } catch {
    /* The disk is unreachable; the bell is still worth sending without
       buttons under it. */
  }
  await bot.api
    .sendMessage(CONFIG.chatId, lines.join("\n"), keysOr(V.focusKeys(run)))
    .catch((e) => console.error("bell send: " + (e?.message || e)));
}

const scheduler = new Scheduler(deliver);
/* The focus bell is its own timer and not one of the scheduler's, because it
   is armed off `run.endAt` — an absolute moment that only exists once a
   round was started, and one that moves on every pause while the day's plan
   does not move at all. */
const bell = new Bell(ringBell);
/* «لاحقًا» re-arms the *entry*, so the message is rebuilt from the day as it
   stands when it finally fires — a water nudge deferred at eleven says what
   is left at noon. */
const snoozer = new Snoozer(deliver);
let lastTickAt = 0;

async function tick() {
  lastTickAt = Date.now();
  let state;
  try {
    state = await readLife();
  } catch {
    /* The sync server is down or restarting. The timers already armed keep
       their moments, and the next tick that succeeds re-reads the schedule.
       Nothing is written and nothing is lost. */
    return;
  }
  if (!state) return;
  if (scheduler.sync(state)) {
    console.log(
      `          ${new Date().toTimeString().slice(0, 8)}  ${scheduler.armed.length} تذكير مسلّح`,
    );
  }
  bell.sync(state);
}

const ticker = setInterval(tick, TICK);
ticker.unref?.();
tick();

/* --- the status strip's one endpoint ----------------------------------- */
const startedAt = Date.now();
const health = startHealth({
  read: () => ({
    since: startedAt,
    chat: maskId(CONFIG.chatId),
    api: CONFIG.apiRoot,
    armed: scheduler.armed.length,
    next: scheduler.armed[0]?.when?.getTime() ?? null,
    checkedAt: lastTickAt,
  }),
  /* The test ping. It proves the whole chain in one tap — this process is
     alive, the token works, the network reaches Telegram, and the chat id is
     the right one — which is four different failures a single message rules
     out at once. */
  ping: async () => {
    await bot.api.sendMessage(
      CONFIG.chatId,
      "‏🧪 رسالة تجريبية من لوحة التحكم. القناة تعمل.",
    );
    return true;
  },
});

const bye = async () => {
  clearInterval(ticker);
  scheduler.clear();
  bell.clear();
  snoozer.clear();
  try {
    health.close();
  } catch {}
  await bot.stop().catch(() => {});
  process.exit(0);
};
process.once("SIGINT", bye);
process.once("SIGTERM", bye);

console.log("2027 Life OS — بوت تيليجرام");
console.log("  الحالة من  " + CONFIG.origin);
console.log("  يردّ على   " + CONFIG.chatId);
console.log("  الحالة على " + BOT_API);
/* The schedule is deliberately absent from this banner. It lives in
   `state.bot` and is edited on the «بوت تيليجرام» screen, so printing a copy
   of it at startup would be a second answer that goes stale the first time
   he changes a time — the tick below logs what it actually armed. */

/* Long polling, not a webhook: no public URL, no tunnel, no TLS to terminate
   on a home machine, and nothing listening on a port that did not need to be
   open. `drop_pending_updates` because a message sent while the bot was down
   is almost always stale, and an expense from yesterday logged onto today is
   worse than one that was lost. */
bot.start({
  drop_pending_updates: true,
  onStart: () => {
    console.log("  ✓ يستقبل");
    /* Telegram's own command menu, so the slash commands are discoverable
       without reading the help once. Registered after the loop is up and
       never awaited before it: a failure here is cosmetic, and a bot that
       refuses to start because a menu would not register is a bot down over
       nothing. */
    bot.api
      .setMyCommands(V.COMMANDS)
      .catch((e) => console.warn("القائمة ما سُجّلت: " + (e?.message || e)));
  },
}).catch((e) => {
  /* The first call grammY makes is getMe and the loop after it is
     getUpdates, and each way they fail has its own answer — a name that will
     not resolve, a token Telegram does not know, a second copy on the same
     token. Unhandled, every one of them arrives as the same stack trace with
     the answer buried in it. */
  const cause = String(e?.cause?.code || e?.message || e);
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|ETIMEDOUT/.test(cause)) {
    console.error(
      `\nتعذّر حلّ اسم ${new URL(CONFIG.apiRoot).hostname} — الشبكة تحجب تيليجرام.`,
    );
    console.error("البوت سليم؛ المشكلة بين هذا الجهاز وتيليجرام.");
    console.error("جرّب شبكة أخرى، أو ضع عنوان وسيط في TELEGRAM_API_ROOT داخل .env.\n");
  } else if (/401/.test(cause)) {
    console.error("\nتيليجرام رفض التوكن. خُذ واحدًا جديدًا من @BotFather.\n");
  } else if (/409/.test(cause)) {
    /* Two long-polling clients on one token take turns stealing each other's
       updates, and Telegram ends the older one with a 409. The symptom
       otherwise is a bot that answers every other message, so this names it
       rather than letting it read as a generic failure — and this copy is
       the one that stops, which is correct: the newest start wins. */
    console.error("\nنسخة أخرى من البوت تعمل على نفس التوكن. هذه النسخة توقّفت.");
    console.error("نسخة واحدة فقط — أوقف الباقي ثم شغّل واحدة.\n");
  } else {
    console.error("\nالبوت توقّف: " + (e?.message || e) + "\n");
  }
  process.exit(1);
});
