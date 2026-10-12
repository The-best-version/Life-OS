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

/* "HH:MM" to minutes past midnight, or the fallback. The same reading
   `minsIn` does in the state layer; not imported only because this file is
   read before anything else and deliberately depends on nothing. */
const atMins = (v, fallback) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return fallback;
  return h * 60 + min;
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
  /* When the two briefs are sent. The morning one is a clock hour because
     waking is: anchoring it to Fajr would send it at 04:40 in June. The
     evening one defaults to the same hour the app's own reflection window
     opens, and `briefing.js` reads that constant rather than repeating 20. */
  morningAt: atMins(pick("MORNING_AT", "07:00"), 7 * 60),
  eveningAt: atMins(pick("EVENING_AT", ""), null),
  /* Long polling by default: no public URL, no tunnel, no webhook secret to
     leak. A home machine behind a router has no business terminating TLS. */
  seconds: Number(pick("POLL_SECONDS", "30")) || 30,
  /* Which Bot API to talk to. Telegram's own, unless something else is
     named — which is how the whole bot gets exercised end to end against a
     stub, gate included, without a token and without sending a real
     message. Nothing in normal use sets it. */
  apiRoot: String(pick("TELEGRAM_API_ROOT", "https://api.telegram.org")).replace(/\/+$/, ""),
};

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
