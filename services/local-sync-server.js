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
const crypto = require("crypto");

/* Both are overridable, and only for one reason: so a second copy of this
   server can be run against a throwaway data directory on a throwaway port
   without going anywhere near the live one. The defaults are the live setup,
   so nothing that starts it without arguments behaves differently. */
const flag = (name, fallback) => {
  const at = process.argv.indexOf("--" + name);
  if (at < 0 || at + 1 >= process.argv.length) return fallback;
  return process.argv[at + 1];
};

const PORT = Number(flag("port", 47615)) || 47615;
const HOST = "127.0.0.1";
const MAX_BODY = 8 * 1024 * 1024;
const QUIET = process.argv.includes("--quiet");

/* This file lives in services/, and everything it reaches for — life-os/,
   graphify-out/ and backups/ — sits beside that folder, not inside it. The
   root is therefore one level up; reading it off __dirname would serve an
   empty directory and write the year into services/graphify-out. */
const ROOT = path.join(__dirname, "..");
const DATA = path.resolve(ROOT, flag("data-dir", path.join("graphify-out", "data")));
/* The snapshots follow the data. A test run writing its hourly snapshots into
   the live backups/auto would be exactly the kind of mess the test exists to
   avoid. */
const BACKUPS = DATA === path.join(ROOT, "graphify-out", "data")
  ? path.join(ROOT, "backups")
  : path.join(DATA, "backups");
const AUTO = path.join(BACKUPS, "auto");
const DAILY = path.join(BACKUPS, "daily");
const GUARD = path.join(BACKUPS, "guard");
const MANUAL = path.join(BACKUPS, "manual");
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
/* Three days of hourly snapshots walk back from a mistake noticed the same
   week. They do not walk back from one noticed in March, because by then the
   hour it happened in has been overwritten a thousand times — so one file a
   day is kept beside them, four months deep. Cheap: a day's payload is about
   30KB, so the whole lot is a few megabytes. */
const DAILY_KEEP = 120;

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(AUTO, { recursive: true });
fs.mkdirSync(DAILY, { recursive: true });
fs.mkdirSync(GUARD, { recursive: true });
fs.mkdirSync(MANUAL, { recursive: true });

// A local page is either file:// (Origin: null) or a localhost dev server.
// Any ordinary site you browse sends its own https origin and gets no
// Access-Control-Allow-Origin back, so the browser drops its response.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function originOk(origin) {
  if (origin === undefined) return true; // curl and other non-browser clients
  return origin === "null" || LOCAL_ORIGIN.test(origin);
}

/* Reading is open to any local page; writing is not. `localhost:47615` and
   `127.0.0.1:47615` are two origins to a browser — separate localStorage,
   separate idea of the day, separate window lease — and both of them writing
   to this one file is two copies of a year taking turns overwriting each
   other with no way to see it happening. So the only page allowed to write is
   the one this server itself serves, which is also what makes the throwaway
   test copy on another port self-consistent rather than a special case. */
const WRITE_ORIGIN = "http://" + HOST + ":" + PORT;
function writeOriginOk(origin) {
  if (origin === undefined) return true; // curl, and this machine's own tools
  return origin === WRITE_ORIGIN;
}

function cors(res, origin) {
  res.setHeader("Vary", "Origin");
  if (origin !== undefined) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-local-sync, x-force, x-guard");
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

function prune(dir, name, keep) {
  const mine = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(name + "-") && f.endsWith(".json"))
    .sort();
  for (const f of mine.slice(0, Math.max(0, mine.length - keep))) {
    try {
      fs.unlinkSync(path.join(dir, f));
    } catch {}
  }
}

