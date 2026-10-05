#!/usr/bin/env node
"use strict";

/* --- the app's home, and its disk copy ---------------------------------
 *  Two jobs on one port, deliberately.
 *
 *  It serves life-os/ over http://127.0.0.1, because a page opened as a
 *  file:// URL has no origin of its own: Chrome files every local html
 *  document on the machine under one shared storage bucket, refuses to
 *  install it as an app, and will not mark its data persistent — so an
 *  ordinary "clear browsing data" takes a year of habits with it. A real
 *  origin fixes all three at once.
 *
 *  And it keeps the state on disk. localStorage is the app's working copy;
 *  this is the copy that outlives the browser. The app pulls from here when
 *  it starts up empty, so a wiped profile heals itself on the next open
 *  instead of greeting him with seed data.
 * --------------------------------------------------------------------- */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 47615;
const HOST = "127.0.0.1";
const MAX_BODY = 8 * 1024 * 1024;
const QUIET = process.argv.includes("--quiet");

const ROOT = __dirname;
const DATA = path.join(ROOT, "graphify-out", "data");
const AUTO = path.join(ROOT, "backups", "auto");
const SITE = path.join(ROOT, "life-os");

const PROJECTS = {
  lifeos: "lifeos.json",
  step: "step.json",
  ironlog: "ironlog.json",
};

/* The graphify side of the house, read-only. The app already writes its
   state into graphify-out/data; what was missing was a way to reach the
   things graphify renders *out* of that data without leaving the origin.

   An explicit map, not a resolver. graphify-out holds three kinds of file
   and only one of them is publishable: the artifacts below. Beside them sit
   data/ -- the live year, handed out by /state alone, through its own
   PROJECTS whitelist -- and cache/ plus manifest.json, which are the
   pipeline's bookkeeping. A path-joining resolver here would be one
   traversal bug away from serving the lot, so there is no path joining:
   a request either names a key in this object or it is a 404. */
const GRAPHIFY = path.join(ROOT, "graphify-out");
const GRAPHIFY_FILES = {
  "graph.html": "graph.html",
  "report.md": "GRAPH_REPORT.md",
  "charts/discipline.svg": "lifeos-discipline.svg",
  "charts/gym.svg": "gym-consistency.svg",
  "charts/step.svg": "step-progress.svg",
};

/* Hourly, not per-write. The app saves on every tick of a checkbox; one file
   per save would bury the directory in minutes and make the useful snapshots
   impossible to find. One an hour, three days deep, is enough to walk back
   from any mistake that gets noticed the same week. */
const SNAP_KEEP = 72;

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(AUTO, { recursive: true });

// A local page is either file:// (Origin: null) or a localhost dev server.
// Any ordinary site you browse sends its own https origin and gets no
// Access-Control-Allow-Origin back, so the browser drops its response.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function originOk(origin) {
  if (origin === undefined) return true; // curl and other non-browser clients
  return origin === "null" || LOCAL_ORIGIN.test(origin);
}

function cors(res, origin) {
  res.setHeader("Vary", "Origin");
  if (origin !== undefined) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-local-sync");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function end(res, code, body, headers) {
  try {
    res.writeHead(code, headers || {});
    res.end(body);
  } catch {}
}

