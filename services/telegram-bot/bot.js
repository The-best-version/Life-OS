#!/usr/bin/env node
/* --- 2027 Life OS, from the phone -------------------------------------- */
import "./dns-fallback.js";
import { Bot, InlineKeyboard, InputFile } from "grammy";
import { CONFIG, configProblems } from "./config.js";
import { withState, readLife, DiskError } from "./lifeos-client.js";
import { parse, fold } from "./parse.js";
import * as act from "./actions.js";
import * as V from "./views.js";
import { Scheduler, Bell, Snoozer, textFor, quoteFor } from "./reminders.js";
import { coachReply } from "./insight.js";
import {
  answer,
  weekReview,
  search,
  reviewCard,
  reviewFull,
  noteCue,
} from "./ask.js";
import { readVoice, VoiceError } from "./voice.js";
import {
  runAgent,
  applyPlan,
  agentCall,
  AgentError,
  agentReady,
  HISTORY_KEEP,
} from "./agent.js";
import { line, notesWord, pagesWord } from "./fmt.js";
import { startHealth, maskId } from "./health.js";
import {
  BOT_API,
  URGE_TAGS,
  botShape,
  rows,
  dueNotes,
} from "../../src/state/life-state.mjs";

const problems = configProblems();
if (problems.length) {
  console.error("\nالبوت ما بدأ. الإعدادات ناقصة:\n");
  for (const p of problems) console.error("  • " + p);
  console.error("\nانسخ services/telegram-bot/.env.example إلى .env واملأه.\n");
  process.exit(1);
}

const bot = new Bot(CONFIG.token, { client: { apiRoot: CONFIG.apiRoot } });

bot.use(async (ctx, next) => {
  const chat = ctx.chat?.id;
  const from = ctx.from?.id;
  if (String(chat) !== CONFIG.chatId || String(from) !== CONFIG.chatId) {
    if (chat !== undefined) console.warn(`رُفض: chat=${chat} from=${from}`);
    return;
  }
  await next();
});

const UNDO_KEEP = 40;
const undos = new Map();
let undoSeq = 0;
function armUndo(before) {
  const token = String(++undoSeq);
  undos.set(token, before);
  while (undos.size > UNDO_KEEP) undos.delete(undos.keys().next().value);
  return token;
}

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
  if (out.next) bell.sync(out.next);
  const keys = out.before ? V.undoKeys(armUndo(out.before)) : null;
  return ctx.reply(say(out), keys ? { reply_markup: keys } : undefined);
}

const keysOr = (kb) =>
  kb && kb.inline_keyboard.some((r) => r.length) ? { reply_markup: kb } : undefined;

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

async function showCoach(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  const note = coachReply(got.state);
  const out = note.more
    ? `${note.text}\n\n${line(`و${notesWord(note.more)} أخرى — أرسل «يومي» لترى الصورة كاملة.`)}`
    : note.text;
  return ctx.reply(out, keysOr(V.coachKeys(note.actions)));
}

async function showWeek(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(weekReview(got.state));
}

const weeklyDrafts = new Map();

async function showEmergency(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.emergencyCard(got.state, got.day), {
    reply_markup: V.emergencyKeys(got.state),
  });
}

async function showPrayers(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.prayerCard(got.state));
}

async function startWeeklyPlan(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  const draft = weeklyDrafts.get(ctx.chat.id) || {};
  weeklyDrafts.set(ctx.chat.id, draft);
  return ctx.reply(V.weeklyPlanPrompt(got.state, draft), {
    reply_markup: V.weeklyPlanKeys(got.state, draft),
  });
}

async function showSchedule(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.scheduleCard(got.state));
}

async function startShutdown(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.shutdownCard(got.state, got.day, "rate"), {
    reply_markup: V.shutdownRateKeys(),
  });
}

async function startBrainDump(ctx) {
  const text = ctx.match?.trim();
  if (!text) {
    return ctx.reply(
      "🎙️ أرسل رسالة صوتية فيها كل ما تريد تفريغه (مصاريف، ماء، قراءة، مهام، تقييم)، أو اكتب نصاً حراً بعد الأمر:\nمثال: /dump صرفت 40 غداء وشربت 2 ماء وقرأت 15 صفحة وسجل لي مهمة تحضير العرض",
    );
  }
  return askAgent(ctx, text);
}

/* --- المساعد الذكي ------------------------------------------------------ *
 *  مدخل صريح لا بديل صامت: `parse.js` يبقى أول من يرى كل رسالة، ويلتقط
 *  المعتاد مجانًا وفورًا وبلا إنترنت. هذا يُستدعى بالاسم وحده — لأن كل
 *  نداء هنا يكلّف توكنز، ولأن معرفة «متى أتكلّم مع نموذج» حقّ للمستخدم
 *  لا تفصيلة داخلية.
 *
 *  المحادثة في الذاكرة فقط، مثل ناقل التراجع وناقل التأجيل: سياقُ حوارٍ
 *  لا شيء مكتوب عن اليوم، ولا يستحق قرصًا ولا يُحفظ عبر إعادة التشغيل.
 * ---------------------------------------------------------------------- */