function snapshot(name, text) {
  try {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}`;
    writeAtomic(path.join(AUTO, `${name}-${stamp}.json`), text); // same hour overwrites
    prune(AUTO, name, SNAP_KEEP);
    /* One a day as well, keyed to the app's own day rather than the clock's:
       a payload written at 01:30 belongs to the day before, and filing it
       under the new date would overwrite that day's real last write with
       something from before it. Overwritten all day, so what survives is the
       last state the day was left in. */
    writeAtomic(path.join(DAILY, `${name}-${dayKey(d)}.json`), text);
    prune(DAILY, name, DAILY_KEEP);
  } catch {}
}

/* --- is this the same payload, or a different one wearing the same number? -
 *  The revision guard's whole job is to tell a write that is behind from a
 *  write that is current, and a number alone cannot do it: the counter lives
 *  in each window's own localStorage, so a stale copy's revision climbs on
 *  every save *it* makes and sooner or later arrives at the number already on
 *  disk. `mine < theirs` is false at that point and last-writer-wins is back
 *  — which is exactly how a 17-habit copy landed on top of a 22-habit one
 *  that had just been recovered.
 *
 *  So equality is answered by the contents, not by the counter. Two payloads
 *  that hash the same at the same revision are one write sent twice, and the
 *  second one is a retry: nothing to do, and refusing it would make an
 *  ordinary network hiccup look like a conflict. Two payloads that hash
 *  differently at the same revision are two divergent copies claiming one
 *  number, and that is the case that must never be allowed through.
 *
 *  Key order is sorted out of the comparison. The same state serialized by
 *  two different code paths can come out with its keys in a different order,
 *  and a retry that read as a divergence would raise the conflict bar over
 *  nothing.
 * ----------------------------------------------------------------------- */
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonical(v[k]);
    return out;
  }
  return v;
}

function payloadHash(v) {
  try {
    return crypto.createHash("sha256").update(JSON.stringify(canonical(v)), "utf8").digest("hex");
  } catch {
    /* Unhashable is treated as "not the same payload" by every caller, which
       is the safe side: the write is refused rather than let through. */
    return null;
  }
}

/* --- the guard ---------------------------------------------------------- *
 *  Everything above keeps a copy *after* the fact, on a schedule. This keeps
 *  one before the fact, and only when the write coming in is the shape of a
 *  loss: fewer archive rows than the file already has, a list that was full
 *  arriving empty, or two more habits/goals/books/tasks gone than a person
 *  deletes in one sitting.
 *
 *  It does not refuse the write. Deleting things is allowed — that is what
 *  the buttons are for. It just makes sure the version before the deletion
 *  is still on disk afterwards, named by the hour it was taken, because the
 *  single .prev.json beside the file is one save deep and the save after a
 *  bad one is usually seconds later.
 * ----------------------------------------------------------------------- */
const GUARDED = ["habits", "goals", "books", "tasks", "quotes", "reads", "badHabits"];
const SHRINK_SLACK = 2;

function shrinkReason(before, after) {
  if (!before || typeof before !== "object") return null;
  const len = (o, k) => (Array.isArray(o[k]) ? o[k].length : null);
  const was = len(before, "history");
  const now = len(after, "history");
  if (was !== null && now !== null && now < was) return `history ${was} -> ${now}`;
  for (const k of GUARDED) {
    const a = len(before, k);
    const b = len(after, k);
    if (a === null || b === null) continue;
    if (a > 0 && b === 0) return `${k} emptied (${a} rows)`;
    if (a - b > SHRINK_SLACK) return `${k} ${a} -> ${b}`;
  }
  return null;
}

function guardSnapshot(name, text, why) {
  try {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    /* Down to the millisecond, and never overwritten. The hourly snapshots
       deliberately overwrite within the hour — one an hour is the point. A
       guard copy is the opposite: it exists because something was about to be
       lost, and two of those can land in the same second (a delete followed
       by the save that confirms it). Reusing the name would throw away the
       first copy, which is the one that still had the rows. */
    const stamp =
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}` +
      `${p(d.getMinutes())}${p(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, "0")}`;
    let file = path.join(GUARD, `${name}-${stamp}.json`);
    for (let n = 2; fs.existsSync(file) && n < 100; n++) {
      file = path.join(GUARD, `${name}-${stamp}-${n}.json`);
    }
    writeAtomic(file, text);
    if (!QUIET) console.log("          guard       " + path.basename(file) + "  " + why);
  } catch {}
}

