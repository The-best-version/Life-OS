#!/usr/bin/env node
/* --- which chat is mine ------------------------------------------------
 *  The gate in bot.js needs a numeric chat id, and there is no way to learn
 *  it from inside a bot that refuses to answer anybody. So this asks
 *  Telegram directly: send the bot any message, then run this.
 *
 *  A script and not a `/whoami` command, deliberately. A command that
 *  answers before the whitelist is a command that answers strangers — and
 *  the one hole in an allow-list is the thing that opens it.
 *
 *  It only reads. `getUpdates` here is called with no offset, so nothing is
 *  consumed and the bot still receives whatever is waiting.
 * --------------------------------------------------------------------- */
import { CONFIG } from "./config.js";

if (!CONFIG.token) {
  console.error("TELEGRAM_BOT_TOKEN مفقود في services/telegram-bot/.env");
  process.exit(1);
}

/* A top-level `await fetch` with nothing around it ends as an unhandled
   rejection — a Node stack trace with `ENOTFOUND` in the middle of it, from
   the one script a new setup runs first. The three ways this fails have
   three different answers, and none of them is a stack trace. */
let res;
try {
  res = await fetch(`${CONFIG.apiRoot}/bot${CONFIG.token}/getUpdates`);
} catch (e) {
  const dns = /ENOTFOUND|EAI_AGAIN|getaddrinfo/.test(String(e?.cause?.code || e?.message || e));
  console.error(
    dns
      ? `تعذّر حلّ اسم ${new URL(CONFIG.apiRoot).hostname} — الشبكة تحجب تيليجرام.\n` +
          "البوت نفسه سليم؛ المشكلة بين هذا الجهاز وتيليجرام. الخيارات:\n" +
          "  • جرّب شبكة أخرى (بيانات الجوال مثلًا).\n" +
          "  • أو مرّره على وسيط، وضع عنوانه في TELEGRAM_API_ROOT داخل .env."
      : "تعذّر الاتصال بتيليجرام: " + (e?.message || e),
  );
  process.exit(1);
}

const body = await res.json().catch(() => null);

if (!body || !body.ok) {
  console.error("تيليجرام ردّ: " + (body?.description || res.status));
  console.error(
    res.status === 401
      ? "التوكن غير صحيح أو سُحب. خُذ واحدًا جديدًا من @BotFather."
      : "تأكد من التوكن.",
  );
  process.exit(1);
}

const seen = new Map();
for (const u of body.result || []) {
  const msg = u.message || u.edited_message || u.callback_query?.message;
  const chat = msg?.chat;
  if (!chat) continue;
  const who = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  seen.set(chat.id, `${who || chat.title || "—"}${chat.username ? " @" + chat.username : ""} (${chat.type})`);
}

if (!seen.size) {
  console.log("ما فيه رسائل بعد. أرسل أي رسالة للبوت من تيليجرام، ثم أعد تشغيل هذا.");
  console.log("(لو كان البوت شغّالًا، أوقفه أولًا — هو يسحب التحديثات لنفسه.)");
  process.exit(0);
}

console.log("المحادثات التي راسلت البوت:\n");
for (const [id, who] of seen) console.log(`  TELEGRAM_CHAT_ID=${id}   ${who}`);
console.log("\nانسخ رقمك إلى services/telegram-bot/.env");
