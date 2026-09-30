#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 47615;
const HOST = "127.0.0.1";
const MAX_BODY = 2 * 1024 * 1024;
const QUIET = process.argv.includes("--quiet");

const ROOT = __dirname;
const DATA = path.join(ROOT, "graphify-out", "data");

const PROJECTS = {
  lifeos: "lifeos.json",
  step: "step.json",
  ironlog: "ironlog.json",
};

fs.mkdirSync(DATA, { recursive: true });

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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-local-sync");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function end(res, code) {
  try {
    res.writeHead(code);
    res.end();
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
// the data directory and would otherwise parse a half-flushed file.
function writeAtomic(file, text) {
  const tmp = file + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (!originOk(origin)) return end(res, 403);
  cors(res, origin);

  if (req.method === "OPTIONS") return end(res, 204);
  if (req.method !== "POST") return end(res, 405);
  if (req.headers["x-local-sync"] !== "1") return end(res, 403);

  let url;
  try {
    url = new URL(req.url, "http://" + HOST);
  } catch {
    return end(res, 400);
  }
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

    const file = Object.prototype.hasOwnProperty.call(PROJECTS, msg.project)
      ? PROJECTS[msg.project]
      : null;
    if (!file) return end(res, 404);
    if (msg.payload === undefined || msg.payload === null) return end(res, 400);

    let text;
    try {
      text = JSON.stringify(msg.payload, null, 2);
    } catch {
      return end(res, 400);
    }
    if (typeof text !== "string") return end(res, 400);

    try {
      writeAtomic(path.join(DATA, file), text);
    } catch {
      return end(res, 500);
    }

    if (!QUIET) {
      const stamp = new Date().toTimeString().slice(0, 8);
      console.log(stamp + "  " + msg.project.padEnd(8) + file.padEnd(14) + text.length + " B");
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
  console.log("local-sync-server  http://" + HOST + ":" + PORT + "/sync");
  console.log("  data  " + DATA);
});
