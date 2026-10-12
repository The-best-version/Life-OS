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
import { Scheduler, textFor, quoteFor } from "./reminders.js";
import { startHealth, maskId } from "./health.js";
import { BOT_API } from "../../src/state/life-state.mjs";

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
      ? "باقي من عاداتك الأساسية — اضغط ما أنجزته:"
      : "كل عاداتك الأساسية مسجّلة اليوم ✅",
    keysOr(V.openKeys(got.state)),
  );
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
  ].map(([word, run]) => [fold(word), run]),
);

bot.command(["start", "help"], (ctx) => ctx.reply(V.HELP));
bot.command("today", showToday);
bot.command("now", showOpen);
bot.command("morning", (ctx) => sendMorning(ctx.chat.id));
bot.command("evening", (ctx) => sendEvening(ctx.chat.id));

/* --- the buttons ------------------------------------------------------- */
bot.on("callback_query:data", async (ctx) => {
  const [kind, arg] = String(ctx.callbackQuery.data).split(":");
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
  if (kind === "tick") return apply(ctx, (s) => act.tickHabit(s, arg), V.savedHabit);
  if (kind === "tiny") return apply(ctx, (s) => act.tickHabit(s, arg, true), V.savedHabit);
  if (kind === "task") return apply(ctx, (s) => act.finishTask(s, arg), V.savedTaskDone);
  if (kind === "water") {
    return apply(ctx, (s) => act.drinkWater(s, Number(arg) || 1), V.savedWater);
  }
});

/* --- the sentence ----------------------------------------------------- */
bot.on("message:text", async (ctx) => {
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
  if (said.kind === "task") {
    return apply(ctx, (s) => act.addTask(s, said), V.savedTask);
  }
  return ctx.reply(V.HELP);
});

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
        : null;
  await bot.api.sendMessage(CONFIG.chatId, said.text, keysOr(keys)).catch((e) => {
    console.error("reminder send: " + (e?.message || e));
  });
}

const scheduler = new Scheduler(deliver);
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
  onStart: () => console.log("  ✓ يستقبل"),
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
