/* --- a voice note, read as a sentence -----------------------------------
 *  The fastest way to record something is to say it, and the moment worth
 *  recording is almost always a moment with a hand full of something else.
 *  Everything below exists to turn ten seconds of audio into the same string
 *  a typed message would have been — after which it goes down the *same*
 *  path as typed text, through `parse`, and every trigger, every question
 *  and every confirmation works unchanged.
 *
 *  That is the whole design: this file ends where `parse` begins. It does
 *  not know what a habit is.
 *
 *  **It is the one thing here with a dependency outside this machine**, and
 *  the seam is deliberately generic: anything that speaks the OpenAI
 *  transcription shape will do, including `whisper.cpp` running on this same
 *  laptop — which keeps the audio local, costs nothing, and is what I would
 *  point it at. With no `VOICE_API_URL` the feature is off and the bot says
 *  so; it never swallows a voice note in silence, because a message that
 *  vanishes is worse than one that was refused.
 * --------------------------------------------------------------------- */
import { CONFIG } from "./config.js";

/* Telegram's own cap is 20MB for a download, and a voice note that long is
   not a voice note. A minute of OPUS is about 100KB, so this is minutes of
   speech and still far inside anything a transcriber will accept. */
export const VOICE_MAX_BYTES = 4 * 1024 * 1024;

/* How long to wait for the transcription. A short clip comes back in two or
   three seconds; past this something is wrong, and a request with no
   deadline is a bot that stops answering anything else. */
export const VOICE_TIMEOUT_MS = 45_000;

export class VoiceError extends Error {}

/* The bytes of a Telegram file. Two calls — `getFile` for the path, then the
   file endpoint — and the token is in the URL for both, which is Telegram's
   own design and the reason this never logs a URL. */
export async function fetchVoice(api, fileId) {
  const file = await api.getFile(fileId);
  if (!file?.file_path) throw new VoiceError("تيليجرام ما أعطاني الملف.");
  if (file.file_size && file.file_size > VOICE_MAX_BYTES) {
    throw new VoiceError("المقطع طويل. أرسل مقطعًا أقصر.");
  }
  const url = `${CONFIG.apiRoot}/file/bot${CONFIG.token}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new VoiceError(`تعذّر تنزيل المقطع (${res.status}).`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > VOICE_MAX_BYTES) throw new VoiceError("المقطع كبير.");
  return { bytes: buf, name: file.file_path.split("/").pop() || "voice.ogg" };
}

/* The transcription itself. `multipart/form-data` through the platform's own
   `FormData`/`Blob`, so there is nothing to install and no boundary to get
   wrong by hand. */
export async function transcribe({ bytes, name }) {
  if (!CONFIG.voiceUrl) {
    throw new VoiceError(
      "الرسائل الصوتية مطفأة. ضع VOICE_API_URL في services/telegram-bot/.env لتشغيلها.",
    );
  }
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "audio/ogg" }), name);
  form.append("model", CONFIG.voiceModel);
  /* Stated and never detected: a ten-second clip is short enough that a
     language detector guesses, and a guess turns an Arabic sentence into
     transliterated nonsense that then lands in the inbox as a task. */
  if (CONFIG.voiceLang) form.append("language", CONFIG.voiceLang);
  form.append("response_format", "json");

  const stop = AbortSignal.timeout
    ? AbortSignal.timeout(VOICE_TIMEOUT_MS)
    : undefined;
  let res;
  try {
    res = await fetch(`${CONFIG.voiceUrl}/v1/audio/transcriptions`, {
      method: "POST",
      headers: CONFIG.voiceKey ? { authorization: `Bearer ${CONFIG.voiceKey}` } : {},
      body: form,
      signal: stop,
    });
  } catch (e) {
    throw new VoiceError(
      e?.name === "TimeoutError"
        ? "خدمة التفريغ ما ردّت في الوقت."
        : "ما قدرت أصل لخدمة التفريغ.",
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new VoiceError("خدمة التفريغ رفضت المفتاح.");
  }
  if (!res.ok) throw new VoiceError(`خدمة التفريغ ردّت ${res.status}.`);
  let body;
  try {
    body = await res.json();
  } catch {
    throw new VoiceError("جواب خدمة التفريغ غير مفهوم.");
  }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) throw new VoiceError("ما سمعت كلامًا في المقطع.");
  return text;
}

/* Both halves, as the one call the shell makes. */
export async function readVoice(api, fileId) {
  return transcribe(await fetchVoice(api, fileId));
}
