/* --- the one question the disk cannot answer ---------------------------
 *  Everything else the control hub shows it reads out of `state.bot`, which
 *  is on disk and which the screen already has. «هل العملية شغّالة الآن؟» is
 *  not in there and cannot be: a process that has died cannot write down
 *  that it has died. So the bot opens a loopback listener and the screen
 *  asks it directly.
 *
 *  Deliberately tiny, and deliberately not part of the sync server: that
 *  process has no business importing a Telegram library, and this one has no
 *  business serving the app. Two processes, two ports, one direction of
 *  dependency.
 *
 *  Three rules it keeps, all of them the sync server's own:
 *
 *  - **127.0.0.1 only.** Bound to the loopback address, not to 0.0.0.0, so
 *    nothing outside this machine can reach it at all.
 *  - **The reading is open to any local page; the ping is not.** `POST /ping`
 *    makes the bot send a real message, so it is fenced by the same two
 *    tests the sync server fences a write with — a local Origin, and the
 *    `x-local-sync` header a stray form submission would never carry.
 *  - **The token never leaves this process.** The health body carries what
 *    the screen needs to diagnose a silent bot and nothing that could be
 *    used to become it.
 * --------------------------------------------------------------------- */
import http from "node:http";
import { BOT_PORT } from "../../src/state/life-state.mjs";

/* The same regex the sync server uses: a page served from localhost on any
   port, or a file:// document, which arrives as the string "null". */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const originOk = (o) => o === undefined || o === "null" || LOCAL_ORIGIN.test(o);

const json = (res, code, body, origin) => {
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
    ...(origin === undefined ? {} : { "access-control-allow-origin": origin }),
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-local-sync",
    "access-control-max-age": "86400",
  });
  res.end(JSON.stringify(body));
};

/* A chat id, shown but not spelled out. It is not a secret the way the token
   is, but it is still an identifier, and the screen only needs enough of it
   to tell «هذا حسابي» from «هذا حساب آخر». */
export const maskId = (id) => {
  const s = String(id || "");
  return s.length <= 4 ? s : `${s.slice(0, 3)}…${s.slice(-3)}`;
};

/* `read()` hands back the live facts; `ping()` sends the test message and
   resolves to true or throws. Both are passed in, so this file knows nothing
   about grammY or about the state. */
export function startHealth({ read, ping, port = BOT_PORT }) {
  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    if (!originOk(origin)) return json(res, 403, { ok: false, error: "origin" }, undefined);
    if (req.method === "OPTIONS") {
      return json(res, 204, {}, origin);
    }

    const path = String(req.url || "").split("?")[0];

    if (req.method === "GET" && (path === "/health" || path === "/")) {
      let body;
      try {
        body = { ok: true, ...read() };
      } catch (e) {
        body = { ok: false, error: String(e?.message || e) };
      }
      return json(res, 200, body, origin);
    }

    if (req.method === "POST" && path === "/ping") {
      /* The same fence the sync server puts on a write: the header a stray
         form submission would never carry. */
      if (req.headers["x-local-sync"] !== "1") {
        return json(res, 403, { ok: false, error: "header" }, origin);
      }
      /* The body is read and discarded — it exists so the request is a POST
         with a content type, not because anything in it is used. Nothing
         from a request ever reaches Telegram. */
      req.resume();
      req.on("end", () => {
        Promise.resolve()
          .then(ping)
          .then(() => json(res, 200, { ok: true }, origin))
          .catch((e) => json(res, 200, { ok: false, error: String(e?.message || e) }, origin));
      });
      return;
    }

    return json(res, 404, { ok: false, error: "not found" }, origin);
  });

  server.on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? `المنفذ ${port} مشغول — نسخة أخرى من البوت تعمل؟ شريط الحالة في الموقع لن يعمل.`
        : "health: " + e.message,
    );
  });
  /* The health listener must never be the reason node stays up, and it must
     never be the reason the bot fails to start: a bot that answers messages
     with no status strip is far better than no bot. */
  server.unref?.();
  server.listen(port, "127.0.0.1");
  return server;
}