function readBody(req, cb) {
  let size = 0;
  const chunks = [];
  let done = false;
  const finish = (err, buf) => {
    if (done) return;
    done = true;
    cb(err, buf);
  };
  req.on("data", (c) => {
    size += c.length;
    if (size > MAX_BODY) {
      finish(new Error("too-large"));
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on("end", () => finish(null, Buffer.concat(chunks)));
  req.on("error", () => finish(new Error("stream")));
  req.on("aborted", () => finish(new Error("aborted")));
}

// Written to a sibling temp file first: the report-agent watcher fires on
// the data directory and would otherwise parse a half-flushed file. A rename
// on the same volume is atomic, so a reader sees the old file or the new one
// and never a torn one — which matters more now that the app itself reads
// this file back when it starts up empty.
function writeAtomic(file, text) {
  const tmp = file + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

/* The write before this one, kept aside. The app is the only writer and it
   writes the whole payload every time, so the one thing that can go wrong is
   a bad payload landing on a good one. A single generation back costs
   nothing and covers the case that gets noticed immediately. */
function keepPrevious(file) {
  try {
    if (fs.existsSync(file)) fs.copyFileSync(file, file.replace(/\.json$/, ".prev.json"));
  } catch {}
}

function snapshot(name, text) {
  try {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}`;
    writeAtomic(path.join(AUTO, `${name}-${stamp}.json`), text); // same hour overwrites
    const mine = fs
      .readdirSync(AUTO)
      .filter((f) => f.startsWith(name + "-") && f.endsWith(".json"))
      .sort();
    for (const f of mine.slice(0, Math.max(0, mine.length - SNAP_KEEP))) {
      try {
        fs.unlinkSync(path.join(AUTO, f));
      } catch {}
    }
  } catch {}
}

/* --- static site ------------------------------------------------------ */

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
};

/* Resolve inside life-os/ or refuse. A served directory is the one place a
   crafted path could reach the rest of the drive, and "it only listens on
   127.0.0.1" is no answer — every page in the browser can reach it. */
function resolveSite(pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (rel.endsWith("/")) rel += "index.html";
  const full = path.resolve(SITE, "." + rel);
  const base = path.resolve(SITE) + path.sep;
  if (full !== path.resolve(SITE) && !full.startsWith(base)) return null;
  return full;
}

function serveFile(res, full, depth) {
  let stat;
  try {
    stat = fs.statSync(full);
  } catch {
    return end(res, 404, "not found");
  }
  if (stat.isDirectory()) {
    if (depth) return end(res, 404, "not found");
    return serveFile(res, path.join(full, "index.html"), 1);
  }

  const type = TYPES[path.extname(full).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    ETag: `W/"${stat.size}-${stat.mtimeMs}"`,
    /* Never held by the browser. The whole app is one html file rebuilt in
       place; a cached copy would keep serving yesterday's build after every
       rebuild, which looks exactly like a change that did not take. Being
       offline is the service worker's job, not the cache header's. */
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(full)
    .on("error", () => {
      try {
        res.destroy();
      } catch {}
    })
    .pipe(res);
}

/* --- requests --------------------------------------------------------- */

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (!originOk(origin)) return end(res, 403);
  cors(res, origin);

  if (req.method === "OPTIONS") return end(res, 204);

  let url;
  try {
    url = new URL(req.url, "http://" + HOST);
  } catch {
    return end(res, 400);
  }

  if (req.method === "GET" || req.method === "HEAD") {
    /* The disk copy, handed back. This is what lets a browser profile that
       lost its localStorage come back with the year intact. */
    if (url.pathname === "/state") {
      const key = url.searchParams.get("project") || "lifeos";
      const file = Object.prototype.hasOwnProperty.call(PROJECTS, key) ? PROJECTS[key] : null;
      if (!file) return end(res, 404);
      let text;
      try {
        text = fs.readFileSync(path.join(DATA, file), "utf8");
        JSON.parse(text); // refuse to hand back something unparseable
      } catch {
        return end(res, 404);
      }
      return end(res, 200, text, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
    }
    /* The hub. A page of its own rather than a route into the app: the app
       is one bundle behind one service worker, and the hub has to stay
       reachable when that bundle is the thing being rebuilt. It lives in
       life-os/ so the existing sandbox still covers it. */
    if (url.pathname === "/hub" || url.pathname === "/hub/") {
      return serveFile(res, path.join(SITE, "hub.html"), 1);
    }

    /* The graphify artifacts, by key. See GRAPHIFY_FILES: the key is matched
       whole against that object, never joined onto a path, so nothing under
       graphify-out that is not listed there can be reached from here. */
    if (url.pathname.startsWith("/graphify/")) {
      let key;
      try {
        key = decodeURIComponent(url.pathname.slice(10));
      } catch {
        return end(res, 400);
      }
      if (!Object.prototype.hasOwnProperty.call(GRAPHIFY_FILES, key)) {
        return end(res, 404, "not found");
      }
      return serveFile(res, path.join(GRAPHIFY, GRAPHIFY_FILES[key]), 1);
    }

    const full = resolveSite(url.pathname);
    if (!full) return end(res, 403);
    return serveFile(res, full, 0);
  }

  if (req.method !== "POST") return end(res, 405);
  if (req.headers["x-local-sync"] !== "1") return end(res, 403);
  if (url.pathname !== "/sync") return end(res, 404);

  readBody(req, (err, buf) => {
    if (err) return end(res, err.message === "too-large" ? 413 : 400);

    let msg;
    try {
      msg = JSON.parse(buf.toString("utf8"));
    } catch {
      return end(res, 400);
    }
    if (!msg || typeof msg !== "object" || Array.isArray(msg)) return end(res, 400);

    const name = Object.prototype.hasOwnProperty.call(PROJECTS, msg.project) ? msg.project : null;
    if (!name) return end(res, 404);
    if (msg.payload === undefined || msg.payload === null) return end(res, 400);

    let text;
    try {
      text = JSON.stringify(msg.payload, null, 2);
    } catch {
      return end(res, 400);
    }
    if (typeof text !== "string") return end(res, 400);

    const file = path.join(DATA, PROJECTS[name]);
    try {
      keepPrevious(file);
      writeAtomic(file, text);
      snapshot(name, text);
      /* The prayer times are computed for a city, so changing it has to move
         today's reminders too — otherwise they keep firing on the old
         horizon until the next day rollover. Compared as text because the
         payload arrives whole on every save and only this part matters. */
      if (name === "lifeos") {
        const place = JSON.stringify(msg.payload.place || null);
        if (place !== lastPlace) {
          lastPlace = place;
          armToday();
        }
      }
    } catch {
      return end(res, 500);
    }

    if (!QUIET) {
      const stamp = new Date().toTimeString().slice(0, 8);
      /* Bytes, not characters. Arabic is two bytes a letter in UTF-8, so a
         length printed here reads ~15% below the file size on disk and
         looks exactly like a payload that lost something. */
      const bytes = Buffer.byteLength(text, "utf8");
      console.log(stamp + "  " + name.padEnd(8) + PROJECTS[name].padEnd(14) + bytes + " B");
    }
    end(res, 204);
  });
});

/* --- the reminders ----------------------------------------------------- *
 *  The app's own evening prompt only fires while the app is open, and the
 *  record said that is the problem: four days written out of six, two
 *  missing entirely, longest streak zero. A tracker that waits to be
 *  remembered is one more thing to remember.
 *
 *  So the reminding is done from here, where it does not depend on a window
 *  being open. This process already starts with Windows and already holds
 *  the state, which means it can say what is actually left rather than
 *  "don't forget" — the difference between a nag and a reminder is whether
 *  it knows anything.
 *
 *  Windows toasts, not browser notifications: a service worker cannot wake
 *  itself on a timer (Chrome never shipped notification triggers), so the
 *  only way the browser could do this is by staying open, which is the
 *  assumption being removed.
 * ---------------------------------------------------------------------- */

/* Timers are set per block for today only, and re-armed just after midnight.
   setTimeout is milliseconds in a signed 32-bit int, so anything beyond ~24
   days silently fires at once; a day at a time stays far inside that, and
   also picks up a changed city or a new prayer time without a restart. */
let blockTimers = [];
let rollTimer = null;
let lastPlace = null;

function readState() {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(DATA, PROJECTS.lifeos), "utf8"));
    return s && Array.isArray(s.habits) ? s : null;
  } catch {
    return null;
  }
}

/* The app's own day boundary: anything before 04:00 belongs to the day
   before. Duplicated from the app as a constant rather than imported with
   the prayer maths because it is one number — but it is the same number, and
   a reminder that disagrees about which day it is would be worse than none. */
const DAY_START_HOUR = 4;
function dayKey(d = new Date()) {
  const x = new Date(d);
  if (x.getHours() < DAY_START_HOUR) x.setDate(x.getDate() - 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* PowerShell, with the text passed as base64 rather than interpolated. A
   habit's label is user-written Arabic that can contain a quote or a dollar
   sign, and splicing that into a script is how a reminder turns into
   arbitrary code. Decoded inside PowerShell, it is only ever data. */
/* Windows will only show a toast for an identity it knows, and it fails
   silently for one it does not — Show() returns perfectly happily and
   nothing appears. The installed PWA is a registered identity (Chrome wrote
   it a Start Menu shortcut carrying this id), so the reminder arrives under
   the app's own name and icon rather than as "Windows PowerShell". If the
   app is ever uninstalled this quietly stops showing; that is the trade for
   not registering a second identity of our own. */
const TOAST_AUMID = "Chrome._crx_hbagjjmjdegoabokdhefbamhpknhehmb";

function toast(title, lines) {
  const xml =
    "<toast><visual><binding template='ToastGeneric'><text>" +
    esc(title) +
    "</text><text>" +
    esc(lines) +
    "</text></binding></visual></toast>";
  const b64 = Buffer.from(xml, "utf16le").toString("base64");
  const a64 = Buffer.from(TOAST_AUMID, "utf16le").toString("base64");
  const ps = [
    "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] | Out-Null",
    /* Loaded explicitly: the manager's own assembly does not drag the XML
       type in with it, and without this line New-Object cannot find it. */
    "[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime] | Out-Null",
    "$x = New-Object Windows.Data.Xml.Dom.XmlDocument",
    `$x.LoadXml([Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${b64}')))`,
    "$n = New-Object Windows.UI.Notifications.ToastNotification $x",
    `$a = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${a64}'))`,
    "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($a).Show($n)",
  ].join("; ");
  try {
    const child = require("child_process").spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", ps],
      { stdio: "ignore", windowsHide: true },
    );
    child.on("error", () => {});
    child.unref();
  } catch {
    /* No PowerShell, or it refused. The reminder is a courtesy; nothing
       downstream depends on it having been shown. */
  }
}

/* What is still open in this block, said plainly. Core habits lead because
   they are the ones the score counts; the rest are named only as a number,
   so the toast stays a glance rather than a list. */
function blockMessage(state, blockId, label) {
  const inBlock = state.habits.filter((h) => h.group === blockId);
  if (!inBlock.length) return null;
  const open = inBlock.filter((h) => !h.done);
  if (!open.length) return null;

  const core = state.habits.filter((h) => h.core);
  const scored = core.length ? core : state.habits;
  const pct = scored.length
    ? Math.round((scored.filter((h) => h.done).length / scored.length) * 100)
    : 0;

  const openCore = open.filter((h) => h.core);
  const named = (openCore.length ? openCore : open).slice(0, 3).map((h) => h.label);
  const rest = open.length - named.length;
  const body =
    named.join(" · ") + (rest > 0 ? ` و${rest} غيرها` : "") + ` — اليوم ${pct}%`;
  return { title: label, body };
}

function fireBlock(blockId, label) {
  const state = readState();
  if (!state) return;
  /* The day on disk is yesterday's: nothing has opened the app since the
     rollover, so its ticks are stale and a message built from them would
     name habits that were done yesterday. Say the true thing instead. */
  if (state.date !== dayKey()) {
    toast(label, "لم تفتح اليوم بعد. افتح 2027 Life OS وابدأ يومك.");
    return;
  }
  const msg = blockMessage(state, blockId, label);
  if (!msg) return; // nothing open in this block — silence is the right output
  toast(msg.title, msg.body);
}

async function armToday() {
  for (const t of blockTimers) clearTimeout(t);
  blockTimers = [];
  const state = readState();
  const place = state && state.place;
  if (!place || !Number.isFinite(place.lat)) return;

  let blockTimes;
  try {
    ({ blockTimes } = await import("./prayer-times.mjs"));
  } catch {
    return; // the maths is missing; the serving half carries on regardless
  }

  const now = Date.now();
  let armed = 0;
  for (const b of blockTimes(place)) {
    const wait = b.when.getTime() - now;
    if (wait <= 0) continue; // already passed today; tomorrow's arming catches it
    const t = setTimeout(() => fireBlock(b.id, b.label), wait);
    t.unref?.(); // a pending reminder must never be the reason node stays up
    blockTimers.push(t);
    armed++;
  }
  if (!QUIET) console.log(`          reminders   ${armed} armed for today`);
}

/* Re-armed a minute past the app's own day boundary, so the new day's times
   are computed from the new day and the window between is not a hole. */
function scheduleRoll() {
  clearTimeout(rollTimer);
  const next = new Date();
  next.setHours(DAY_START_HOUR, 1, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  rollTimer = setTimeout(() => {
    armToday();
    scheduleRoll();
  }, next.getTime() - Date.now());
  rollTimer.unref?.();
}

server.on("clientError", (e, socket) => {
  try {
    socket.destroy();
  } catch {}
});

server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? "local-sync-server: port " + PORT + " already in use"
      : "local-sync-server: " + e.message
  );
  process.exit(1);
});

process.on("uncaughtException", (e) => console.error("local-sync-server: " + e.message));

server.listen(PORT, HOST, () => {
  if (QUIET) return;
  console.log("2027 Life OS   http://" + HOST + ":" + PORT + "/");
  console.log("  site  " + SITE);
  console.log("  data  " + DATA);
  console.log("  auto  " + AUTO);
});

armToday();
scheduleRoll();
