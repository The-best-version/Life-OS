#!/usr/bin/env node
/* --- النادي، من الجوال — بوت مستقل تماماً عن بوت Life OS ------------------ *
 *  توكن مختلف، محادثة قد تكون مختلفة، ملف .env مختلف. الشيء الوحيد
 *  المشترك هو القرص: كلاهما يقرأ ويكتب عبر `local-sync-server.js` نفسه،
 *  بنفس بروتوكول المراجعة الذي يحمي كل كاتب آخر له.
 * --------------------------------------------------------------------- */
import "./dns-fallback.js";
import { Bot } from "grammy";
import { CONFIG, configProblems } from "./config.js";
import { withState, readLife, DiskError } from "./gym-client.js";
import { route, statusText, weekReviewText, nutritionStatusText, HELP_TEXT, dailyCheck } from "./actions.js";

const problems = configProblems();
if (problems.length) {
  console.error("\nالبوت ما بدأ. الإعدادات ناقصة:\n");
  for (const p of problems) console.error("  • " + p);
  console.error("\nانسخ services/telegram-gym-bot/.env.example إلى .env واملأه.\n");
  process.exit(1);
}

const bot = new Bot(CONFIG.token, { client: { apiRoot: CONFIG.apiRoot } });

/* نفس بوّابة Life OS: لا يردّ على أحد غير هذه المحادثة. */
bot.use(async (ctx, next) => {
  const chat = ctx.chat?.id;
  const from = ctx.from?.id;
  if (String(chat) !== CONFIG.chatId || String(from) !== CONFIG.chatId) {
    if (chat !== undefined) console.warn(`رُفض: chat=${chat} from=${from}`);
    return;
  }
  await next();
});

bot.command("start", (ctx) => ctx.reply(HELP_TEXT));

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  /* الحالة والمساعدة قراءة بلا كتابة — لا تمرّان عبر withState أبداً. */
  let state;
  try {
    state = await readLife();
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "تعذّر الاتصال بالقرص.";
    return ctx.reply("⚠️ " + msg);
  }
  if (!state) {
    return ctx.reply("⚠️ ما فيه نسخة على القرص بعد. افتح 2027 Life OS مرة واحدة على الحاسب أولاً.");
  }

  const dry = route(state, text);
  if (dry.help) return ctx.reply(HELP_TEXT);
  if (dry.status) return ctx.reply(statusText(state));
  if (dry.week) return ctx.reply(weekReviewText(state));
  if (dry.nutrition) return ctx.reply(nutritionStatusText(state));
  if (dry.unknown) return ctx.reply(dry.refused || "ما فهمت. أرسل «مساعدة» لترى الأمثلة.");

  /* كتابة فعلية — تُعاد من الصفر داخل withState على نسخة طازجة من القرص،
     لأن النسخة التي قرأناها فوق قد تكون تجاوزها وصول آخر بين القراءتين. */
  let out;
  try {
    out = await withState((fresh) => route(fresh, text));
  } catch (e) {
    const msg = e instanceof DiskError ? e.message : "صار خطأ غير متوقّع. ما كُتب شي.";
    console.error("apply: " + (e?.message || e));
    return ctx.reply("⚠️ " + msg);
  }
  if (out.refused) return ctx.reply("⚠️ " + out.refused);
  return ctx.reply(out.reply);
});

bot.catch((err) => console.error("bot error:", err.error || err));

/* --- الفحص اليومي — صامت حين لا يوجد ما يُقال ----------------------------- *
 *  نفس قاعدة `advise()` في بوت Life OS: رسالة تصل كل مساء بنصّ عام هي
 *  إشعار يُتعلَّم تمريره بلا قراءة. ساعة واحدة في `.env`، وفارغة تعني
 *  مطفأة.
 * --------------------------------------------------------------------- */
function armDailyCheck() {
  if (!CONFIG.reminderAt || !/^\d{1,2}:\d{2}$/.test(CONFIG.reminderAt)) return;
  const [hh, mm] = CONFIG.reminderAt.split(":").map(Number);
  let lastFired = "";
  setInterval(async () => {
    const now = new Date();
    const key = now.toDateString();
    if (now.getHours() !== hh || now.getMinutes() !== mm || lastFired === key) return;
    lastFired = key;
    try {
      const state = await readLife();
      if (!state) return;
      const text = dailyCheck(state);
      if (text) await bot.api.sendMessage(CONFIG.chatId, "🔔 " + text);
    } catch (e) {
      console.error("daily check: " + (e?.message || e));
    }
  }, 30_000);
}

/* --- المراجعة الأسبوعية — يوم واحد في الأسبوع، لا كل يوم ------------------ *
 *  نفس بناء `armDailyCheck` أعلاه بالحرف، على يوم محدَّد بدل كل يوم —
 *  ومقصود ألا تتشارك المؤقّت نفسه، لأن تغيير ساعة التذكير اليومي يجب ألا
 *  يحرّك المراجعة الأسبوعية معه وبالعكس. لا تُسكَت أبداً: انظر تعليق
 *  `weekReviewText`.
 * ------------------------------------------------------------------- */
function armWeeklyReview() {
  if (!CONFIG.weeklyReviewAt || !/^\d{1,2}:\d{2}$/.test(CONFIG.weeklyReviewAt)) return;
  const [hh, mm] = CONFIG.weeklyReviewAt.split(":").map(Number);
  const day = CONFIG.weeklyReviewDay;
  let lastFired = "";
  setInterval(async () => {
    const now = new Date();
    const key = now.toDateString();
    if (now.getDay() !== day || now.getHours() !== hh || now.getMinutes() !== mm || lastFired === key) return;
    lastFired = key;
    try {
      const state = await readLife();
      if (!state) return;
      await bot.api.sendMessage(CONFIG.chatId, weekReviewText(state));
    } catch (e) {
      console.error("weekly review: " + (e?.message || e));
    }
  }, 30_000);
}

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err?.message || err);
});

armDailyCheck();
armWeeklyReview();

async function startPolling() {
  while (true) {
    try {
      await bot.start({
        onStart: (info) => {
          console.log(`بوت النادي شغّال باسم @${info.username}. أرسل «مساعدة» لترى الأمثلة.`);
        },
      });
    } catch (err) {
      console.error("انقطع الاتصال، إعادة المحاولة خلال 5 ثوانٍ:", err?.message || err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

startPolling();
