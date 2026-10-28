/* --- الإعدادات، والملف الوحيد الذي تُقرأ منه --------------------------- *
 *  نفس `services/telegram-bot/config.js` بالحرف: `.env` بجانب هذا الملف،
 *  يُقرأ يدوياً لا بـ dotenv — المستودع لا يثبّت ما يمكنه تجنّب تثبيته،
 *  وقارئ مكتوب بالید يفشل بالعربية ويقول أي سطر تعثّر فيه.
 *
 *  لا شيء هنا يُرفَع أبداً. `.gitignore` يحمل `.env`، و`.env.example` هي
 *  النسخة التي تُرفَع: التوكن فيها قيمة وهمية لا أكثر.
 * --------------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");

function parseEnv(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const at = s.indexOf("=");
    if (at <= 0) continue;
    const key = s.slice(0, at).trim();
    let val = s.slice(at + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function readEnv() {
  let fromFile = {};
  try {
    fromFile = parseEnv(readFileSync(join(HERE, ".env"), "utf8"));
  } catch {
    /* لا .env على الإطلاق — ليس قاتلاً هنا، `configProblems` أدناه هو ما يبلّغ عنه. */
  }
  return { ...fromFile, ...process.env };
}

const env = readEnv();
const pick = (key, fallback) => {
  const v = env[key];
  return v === undefined || v === "" ? fallback : v;
};

export const CONFIG = {
  /* من @BotFather. السرّ الوحيد هنا. بوت مستقل تماماً عن بوت Life OS —
     توكن مختلف، ملف .env مختلف، لا علاقة بينهما غير أنهما يقرآن نفس
     القرص عبر نفس الخادم. */
  token: pick("TELEGRAM_GYM_BOT_TOKEN", ""),
  chatId: String(pick("TELEGRAM_GYM_CHAT_ID", "")).trim(),
  origin: String(pick("LIFEOS_ORIGIN", "http://127.0.0.1:47615")).replace(/\/+$/, ""),
  seconds: Number(pick("POLL_SECONDS", "30")) || 30,
  apiRoot: String(pick("TELEGRAM_API_ROOT", "https://api.telegram.org")).replace(/\/+$/, ""),
  /* الساعة اليومية الوحيدة التي يتكلّم فيها بلا أن يُسأل — تحقّق ركود
     الوزن وتذكّر بما بقي من حصص الأسبوع. فارغة = مطفأة. */
  reminderAt: String(pick("REMINDER_AT", "20:30")).trim(),
  /* المراجعة الأسبوعية — يوم واحد، لا كل يوم، لنفس سبب أن اليوم الذي
     تصل فيه أسبوعياً ليس اليوم الذي يصل فيه التذكير اليومي أعلاه. ٥ =
     الجمعة، أول يوم عطلة هنا ونهاية أسبوع تدريب معقولة. فارغة = مطفأة. */
  weeklyReviewAt: String(pick("WEEKLY_REVIEW_AT", "20:00")).trim(),
  weeklyReviewDay: Number(pick("WEEKLY_REVIEW_DAY", "5")),
};

export function configProblems() {
  const bad = [];
  if (!CONFIG.token) bad.push("TELEGRAM_GYM_BOT_TOKEN مفقود — خُذه من @BotFather.");
  if (!/^\d+:[\w-]+$/.test(CONFIG.token) && CONFIG.token) {
    bad.push("TELEGRAM_GYM_BOT_TOKEN لا يشبه توكن بوت (الشكل: 123456789:AA...).");
  }
  if (!CONFIG.chatId) {
    bad.push("TELEGRAM_GYM_CHAT_ID مفقود — أرسل رسالة للبوت ثم شغّل: npm run whoami");
  } else if (!/^-?\d+$/.test(CONFIG.chatId)) {
    bad.push("TELEGRAM_GYM_CHAT_ID لازم يكون رقمًا.");
  }
  return bad;
}