const chats = new Map();

async function askAgent(ctx, said) {
  const text = String(said || "").trim();
  if (!text) {
    return ctx.reply(
      "اكتب سؤالك بعد الكلمة. مثال:\n«مساعد سجّل لي ٢٠ صفحة قراءة وقل لي وش باقي اليوم»",
    );
  }
  if (!agentReady()) {
    return ctx.reply(
      "⚠️ المساعد الذكي مطفأ. ضع ANTHROPIC_API_KEY في services/telegram-bot/.env لتشغيله.",
    );
  }
  const got = await dayOrTell(ctx);
  if (!got) return;

  /* النداء يأخذ ثوانيَ، والصمت فيها يُقرأ كعطل. */
  try {
    await ctx.replyWithChatAction("typing");
  } catch {
    /* مؤشّر الكتابة رفاهية — فشله لا يمنع الجواب */
  }

  let out;
  try {
    out = await runAgent(got.state, text, { history: chats.get(ctx.chat.id) || [] });
  } catch (e) {
    const msg = e instanceof AgentError ? e.message : "صار خطأ غير متوقّع في المساعد.";
    console.error("agent: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);

  if (out.messages) chats.set(ctx.chat.id, out.messages.slice(-HISTORY_KEEP));

  /* دور بلا كتابة = جواب وحده، بلا قرص ولا زرّ تراجع. */
  if (!out.plan || !out.plan.length) return ctx.reply(out.text);

  /* دور فيه كتابة: الخطة تُعاد تزامنيًا على الحالة الطازجة داخل القفل،
     وتنال نفس زرّ التراجع الذي تناله كل كتابة أخرى في هذا البوت. */
  return apply(
    ctx,
    (s) => applyPlan(s, out.plan),
    (o) =>
      [out.text, ...(o.skipped || []).map((r) => "⚠️ " + r)].filter(Boolean).join("\n"),
  );
}


async function showFocus(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.focusStand(got.state), keysOr(V.focusKeys(got.state.focus?.run || null)));
}

// دالة عرض الأهداف
async function showGoals(ctx, horizon) {
  // حماية: إذا تم تمرير دالة next من المكتبة، نجعلها quarter افتراضياً
  if (typeof horizon !== "string") horizon = "quarter";
  
  const got = await dayOrTell(ctx);
  if (!got) return;
  const report = act.goalReport(got.state, horizon);
  
  if (ctx.callbackQuery) {
    return ctx.editMessageText(report.text, { 
      parse_mode: "HTML", 
      reply_markup: report.kb 
    }).catch(() => {});
  }
  
  return ctx.reply(report.text, { 
    parse_mode: "HTML", 
    reply_markup: report.kb 
  });
}

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
    ["مكتبتي", showShelf],
    ["المكتبة", showShelf],
    ["الرف", showShelf],
    ["راجع", showReview],
    ["المراجعة", showReview],
    ["الأسبوع", showWeek],
    ["مراجعة", showWeek],
    ["القائمة", (ctx) => ctx.reply("اختر:", { reply_markup: V.menuKeys() })],
    ["قائمة", (ctx) => ctx.reply("اختر:", { reply_markup: V.menuKeys() })],
    // إصلاح: تغليف دالة الأهداف بدالة سهمية لمنع تمرير next
    ["الأهداف", (ctx) => showGoals(ctx, "quarter")],
    ["اهداف", (ctx) => showGoals(ctx, "quarter")],
    ["أهدافي", (ctx) => showGoals(ctx, "quarter")],
    ["طوارئ", showEmergency],
    ["طواري", showEmergency],
    ["الطوارئ", showEmergency],
    ["الطواري", showEmergency],
    ["صلاتي", showPrayers],
    ["الصلوات", showPrayers],
    ["أوقات الصلاة", showPrayers],
    ["اوقات الصلاة", showPrayers],
    ["مواقيت الصلاة", showPrayers],
    ["تخطيط الأسبوع", startWeeklyPlan],
    ["تخطيط الاسبوع", startWeeklyPlan],
    ["خطط الأسبوع", startWeeklyPlan],
    ["خطط الاسبوع", startWeeklyPlan],
    ["وش علي", showSchedule],
    ["وش علي اليوم", showSchedule],
    ["وش علي الفترة الجاية", showSchedule],
    ["وش علي الفتره الجايه", showSchedule],
    ["وش عندي", showSchedule],
    ["وش عندي اليوم", showSchedule],
    ["وش عندي الفترة الجاية", showSchedule],
    ["وش عندي الفتره الجايه", showSchedule],
    ["وش وراي", showSchedule],
    ["وش وراي اليوم", showSchedule],
    ["وش القادم", showSchedule],
    ["وش الجاي", showSchedule],
    ["الفترة الجاية", showSchedule],
    ["الفتره الجايه", showSchedule],
    ["الفترة القادمة", showSchedule],
    ["الفتره القادمه", showSchedule],
    ["جدول اليوم", showSchedule],
    ["تقويمي", showSchedule],
    ["التقويم", showSchedule],
    ["مواعيدي", showSchedule],
    ["مواعيد", showSchedule],
    ["مواعيد اليوم", showSchedule],
    ["جدولي", showSchedule],
    ["محاضراتي", showSchedule],
    ["محاضرات", showSchedule],
    ["جامعتي", showSchedule],
    ["إقفال اليوم", startShutdown],
    ["اقفال اليوم", startShutdown],
    ["إغلاق اليوم", startShutdown],
    ["اقفال", startShutdown],
    ["تقييم اليوم", startShutdown],
    ["تقييم", startShutdown],
    ["روتين العشاء", startShutdown],
    ["تقييم الروتين", startShutdown],
    ["تفريغ", startBrainDump],
    ["سجل لي", startBrainDump],
  ].map(([word, run]) => [fold(word), run]),
);

