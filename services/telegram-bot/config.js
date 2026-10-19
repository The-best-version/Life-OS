/* --- the settings, and the one file they are read from -------------------
 *  `.env` beside this file, read by hand rather than with dotenv. Two
 *  reasons: this repo installs nothing it can avoid installing — the whole
 *  app ships with no node_modules of its own — and a hand-rolled reader can
 *  fail in Arabic and say which line it choked on, which `--env-file` cannot.
 *
 *  Nothing here is ever committed. `.gitignore` carries `.env`, and
 *  `.env.example` is the copy that is: the token in it is a placeholder and
 *  nothing more.
 * --------------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
/* The repo root, two folders up — services/telegram-bot → services → root.
   Resolved off this file rather than off the working directory, because the
   bot is started by a Windows launcher whose cwd is anybody's guess, and a
   path typed as a string is a path that breaks silently the first time
   anything moves. */
export const ROOT = join(HERE, "..", "..");

/* KEY=value, one per line. `#` starts a comment, quotes around a value are
   stripped, and whitespace either side of the `=` is ignored — the four
   things a human editing a file by hand actually does. A value with an `=`
   in it (a token never has one, a password might) keeps everything after
   the first separator. */
function parseEnv(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const at = s.indexOf("=");
    if (at <= 0) continue;
    const key = s.slice(0, at).trim();
    let val = s.slice(at + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/* A real environment variable wins over the file, so a value can be
   overridden for one run without editing anything. */
function readEnv() {
  let fromFile = {};
  try {
    fromFile = parseEnv(readFileSync(join(HERE, ".env"), "utf8"));
  } catch {
    /* No .env at all. Not fatal here — the check below is what reports it,
       and with the two variables exported some other way the bot runs with
       no file present. */
  }
  return { ...fromFile, ...process.env };
}

const env = readEnv();

const pick = (key, fallback) => {
  const v = env[key];
  return v === undefined || v === "" ? fallback : v;
};

export const CONFIG = {
  /* From @BotFather. The only secret here. */
  token: pick("TELEGRAM_BOT_TOKEN", ""),
  /* The one chat this bot answers. Everything from anywhere else is dropped
     without a reply — see the gate, the first middleware in bot.js. */
  chatId: String(pick("TELEGRAM_CHAT_ID", "")).trim(),
  /* Where the state lives. The live origin is the only one that may write to
     the live file, and it is the default; `--port 47699` plus this variable
     is how the bot is exercised against a throwaway copy. */
  origin: String(pick("LIFEOS_ORIGIN", "http://127.0.0.1:47615")).replace(/\/+$/, ""),
  /* The two briefs' hours are NOT here any more. They live in `state.bot`,
     edited on the «بوت تيليجرام» screen and read off the disk by the
     scheduler — because a time that can only be changed by editing a file on
     the machine the bot runs on is a time that never changes. A value left
     in .env is simply ignored, which is the right failure: one place. */
  /* Long polling by default: no public URL, no tunnel, no webhook secret to
     leak. A home machine behind a router has no business terminating TLS. */
  seconds: Number(pick("POLL_SECONDS", "30")) || 30,
  /* Which Bot API to talk to. Telegram's own, unless something else is
     named — which is how the whole bot gets exercised end to end against a
     stub, gate included, without a token and without sending a real
     message. Nothing in normal use sets it. */
  apiRoot: String(pick("TELEGRAM_API_ROOT", "https://api.telegram.org")).replace(/\/+$/, ""),
  /* --- the voice note's one dependency ---------------------------------- *
   *  A voice note is the fastest way there is to record something while
   *  walking, and it is the one feature in this bot that cannot be built
   *  out of what the repo already has: turning Arabic speech into text
   *  needs either a model on this machine or a service off it.
   *
   *  So it is a seam rather than a decision. Point `VOICE_API_URL` at
   *  anything that speaks the OpenAI transcription shape — a hosted one, or
   *  a local `whisper.cpp` server on this same machine, which keeps the
   *  audio on the laptop and costs nothing. With no key the feature is
   *  simply off and the bot says so when a voice note arrives, rather than
   *  swallowing it silently.
   * -------------------------------------------------------------------- */
  voiceUrl: String(pick("VOICE_API_URL", "")).replace(/\/+$/, ""),
  voiceKey: pick("VOICE_API_KEY", ""),
  voiceModel: pick("VOICE_MODEL", "whisper-1"),
  /* --- المساعد الذكي: الاعتماد الخارجي الثاني والأخير ------------------- *
   *  نفس عقد الصوت بالحرف: مفتاح واحد يشغّل الميزة، وبلا مفتاح تبقى مطفأة
   *  ويُقال ذلك صراحةً عند أول استدعاء. الفرق الوحيد أن هذا يكلّف توكنز
   *  بكل رسالة، وأن موجز اليوم (أرقامه وعناوينه) يغادر هذا الجهاز إلى
   *  Anthropic — وهذا مكتوب في .env.example كي لا يكون مفاجأة.
   *
   *  القواعد المكتوبة بيد في parse.js و insight.js تبقى الطريق الافتراضي
   *  لكل شيء: فورية، مجانية، مختبَرة، وتعمل بلا إنترنت. هذا للسؤال الحرّ
   *  وللنصّ غير المهيكل وحدهما.
   * -------------------------------------------------------------------- */
  aiKey: pick("ANTHROPIC_API_KEY", ""),
  aiUrl: String(pick("ANTHROPIC_API_URL", "https://api.anthropic.com")).replace(/\/+$/, ""),
  aiModel: pick("ANTHROPIC_MODEL", "claude-sonnet-5"),
  /* ردّ محادثة لا مقالة. ألف توكن تكفي جوابًا عربيًا مفصّلًا، وتضع سقفًا
     على كلفة أي رسالة واحدة مهما طال سؤالها. */
  aiMaxTokens: Number(pick("ANTHROPIC_MAX_TOKENS", "1024")) || 1024,
  /* Arabic, stated rather than detected: a ten-second clip of Arabic is
     short enough that a detector guesses, and a guess here turns a sentence
     into transliterated nonsense that then lands in the inbox as a task. */
  voiceLang: pick("VOICE_LANG", "ar"),
};

/* Whether a voice note can be read at all. The URL alone is enough — a local
   transcription server needs no key. */
export const voiceReady = () => !!CONFIG.voiceUrl;

/* هل المساعد الذكي مشغَّل. المفتاح وحده هو الشرط — كل ما عداه له افتراض. */
export const aiReady = () => !!CONFIG.aiKey;

/* What is missing, named. A bot that starts and then silently answers
   nothing is the single most confusing failure this can have, so it refuses
   to start instead. */
export function configProblems() {
  const bad = [];
  if (!CONFIG.token) bad.push("TELEGRAM_BOT_TOKEN مفقود — خُذه من @BotFather.");
  if (!/^\d+:[\w-]+$/.test(CONFIG.token) && CONFIG.token) {
    bad.push("TELEGRAM_BOT_TOKEN لا يشبه توكن بوت (الشكل: 123456789:AA...).");
  }
  if (!CONFIG.chatId) {
    bad.push(
      "TELEGRAM_CHAT_ID مفقود — أرسل رسالة للبوت ثم شغّل: npm run bot:whoami",
    );
  } else if (!/^-?\d+$/.test(CONFIG.chatId)) {
    bad.push("TELEGRAM_CHAT_ID لازم يكون رقمًا.");
  }
  return bad;
}