/* --- the recovery centre's half of the deal ---------------------------- *
 *  Three directories of snapshots have existed since phase 1 and none of
 *  them was reachable from inside the app: knowing a copy of Tuesday is on
 *  disk is no use to someone who would have to be told the path, open a file
 *  manager and paste JSON into an import box. So the snapshots are listed
 *  and handed back over the same origin the app already talks to.
 *
 *  Reading, never writing — and no path joining of anything a request said.
 *  A name is matched whole against `SNAP_NAME`, then against what `readdir`
 *  actually lists in that one directory: the listing *is* the whitelist, the
 *  same philosophy as `GRAPHIFY_FILES` above. A crafted name cannot name a
 *  file that readdir did not just hand us, so there is nothing for a
 *  traversal to traverse.
 * ---------------------------------------------------------------------- */
const SNAP_KINDS = {
  auto: { dir: AUTO, label: "كل ساعة" },
  daily: { dir: DAILY, label: "يومية" },
  guard: { dir: GUARD, label: "قبل تغيير ناقص" },
  manual: { dir: MANUAL, label: "يدوية" },
  verified: { dir: BACKUPS, label: "موثّقة" },
};
/* No slash, no backslash, no leading dot, ends in .json, bounded length. The
   readdir check below is what makes it safe; this is what makes it cheap. */
const SNAP_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,96}\.json$/;
/* This app's snapshots and nothing else. `backups/` itself also holds the
   verified copies, which were named by hand under the product's own name. */
const SNAP_PREFIX = /^(lifeos|life-os-2027)-/;
/* Enough to walk back from anything noticed the same season, and few enough
   that the listing stays a list rather than a wall. */
const SNAP_PER_KIND = 80;

/* Parsing every snapshot on every request would read a few megabytes to
   answer one click. Keyed by name, size and mtime, so a file that changed —
   the hourly snapshot being overwritten within its hour — is re-read and the
   rest are not. */
const snapCache = new Map();