bot.command(["start", "help"], (ctx) => ctx.reply(V.HELP, { reply_markup: V.menuKeys(CONFIG.webUrl) }));
bot.command(["app", "open", "site"], (ctx) => {
  const url = CONFIG.webUrl || "https://github.com/The-best-version/Life-OS";
  const hasHttps = url.startsWith("https://");
  const kb = new InlineKeyboard();
  if (hasHttps) {
    kb.webApp("🚀 فتح التطبيق داخل تيليجرام", url).row().url("🌐 فتح في المتصفح الخارجي", url);
  } else {
    kb.url("🌐 فتح التطبيق", url);
  }
  return ctx.reply(
    `📱 *تطبيق Life OS*\n\n` +
    `🔗 الرابط المباشر:\n${url}\n\n` +
    `💡 *طريقة التثبيت على الآيباد والجوال (PWA):*\n` +
    `1. افتح الرابط في متصفح Safari (على الآيباد/الآيفون) أو Chrome.\n` +
    `2. اضغط على زر المشاركة (*Share* ⎋).\n` +
    `3. اختر *إضافة إلى الصفحة الرئيسية (Add to Home Screen)*.\n` +
    `4. سيفتح معك التطبيق بملء الشاشة وبدون شريط المتصفح كأنه تطبيق أصلي! ⚡`,
    { parse_mode: "Markdown", reply_markup: kb }
  );
});
bot.command(["backup", "export"], async (ctx) => {
  try {
    const raw = await readLife();
    const str = JSON.stringify(raw, null, 2);
    const buf = Buffer.from(str, "utf8");
    const filename = `life-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    await ctx.replyWithDocument(new InputFile(buf, filename), {
      caption: `📦 *نسخة احتياطية كاملة من بياناتك (${raw.habits?.length || 0} عادة، ${raw.tasks?.length || 0} مهمة)*\n\n` +
        `💡 *طريقة النقل للآيباد / الجوال:*\n` +
        `1. احفظ هذا الملف على جهازك.\n` +
        `2. افتح التطبيق في الآيباد واضغط على *الإعدادات ⚙️* (أعلى الشاشة).\n` +
        `3. اضغط زر *استيراد نسخة احتياطية* واختر هذا الملف.\n` +
        `✨ فوراً ستنتقل كل مهامك وعاداتك وتفاصيل يومك كاملة!`,
      parse_mode: "Markdown",
    });
  } catch (e) {
    ctx.reply("❌ تعذّر تصدير النسخة الاحتياطية: " + (e?.message || e));
  }
});
bot.command("today", showToday);
bot.command("now", showOpen);
bot.command("coach", showCoach);
bot.command(["schedule", "events", "calendar", "uni"], showSchedule);
bot.command(["shutdown", "closing", "night"], startShutdown);
bot.command(["dump", "braindump"], startBrainDump);
bot.command("emergency", showEmergency);
bot.command("core", showEmergency);
bot.command(["prayers", "prayer"], showPrayers);
bot.command(["plan_week", "planweek"], startWeeklyPlan);
bot.command("ai", (ctx) => askAgent(ctx, ctx.match || ""));
bot.command("week", showWeek);
bot.command("focus", showFocus);
bot.command("books", showShelf);
bot.command("review", showReview);
bot.command("menu", (ctx) => ctx.reply("اختر:", { reply_markup: V.menuKeys(CONFIG.webUrl) }));
bot.command("find", async (ctx) => {
  const q = ctx.match?.trim();
  if (!q) return ctx.reply("اكتب ما تبحث عنه بعد الأمر. مثال: /find التسويف");
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(search(got.state, q));
});
bot.command("goals", (ctx) => showGoals(ctx, "quarter"));
bot.command("morning", (ctx) => sendMorning(ctx.chat.id));
bot.command("evening", (ctx) => sendEvening(ctx.chat.id));

bot.on("callback_query:data", async (ctx) => {
  const [kind, arg, extra] = String(ctx.callbackQuery.data).split(":");
  await ctx.answerCallbackQuery().catch(() => {});

  if (kind === "grp") {
    return showGoals(ctx, arg);
  }
  if (kind === "undo") {
    const before = undos.get(arg);
    if (!before) {
      return ctx.reply("⚠️ ما عندي نسخة أرجّعها — البوت أُعيد تشغيله بعدها.");
    }
    undos.delete(arg);
    return apply(ctx, (s) => ({ ...act.undo(s, before), before: null }), V.undone);
  }
  if (kind === "tick") return tickAndMaybeRead(ctx, arg, false);
  if (kind === "tiny") return tickAndMaybeRead(ctx, arg, true);
  if (kind === "task") return apply(ctx, (s) => act.finishTask(s, arg), V.savedTaskDone);
  if (kind === "task_postpone") {
    return apply(ctx, (s) => act.postponeTask(s, arg), V.savedTaskPostponed);
  }
  if (kind === "sched") {
    return showSchedule(ctx);
  }
  if (kind === "morning") {
    if (arg === "pick_tasks") {
      const got = await dayOrTell(ctx);
      if (!got) return;
      return ctx.reply("🎯 اختر مهمة لرفعها إلى قائمة اليوم:", {
        reply_markup: V.morningTaskPickerKeys(got.state),
      });
    }
    if (arg === "add_task") {
      return apply(ctx, (s) => act.promoteTaskToToday(s, extra), V.savedTaskPromoted);
    }
  }
  if (kind === "water") {
    return apply(ctx, (s) => act.drinkWater(s, Number(arg) || 1), V.savedWater);
  }
  if (kind === "read") {
    const pages = Number(arg) || 0;
    if (!pages) return ctx.reply("تمام — العادة مسجّلة، والصفحات تُسجّل وقت ما تجي.");
    return apply(ctx, (s) => act.logReading(s, { pages }), V.savedReading);
  }
  if (kind === "rdb") {
    const want = asked.get(arg);
    if (!want) return stale(ctx);
    asked.delete(arg);
    return logPages(ctx, { pages: want.pages, back: want.back, bookId: extra });
  }
  if (kind === "nbk") {
    const want = asked.get(arg);
    if (!want) return stale(ctx);
    asked.delete(arg);
    return logPages(ctx, { addTitle: want.title, pages: want.pages, back: want.back });
  }
  if (kind === "bst") {
    if (!asked.has(arg)) return stale(ctx);
    asked.delete(arg);
    return apply(ctx, (s) => act.startBook(s, extra), V.savedBookStart);
  }
  if (kind === "bfn") {
    if (!asked.has(arg)) return stale(ctx);
    asked.delete(arg);
    return finishAndAsk(ctx, extra);
  }
  if (kind === "rate") {
    return apply(ctx, (s) => act.rateBook(s, arg, Number(extra) || 0), V.savedBookRate);
  }
  if (kind === "nlist") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const book = rows(got.state.books).find((b) => b.id === arg);
    if (!book) return ctx.reply("⚠️ هذا الكتاب لم يعد على الرف.");
    return ctx.reply(V.noteList(book));
  }
  if (kind === "nact") {
    const want = asked.get(arg);
    if (!want) return stale(ctx);
    asked.delete(arg);
    return apply(ctx, (s) => act.addTask(s, { label: want.label }), V.savedTask);
  }
  if (kind === "rvs") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const book = rows(got.state.books).find((b) => b.id === arg);
    const note = book ? rows(book.notes).find((n) => n.id === extra) : null;
    if (!note) return ctx.reply("⚠️ هذي النقطة لم تعد موجودة.");
    return ctx.reply(reviewFull(book, note), {
      reply_markup: V.reviewKeys(book, note, false),
    });
  }
  if (kind === "rvk" || kind === "rvf") {
    return reviewOne(ctx, arg, extra, kind === "rvk");
  }
  if (kind === "rev") return showReview(ctx);

  if (kind === "top") return apply(ctx, (s) => act.flagToday(s, arg), V.savedTop);
  if (kind === "prep") return apply(ctx, (s) => act.pickTomorrow(s, arg), V.savedPrep);

  if (kind === "focus") return runFocus(ctx, arg);
  if (kind === "unt") return apply(ctx, (s) => act.untickHabit(s, arg), V.savedUntick);

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

  if (kind === "snooze" || kind === "snz") {
    let mins = 60;
    try {
      const now = await readLife();
      if (now) mins = botShape(now.bot).snooze;
    } catch {}
    if (!snoozer.arm(arg, mins)) {
      return ctx.reply("⚠️ ما عاد عندي هذا التذكير — البوت أُعيد تشغيله بعده.");
    }
    return ctx.reply(`⏰ تمام، أذكّرك بعد ${mins} دقيقة.`);
  }

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

  if (kind === "emg") {
    if (arg === "view") return showEmergency(ctx);
    if (arg === "on") return apply(ctx, (s) => act.triggerEmergency(s, { active: true }), V.savedEmergency);
    if (arg === "off") return apply(ctx, (s) => act.triggerEmergency(s, { active: false }), V.savedEmergency);
    if (arg === "rescue") return apply(ctx, (s) => act.triggerEmergency(s, { active: true, completeTinyCore: true }), V.savedEmergency);
  }

  if (kind === "wp") {
    const draft = weeklyDrafts.get(ctx.chat.id) || {};
    const got = await dayOrTell(ctx);
    if (!got) return;
    if (arg === "pick_habit") {
      return ctx.reply("⭐ اختر العادة المحورية لهذا الأسبوع:", {
        reply_markup: V.weeklyHabitPickerKeys(got.state),
      });
    }
    if (arg === "set_h") {
      draft.keystoneHabitId = extra;
      weeklyDrafts.set(ctx.chat.id, draft);
      return ctx.reply("✅ تم اختيار العادة المحورية!\n\n" + V.weeklyPlanPrompt(got.state, draft), {
        reply_markup: V.weeklyPlanKeys(got.state, draft),
      });
    }
    if (arg === "pick_goal") {
      return ctx.reply("🎯 اختر هدف 2030 للتركيز عليه هذا الأسبوع:", {
        reply_markup: V.weeklyGoalPickerKeys(got.state),
      });
    }
    if (arg === "set_g") {
      draft.focusGoalId = extra;
      weeklyDrafts.set(ctx.chat.id, draft);
      return ctx.reply("✅ تم ربط الأسبوع بهدف 2030!\n\n" + V.weeklyPlanPrompt(got.state, draft), {
        reply_markup: V.weeklyPlanKeys(got.state, draft),
      });
    }
    if (arg === "back") {
      return ctx.reply(V.weeklyPlanPrompt(got.state, draft), {
        reply_markup: V.weeklyPlanKeys(got.state, draft),
      });
    }
    if (arg === "commit") {
      weeklyDrafts.delete(ctx.chat.id);
      return apply(ctx, (s) => act.saveWeeklyReview(s, draft), V.savedWeeklyPlan);
    }
  }

  if (kind === "focus" && arg === "refresh") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    return ctx
      .editMessageText(V.focusStand(got.state), keysOr(V.focusKeys(got.state.focus?.run || null)))
      .catch(() => {});
  }

  if (kind === "shut") {
    if (arg === "start") return startShutdown(ctx);
    if (arg === "rate") {
      const stars = Number(extra) || 5;
      const got = await dayOrTell(ctx);
      if (!got) return;
      return ctx.reply(
        `⭐ تقييم اليوم: ${"★".repeat(stars)}\n\n` + V.shutdownCard(got.state, got.day, "distraction"),
        { reply_markup: V.shutdownDistractionKeys() },
      );
    }
    if (arg === "dist") {
      const note = extra || "";
      await withState((s) => act.reflect(s, { field: "distraction", note })).catch(() => {});
      const got = await dayOrTell(ctx);
      if (!got) return;
      const inbox = rows(got.state.tasks).filter((t) => !t.today && !t.done);
      return ctx.reply(
        `📝 المشتت: «${note}»\n\n` + V.shutdownCard(got.state, got.day, "prep"),
        { reply_markup: V.shutdownPrepKeys(inbox) },
      );
    }
    if (arg === "prep") {
      const res = await withState((s) => act.pickTomorrow(s, extra)).catch(() => null);
      const got = await dayOrTell(ctx);
      if (!got) return;
      const inbox = rows(got.state.tasks).filter((t) => !t.today && !t.done);
      const pickedName = res?.picked?.text ? `«${res.picked.text}»` : "";
      return ctx.reply(
        `🌙 تم رفع المهمة للغد: ${pickedName}\n\nاختر مهمة أخرى أو اضغط إنهاء الإقفال:`,
        { reply_markup: V.shutdownPrepKeys(inbox) },
      );
    }
    if (arg === "done") {
      const got = await dayOrTell(ctx);
      if (!got) return;
      return ctx.reply(V.shutdownCard(got.state, got.day, "done"));
    }
  }

  if (kind === "menu") {
    if (arg === "today") return showToday(ctx);
    if (arg === "open") return showOpen(ctx);
    if (arg === "coach") return showCoach(ctx);
    if (arg === "week") return showWeek(ctx);
    if (arg === "focus") return showFocus(ctx);
    if (arg === "books") return showShelf(ctx);
    if (arg === "prayers") return showPrayers(ctx);
    if (arg === "schedule") return showSchedule(ctx);
    return ctx.reply(V.HELP);
  }
});

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

async function logPages(ctx, args) {
  const run = args.addTitle
    ? (s) => act.addAndRead(s, { title: args.addTitle, pages: args.pages, back: args.back })
    : (s) => act.logReading(s, args);
  let out;
  try {
    out = await withState(run);
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "صار خطأ غير متوقّع. ما كُتب شي.";
    console.error("reading: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);
  const keys = out.before ? V.undoKeys(armUndo(out.before)) : null;
  if (out.kind === "book") {
    return ctx.reply(V.savedBookAdd(out), keys ? { reply_markup: keys } : undefined);
  }
  await ctx.reply(V.savedReading(out), keys ? { reply_markup: keys } : undefined);
  if (!out.kept) {
    await ctx.reply(V.askNote(out), { reply_markup: V.noteAskKeys(out.book) });
  }
  return undefined;
}

async function reviewOne(ctx, bookId, noteId, kept) {
  let out;
  try {
    out = await withState((s) => act.reviewNote(s, bookId, noteId, kept));
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "صار خطأ غير متوقّع. ما كُتب شي.";
    console.error("review: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);
  const keys = kept
    ? V.noteActKeys(hold({ label: `طبّق: ${out.note.text}`.slice(0, 120) }))
    : null;
  await ctx.reply(V.savedReview(out), keys ? { reply_markup: keys } : undefined);
  if (out.left > 0) {
    const on = out.next.date || undefined;
    const due = dueNotes(rows(out.next.books), on);
    if (due.length) await sendReview(ctx.chat.id, due[0], due.length - 1, on);
  }
  return undefined;
}

async function finishAndAsk(ctx, id) {
  let out;
  try {
    out = await withState((s) => act.finishBook(s, id));
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "صار خطأ غير متوقّع. ما كُتب شي.";
    console.error("finish: " + (e && e.message ? e.message : e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);
  const keys = out.before ? V.undoKeys(armUndo(out.before)) : null;
  await ctx.reply(V.savedBookFinish(out), keys ? { reply_markup: keys } : undefined);
  await ctx.reply("كيف تقيّمه؟", { reply_markup: V.rateKeys(out.book.id) });
  return undefined;
}

async function showShelf(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  return ctx.reply(V.shelf(got.state));
}

async function showReview(ctx) {
  const got = await dayOrTell(ctx);
  if (!got) return;
  const books = rows(got.state.books);
  const due = dueNotes(books, got.state.date);
  if (!due.length) {
    const soon = nextNote(books);
    return ctx.reply(
      [
        line("✅ ما فيه نقطة مستحقّة الآن."),
        soon
          ? line(`أقرب مراجعة ${soon.note.due} — «${soon.book.title}».`)
          : line("أرسل «فائدة …» بعد قراءتك، وتبدأ الدورة."),
      ].join("\n"),
    );
  }
  return sendReview(ctx.chat.id, due[0], due.length - 1, got.state.date);
}

function nextNote(books) {
  let best = null;
  for (const b of rows(books)) {
    for (const n of rows(b.notes)) {
      if (!n || !n.text || !n.due) continue;
      if (!best || n.due < best.note.due) best = { book: b, note: n };
    }
  }
  return best;
}

function sendReview(chatId, row, left, on) {
  const { hidden } = noteCue(row.note.text);
  return bot.api
    .sendMessage(chatId, reviewCard(row.book, row.note, left, on), {
      reply_markup: V.reviewKeys(row.book, row.note, hidden),
    })
    .catch((e) => console.error("review send: " + (e?.message || e)));
}

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

bot.on("message:text", (ctx) => handleText(ctx));

async function handleText(ctx) {
  const raw = ctx.message.text.trim();
  const word = WORDS.get(fold(raw.replace(/^\//, "")));
  if (word) return word(ctx);

  /* نداء المساعد بالاسم، قبل القواعد. «مساعدة» وحدها تبقى المساعدة
     القديمة أعلاه — fold يحوّل ة إلى ه فتبقى الكلمتان مختلفتين. */
  const toAgent = agentCall(raw);
  if (toAgent !== null) return askAgent(ctx, toAgent);

  if (raw.startsWith("إنجاز:") || raw.startsWith("انجاز:")) {
    const val = raw.replace(/^إ?نجاز:\s*/, "").trim();
    const draft = weeklyDrafts.get(ctx.chat.id) || {};
    draft.win = val;
    weeklyDrafts.set(ctx.chat.id, draft);
    const got = await dayOrTell(ctx);
    if (!got) return;
    return ctx.reply(`✨ تم تسجيل إنجاز الأسبوع: «${val}»\n\n` + V.weeklyPlanPrompt(got.state, draft), {
      reply_markup: V.weeklyPlanKeys(got.state, draft),
    });
  }
  if (raw.startsWith("درس:") || raw.startsWith("درس الأسبوع:") || raw.startsWith("درس الاسبوع:")) {
    const val = raw.replace(/^درس(\s*الأ?سبوع)?:\s*/, "").trim();
    const draft = weeklyDrafts.get(ctx.chat.id) || {};
    draft.lesson = val;
    weeklyDrafts.set(ctx.chat.id, draft);
    const got = await dayOrTell(ctx);
    if (!got) return;
    return ctx.reply(`🪶 تم تسجيل درس الأسبوع: «${val}»\n\n` + V.weeklyPlanPrompt(got.state, draft), {
      reply_markup: V.weeklyPlanKeys(got.state, draft),
    });
  }

  const said = parse(raw);

  if (said.kind === "schedule") {
    return showSchedule(ctx);
  }

  if (said.kind === "task_postpone") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const list = rows(got.state.tasks).filter((t) => t.today && !t.done);
    const found = list.filter((t) => fold(t.text).includes(fold(said.query)));
    if (!found.length) {
      return ctx.reply(`⚠️ ما لقيت مهمة نشطة تشبه «${said.query}».`);
    }
    if (found.length > 1) {
      const kb = new InlineKeyboard();
      for (const t of found) kb.text(`⏱️ ${t.text}`, `task_postpone:${t.id}`).row();
      return ctx.reply("أي مهمة تريد تأجيلها للغد؟", { reply_markup: kb });
    }
    return apply(ctx, (s) => act.postponeTask(s, found[0].id), V.savedTaskPostponed);
  }

  if (said.kind === "task_promote") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const list = rows(got.state.tasks).filter((t) => !t.today && !t.done);
    const found = list.filter((t) => fold(t.text).includes(fold(said.query)));
    if (!found.length) {
      return ctx.reply(`⚠️ ما لقيت مهمة في الوارد تشبه «${said.query}».`);
    }
    if (found.length > 1) {
      const kb = new InlineKeyboard();
      for (const t of found) kb.text(`🎯 ${t.text}`, `morning:add_task:${t.id}`).row();
      return ctx.reply("أي مهمة تريد رفعها لليوم؟", { reply_markup: kb });
    }
    return apply(ctx, (s) => act.promoteTaskToToday(s, found[0].id), V.savedTaskPromoted);
  }

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
  if (said.kind === "sleep") {
    return apply(ctx, (s) => act.logSleep(s, said.hours, said.note), V.savedSleep);
  }
  if (said.kind === "habit") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    const found = act.findHabits(got.state.habits, said.query);
    if (!found.length) {
      return ctx.reply(`⚠️ ما لقيت عادة تشبه «${said.query}». أرسل «باقي» لتشوف المفتوح.`);
    }
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
    if (!said.query) return logPages(ctx, { pages: said.pages, back: said.back });
    const got = await dayOrTell(ctx);
    if (!got) return;
    const found = act.findBooks(got.state.books, said.query);
    if (!found.length) {
      return ctx.reply(
        line(`📚 ما لقيت «${said.query}» على الرف. أضيفه وأسجّل عليه ${pagesWord(said.pages)}؟`),
        {
          reply_markup: V.newBookKeys(
            hold({ title: said.query, pages: said.pages, back: said.back }),
            said.query,
          ),
        },
      );
    }
    if (found.length > 1) {
      return ctx.reply("أيّ كتاب؟", {
        reply_markup: V.bookKeys(found, "rdb", hold({ pages: said.pages, back: said.back })),
      });
    }
    return logPages(ctx, { pages: said.pages, back: said.back, bookId: found[0].id });
  }
  if (said.kind === "book") {
    const got = await dayOrTell(ctx);
    if (!got) return;
    if (said.act === "add") {
      return apply(ctx, (s) => act.addBook(s, said), V.savedBookAdd);
    }
    const found = act.findBooks(got.state.books, said.query);
    if (!found.length) {
      if (said.act === "start") {
        return apply(
          ctx,
          (s) => act.addBook(s, { title: said.query, status: "reading" }),
          V.savedBookAdd,
        );
      }
      return ctx.reply(`📚 ما لقيت «${said.query}» على الرف. أرسل «أضف كتاب ${said.query}» أولًا.`);
    }
    if (found.length > 1) {
      return ctx.reply("أيّ كتاب؟", {
        reply_markup: V.bookKeys(found, said.act === "start" ? "bst" : "bfn", hold({ at: Date.now() })),
      });
    }
    if (said.act === "start") {
      return apply(ctx, (s) => act.startBook(s, found[0].id), V.savedBookStart);
    }
    return finishAndAsk(ctx, found[0].id);
  }
  if (said.kind === "note") {
    return apply(ctx, (s) => act.addNote(s, { body: said.body, back: said.back }), V.savedNote);
  }
  if (said.kind === "lesson") {
    return apply(ctx, (s) => act.setLesson(s, { body: said.body }), V.savedLesson);
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
  if (said.kind === "ask") {
    if (said.topic === "schedule") return showSchedule(ctx);
    const got = await dayOrTell(ctx);
    if (!got) return;
    const text = answer(got.state, said);
    if (text) return ctx.reply(text, keysOr(answerKeys(said.topic, got)));
    return ctx.reply(
      "❓ ما فهمت السؤال. اسأل عن: المواعيد، الماء، المال، الانتظام، القراءة، الفوائد، التركيز، الصلاة، المهام، الجامعة، الأهداف.",
      { reply_markup: V.menuKeys() },
    );
  }
  if (said.kind === "task") {
    return apply(ctx, (s) => act.addTask(s, said), V.savedTask);
  }
  return ctx.reply(V.HELP);
}

function answerKeys(topic, got) {
  if (topic === "habits") return V.openKeys(got.state);
  if (topic === "tasks") return V.taskKeys(got.day);
  if (topic === "water") return V.openKeys(got.state, 0);
  if (topic === "read") return V.readKeys();
  if (topic === "notes") return new InlineKeyboard().text("🔁 راجع نقطة", "rev:now");
  if (topic === "focus") return V.focusKeys(got.state.focus?.run || null);
  return null;
}

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
    keys: V.morningKeys(state, day),
  }));

const sendEvening = (chatId) =>
  brief(chatId, (state, day) => ({
    text: V.evening(state, day),
    keys: V.openKeys(state),
  }));

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
  if (agentReady()) {
    const words = text.split(/\s+/).length;
    const isMultiIntent =
      words >= 6 &&
      (text.includes(" و") || text.includes("،") || text.includes("سجل") || text.includes("مع"));
    if (isMultiIntent) {
      return askAgent(ctx, text);
    }
  }
  ctx.message.text = text;
  return handleText(ctx);
});

bot.catch((err) => console.error("bot: " + (err?.message || err)));

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

  if (entry.kind === "nudge") {
    const said = V.goalNudge(state, act.dayAt(state));
    if (!said) return;
    const keys = said.keys ? said.keys : new InlineKeyboard();
    V.snoozeKey(keys.row(), snoozer.hold(entry), botShape(state.bot).snooze);
    await bot.api
      .sendMessage(CONFIG.chatId, said.text, keysOr(keys))
      .catch((e) => console.error("nudge send: " + (e?.message || e)));
    return;
  }

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
            : said.review
              ? V.reviewKeys(
                  { id: said.review.bookId },
                  { id: said.review.noteId },
                  noteCue(said.review.text).hidden,
                )
              : new InlineKeyboard();

  if (!said.weekly) {
    V.snoozeKey(keys.row(), snoozer.hold(entry), botShape(state.bot).snooze);
  }

  await bot.api.sendMessage(CONFIG.chatId, said.text, keysOr(keys)).catch((e) => {
    console.error("reminder send: " + (e?.message || e));
  });
}

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
  let run = null;
  try {
    const now = await readLife();
    run = now?.focus?.run || null;
  } catch {}
  await bot.api
    .sendMessage(CONFIG.chatId, lines.join("\n"), keysOr(V.focusKeys(run)))
    .catch((e) => console.error("bell send: " + (e?.message || e)));
}

const scheduler = new Scheduler(deliver);
const bell = new Bell(ringBell);
const snoozer = new Snoozer(deliver);
let lastTickAt = 0;

async function tick() {
  lastTickAt = Date.now();
  let state;
  try {
    state = await readLife();
  } catch {
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
  ping: async () => {
    await bot.api.sendMessage(
      CONFIG.chatId,
      "‏🧪 رسالة تجريبية من لوحة التحكم. القناة تعمل.",
    );
    return true;
  },
});

let isStopping = false;
const bye = async () => {
  if (isStopping) return;
  isStopping = true;
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

async function runBotWithAutoRetry() {
  while (!isStopping) {
    try {
      await bot.start({
        drop_pending_updates: true,
        onStart: () => {
          console.log("  ✓ يستقبل");
          bot.api
            .setMyCommands(V.COMMANDS)
            .catch((e) => console.warn("القائمة ما سُجّلت: " + (e?.message || e)));
        },
      });
      break;
    } catch (e) {
      if (isStopping) break;
      const cause = String(e?.cause?.code || e?.message || e);
      if (/401/.test(cause)) {
        console.error("\nتيليجرام رفض التوكن. خُذ واحدًا جديدًا من @BotFather.\n");
        process.exit(1);
      }
      if (/409/.test(cause)) {
        console.error("\nنسخة أخرى من البوت تعمل على نفس التوكن. هذه النسخة توقّفت.");
        process.exit(1);
      }
      console.warn(`[Bot Watcher] انقطع الاتصال أو أفاق الجهاز من النوم (${cause}) — إعادة المحاولة خلال 5 ثوانٍ...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

runBotWithAutoRetry();