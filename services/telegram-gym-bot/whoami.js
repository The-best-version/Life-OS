#!/usr/bin/env node
/* --- أي محادثة هي محادثتي -------------------------------------------------
 *  البوّابة في bot.js تحتاج رقم محادثة، ولا طريقة لمعرفته من بوت يرفض الردّ
 *  على أي أحد. فهذا يسأل تيليجرام مباشرة: أرسل للبوت أي رسالة، ثم شغّل هذا.
 * --------------------------------------------------------------------- */
import { CONFIG } from "./config.js";

if (!CONFIG.token) {
  console.error("TELEGRAM_GYM_BOT_TOKEN مفقود في services/telegram-gym-bot/.env");
  process.exit(1);
}

let res;
try {
  res = await fetch(`${CONFIG.apiRoot}/bot${CONFIG.token}/getUpdates`);
} catch (e) {
  console.error("تعذّر الاتصال بتيليجرام: " + (e?.message || e));
  process.exit(1);
}

const body = await res.json().catch(() => null);
if (!body || !body.ok) {
  console.error("تيليجرام ردّ: " + (body?.description || res.status));
  console.error(res.status === 401 ? "التوكن غير صحيح أو سُحب." : "تأكد من التوكن.");
  process.exit(1);
}

const seen = new Map();
for (const u of body.result || []) {
  const msg = u.message || u.edited_message;
  const chat = msg?.chat;
  if (!chat) continue;
  const who = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  seen.set(chat.id, `${who || chat.title || "—"}${chat.username ? " @" + chat.username : ""} (${chat.type})`);
}

if (!seen.size) {
  console.log("ما فيه رسائل بعد. أرسل أي رسالة للبوت من تيليجرام، ثم أعد تشغيل هذا.");
  process.exit(0);
}

console.log("المحادثات التي راسلت البوت:\n");
for (const [id, who] of seen) console.log(`  TELEGRAM_GYM_CHAT_ID=${id}   ${who}`);
console.log("\nانسخ رقمك إلى services/telegram-gym-bot/.env");