function snapSummary(dir, name) {
  const full = path.join(dir, name);
  let st;
  try {
    st = fs.statSync(full);
  } catch {
    return null;
  }
  if (!st.isFile()) return null;
  const key = dir + "|" + name + "|" + st.size + "|" + st.mtimeMs;
  const hit = snapCache.get(key);
  if (hit) return hit;

  let s = null;
  try {
    s = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch {
    /* An unreadable snapshot is still worth listing — as unreadable. Hiding
       it would make a corrupted file look like a file that was never taken. */
  }
  const len = (k) => (s && Array.isArray(s[k]) ? s[k].length : null);
  /* `Number(null)` is 0 and `Number("")` is 0, so a missing field would be
     reported as a real zero — a snapshot with no revision looking like
     revision zero, and a day with no score looking like a day that scored
     nothing. Absent has to come back absent. */
  const num = (v) =>
    v === null || v === undefined || v === "" || !Number.isFinite(Number(v))
      ? null
      : Number(v);
  const row =
    s && Array.isArray(s.history)
      ? s.history.find((h) => h && h.date === s.date) || null
      : null;
  const out = {
    name,
    at: st.mtimeMs,
    size: st.size,
    ok: !!(s && Array.isArray(s.habits)),
    schema: num(s && s.schema),
    rev: num(s && s.rev),
    date: s && typeof s.date === "string" ? s.date : null,
    /* What that day had actually reached when the copy was taken. The one
       figure that tells two snapshots of the same afternoon apart. */
    pct: num(row && row.pct),
    done: row && Array.isArray(row.done) ? row.done.length : null,
    core: s && Array.isArray(s.habits) ? s.habits.filter((h) => h && h.core).length : null,
    counts: {
      habits: len("habits"),
      tasks: len("tasks"),
      goals: len("goals"),
      books: len("books"),
      history: len("history"),
      events: len("events"),
      quotes: len("quotes"),
      reading: len("reading"),
      badHabits: len("badHabits"),
      sessions: len("sessions"),
      reviews: len("reviews"),
      income: len("income"),
    },
  };
  snapCache.set(key, out);
  /* Bounded, and trimmed from the oldest insertion — a Map iterates in
     insertion order, so the first key is the stalest. */
  while (snapCache.size > 800) snapCache.delete(snapCache.keys().next().value);
  return out;
}

function snapList() {
  const kinds = [];
  for (const [kind, { dir, label }] of Object.entries(SNAP_KINDS)) {
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    const items = names
      .filter((n) => SNAP_NAME.test(n) && SNAP_PREFIX.test(n))
      .map((n) => snapSummary(dir, n))
      .filter(Boolean)
      .sort((a, b) => b.at - a.at)
      .slice(0, SNAP_PER_KIND);
    kinds.push({ kind, label, items });
  }
  return kinds;
}

/* One snapshot's contents, by kind and name. The name has to survive the
   regex *and* be in the directory listing taken a moment ago. */
function snapRead(kind, name) {
  const spec = Object.prototype.hasOwnProperty.call(SNAP_KINDS, kind)
    ? SNAP_KINDS[kind]
    : null;
  if (!spec) return null;
  if (!SNAP_NAME.test(name) || !SNAP_PREFIX.test(name)) return null;
  let names;
  try {
    names = fs.readdirSync(spec.dir);
  } catch {
    return null;
  }
  if (!names.includes(name)) return null;
  try {
    const text = fs.readFileSync(path.join(spec.dir, name), "utf8");
    JSON.parse(text); // refuse to hand back something unparseable
    return text;
  } catch {
    return null;
  }
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

/* --- the test copy's one concession ------------------------------------ *
 *  The app writes to disk only from one named origin, because two origins
 *  writing to one file is two copies of a year taking turns overwriting each
 *  other. That rule is what makes a second copy safe to run — and it is also
 *  what would make a second copy untestable, since the write path is the half
 *  most worth testing.
 *
 *  So a server that is not the live one tells the page it serves that it is
 *  the primary copy *for this server*, which is the same rule the write-origin
 *  check above already applies. Nothing is injected on the live port, and the
 *  live page has no idea this exists.
 * ---------------------------------------------------------------------- */
const LIVE_PORT = 47615;
const DECLARE_PRIMARY =
  `<script>window.LIFE_OS_PRIMARY = "http://${HOST}:${PORT}";</script>`;

function servePage(res, full) {
  let html;
  try {
    html = fs.readFileSync(full, "utf8");
  } catch {
    return end(res, 404, "not found");
  }
  const out = html.replace("<body>", "<body>" + DECLARE_PRIMARY);
  return end(res, 200, out, {
    "Content-Type": TYPES[".html"],
    "Content-Length": Buffer.byteLength(out, "utf8"),
    "Cache-Control": "no-cache",
  });
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
  if (PORT !== LIVE_PORT && type === TYPES[".html"]) return servePage(res, full);
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
    /* The snapshots on disk, listed and handed back. See SNAP_KINDS: a
       request names a kind and a file, and the file has to be one readdir
       just listed in that kind's own directory. No path joining of anything
       the request said. */
    if (url.pathname === "/snapshots") {
      let body;
      try {
        body = JSON.stringify({ now: Date.now(), kinds: snapList() });
      } catch {
        return end(res, 500);
      }
      return end(res, 200, body, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
    }
    if (url.pathname.startsWith("/snapshots/")) {
      let rest;
      try {
        rest = decodeURIComponent(url.pathname.slice(11));
      } catch {
        return end(res, 400);
      }
      const at = rest.indexOf("/");
      if (at <= 0) return end(res, 404);
      const text = snapRead(rest.slice(0, at), rest.slice(at + 1));
      if (text === null) return end(res, 404);
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

    /* The report, as a page rather than as the file. GRAPH_REPORT.md is
       still served raw at /graphify/report.md — that is the artifact — but
       a browser has no renderer for text/markdown and drops it on screen as
       one unstyled wall. This reads it and renders it. */
    if (url.pathname === "/report" || url.pathname === "/report/") {
      return serveFile(res, path.join(SITE, "report.html"), 1);
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
  if (!writeOriginOk(origin)) return end(res, 403, "not the primary origin");

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

    /* What is already on disk, read before anything is written over it. Two
       questions are asked of it: is the payload coming in older than what is
       here, and does it lose rows. */
    let disk = null;
    try {
      disk = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      /* No file yet, or an unreadable one. Either way there is nothing to be
         older than and nothing to lose. */
    }

    /* Last-writer-wins is what let a sleeping window put yesterday back. Now
       a write that is behind the file is refused, and the app asks which copy
       was meant rather than guessing. `X-Force: 1` is that answer — and it
       stows the file it is about to overwrite first, because "keep this
       window" is still destructive, just deliberately so.

       lifeos only: it is the one of the three that carries a revision and a
       logical day, and a guard that compares fields another app does not have
       would refuse writes for no reason. */
    const forced = req.headers["x-force"] === "1";
    /* A restore from the recovery centre. It is a deliberate overwrite of a
       perfectly good file with an older one, so the file it lands on is
       stowed first no matter what the shapes say — `shrinkReason` would miss
       a restore that happens to add rows, and the one copy a restore must
       never destroy is the one the user was about to undo back to. */
    const guarded = req.headers["x-guard"] === "1";
    let duplicate = false;
    if (name === "lifeos" && disk && !forced) {
      const theirs = Number(disk.rev);
      const mine = Number(msg.payload.rev);
      const numbered = Number.isFinite(theirs) && Number.isFinite(mine);
      /* Behind the file: the clear case, and the only one the first version of
         this guard tested. */
      const behind = numbered && mine < theirs;
      /* Level with the file, which is two different things wearing one
         number. Identical contents are a retry of a write that already
         landed — answered 200 and *not* written again, because rewriting it
         would push the real previous generation out of .prev.json for
         nothing. Different contents are two divergent copies, and letting
         that through is the hole this guard was supposed to close: a window
         holding a 17-habit snapshot saved its way up to the revision of the
         22-habit copy on disk and then overwrote it. */
      const level = numbered && mine === theirs;
      const same = level && payloadHash(disk) !== null && payloadHash(disk) === payloadHash(msg.payload);
      const divergent = level && !same;
      const olderDay =
        typeof disk.date === "string" &&
        typeof msg.payload.date === "string" &&
        msg.payload.date < disk.date;
      duplicate = same;
      if (!same && (behind || divergent || olderDay)) {
        /* A payload with no revision at all is the first write after this
           shipped, and it is let through: the counter has to start somewhere
           and refusing it would lock the app out of its own file. */
        return end(res, 409, JSON.stringify({ rev: theirs || 0, date: disk.date || null }), {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
      }
    }

    /* The write already on disk, sent again. Nothing is touched — no file, no
       .prev.json, no snapshot — and the answer is the one the first attempt
       should have got, so the save stamp reads «القرص ✓» rather than parking
       on a failure the disk does not actually have. */
    if (duplicate) {
      let savedAt = Date.now();
      try {
        savedAt = fs.statSync(file).mtimeMs;
      } catch {}
      if (!QUIET) {
        console.log(
          new Date().toTimeString().slice(0, 8) +
            "  " +
            name.padEnd(8) +
            PROJECTS[name].padEnd(14) +
            "same r" +
            Number(msg.payload.rev),
        );
      }
      return end(res, 200, JSON.stringify({ rev: Number(msg.payload.rev) || 0, savedAt }), {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
    }

    const savedAt = Date.now();
    try {
      if (name === "lifeos") {
        const why = forced
          ? "forced over a newer copy"
          : guarded
            ? "asked for before a restore"
            : shrinkReason(disk, msg.payload);
        if (why) guardSnapshot(name, JSON.stringify(disk, null, 2), why);
      }
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
      const rev = Number.isFinite(Number(msg.payload.rev)) ? " r" + Number(msg.payload.rev) : "";
      console.log(
        stamp + "  " + name.padEnd(8) + PROJECTS[name].padEnd(14) + bytes + " B" + rev,
      );
    }
    /* The revision and the time are handed back rather than a bare 204: the
       save stamp says «القرص ✓ at HH:MM» and it may only say it when the disk
       itself confirmed. A guessed timestamp is the thing that bug was. */
    end(res, 200, JSON.stringify({ rev: Number(msg.payload.rev) || 0, savedAt }), {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
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
    /* Relative to this file, which lives in services/ — so one level up and
       into src/. A dynamic import resolves against the module's own URL and
       not against ROOT, and the catch below swallows a miss: point this at
       the wrong folder and the serving half carries on perfectly while every
       prayer reminder stops arriving, with nothing in any log. */
    ({ blockTimes } = await import("../src/utils/prayer-times.mjs"));
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
  console.log("  daily " + DAILY);
  console.log("  guard " + GUARD);
});

armToday();
scheduleRoll();
