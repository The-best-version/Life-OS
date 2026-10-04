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
