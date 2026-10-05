/* --- the sync server, exercised for real -------------------------------
 *  A real process on a throwaway port with a throwaway data directory, not a
 *  mock: the behaviour being tested is what the thing on disk ends up being,
 *  and a mock of fs tests the mock. Nothing here can touch the live copy —
 *  the port and the data directory are both arguments, which is the whole
 *  reason they became arguments.
 * --------------------------------------------------------------------- */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const PORT = 47701; // not 47615, and not the 47699 a person may be looking at
const BASE = `http://127.0.0.1:${PORT}`;

let data;
let child;

const fixture = () =>
  JSON.parse(readFileSync(join(here, "fixtures", "schema-20.json"), "utf8"));

function sync(payload, { force = false, origin } = {}) {
  const headers = { "Content-Type": "text/plain", "X-Local-Sync": "1" };
  if (force) headers["X-Force"] = "1";
  if (origin) headers.Origin = origin;
  return fetch(BASE + "/sync", {
    method: "POST",
    headers,
    body: JSON.stringify({ project: "lifeos", payload }),
  });
}

const onDisk = () => JSON.parse(readFileSync(join(data, "lifeos.json"), "utf8"));
const backups = (kind) => {
  const dir = join(data, "backups", kind);
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
};

before(async () => {
  data = mkdtempSync(join(tmpdir(), "life-os-test-"));
  mkdirSync(data, { recursive: true });
  child = spawn(
    process.execPath,
    [join(root, "local-sync-server.js"), "--port", String(PORT), "--data-dir", data, "--quiet"],
    { cwd: root, stdio: "ignore" },
  );
  /* Poll rather than sleep: the port is either listening or it is not, and a
     fixed wait is either too short on a cold start or wasted every run. */
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(BASE + "/state?project=lifeos");
      if (res.status === 404 || res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("the test server never came up on " + PORT);
});

after(() => {
  try {
    child?.kill();
  } catch {}
  try {
    rmSync(data, { recursive: true, force: true });
  } catch {}
});

test("a first write with no revision is accepted", async () => {
  const res = await sync({ ...fixture(), rev: undefined });
  assert.equal(res.status, 200);
  assert.ok(existsSync(join(data, "lifeos.json")));
});

test("a write answers with the revision and the time it landed", async () => {
  const res = await sync({ ...fixture(), rev: 5 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.rev, 5);
  assert.ok(Number.isFinite(body.savedAt));
  assert.equal(onDisk().rev, 5);
});

test("a write behind the file is refused with 409", async () => {
  const res = await sync({ ...fixture(), rev: 4 });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.rev, 5);
  assert.equal(onDisk().rev, 5, "the refused payload was written anyway");
});

test("a write from an older logical day is refused with 409", async () => {
  const stale = { ...fixture(), rev: 6, date: "2020-01-01" };
  const res = await sync(stale);
  assert.equal(res.status, 409);
  assert.notEqual(onDisk().date, "2020-01-01");
});

test("X-Force overrides the refusal and keeps the file it overwrites", async () => {
  const before = backups("guard").length;
  const res = await sync({ ...fixture(), rev: 2, habits: [] }, { force: true });
  assert.equal(res.status, 200);
  assert.equal(onDisk().rev, 2);
  const now = backups("guard");
  assert.ok(now.length > before, "nothing was stowed in backups/guard");
  const stowed = JSON.parse(readFileSync(join(data, "backups", "guard", now[now.length - 1]), "utf8"));
  assert.equal(stowed.rev, 5, "the stowed copy is not the one that was overwritten");
});

test("a shrinking write stows the version before it", async () => {
  /* Deleting is allowed — that is what the buttons are for. What is not
     allowed is the version before the deletion being gone five seconds
     later, which is all the single .prev.json beside the file could offer. */
  const full = { ...fixture(), rev: 20 };
  await sync(full);
  const before = backups("guard").length;
  const fewer = { ...full, rev: 21, habits: full.habits.slice(0, full.habits.length - 5) };
  const res = await sync(fewer);
  assert.equal(res.status, 200);
  const now = backups("guard");
  assert.ok(now.length > before, "a habit list cut by five was not guarded");
  const stowed = JSON.parse(readFileSync(join(data, "backups", "guard", now[now.length - 1]), "utf8"));
  assert.equal(stowed.habits.length, full.habits.length);
});

test("an ordinary edit is not guarded", async () => {
  const base = { ...fixture(), rev: 30 };
  await sync(base);
  const before = backups("guard").length;
  const edited = { ...base, rev: 31, habits: base.habits.map((h) => ({ ...h, done: !h.done })) };
  assert.equal((await sync(edited)).status, 200);
  assert.equal(backups("guard").length, before, "ticking habits triggered the guard");
});

test("emptying a list that had rows is guarded", async () => {
  const base = { ...fixture(), rev: 40 };
  await sync(base);
  const before = backups("guard").length;
  assert.equal((await sync({ ...base, rev: 41, goals: [] })).status, 200);
  assert.ok(backups("guard").length > before);
});

test("the hourly and daily snapshots are both written", async () => {
  await sync({ ...fixture(), rev: 50 });
  assert.ok(backups("auto").length >= 1, "no hourly snapshot");
  assert.ok(backups("daily").length >= 1, "no daily snapshot");
  const daily = backups("daily")[0];
  assert.match(daily, /^lifeos-\d{4}-\d{2}-\d{2}\.json$/);
});

test("the write before this one is kept beside the file", async () => {
  await sync({ ...fixture(), rev: 60 });
  await sync({ ...fixture(), rev: 61 });
  const prev = JSON.parse(readFileSync(join(data, "lifeos.prev.json"), "utf8"));
  assert.equal(prev.rev, 60);
});

test("only the origin this server serves may write", async () => {
  /* `localhost:PORT` and `127.0.0.1:PORT` are two origins to a browser, with
     two localStorages and two ideas of the day, and both of them writing to
     this one file is two copies of a year taking turns overwriting each
     other. Reading stays open; writing does not. */
  const foreign = await sync({ ...fixture(), rev: 70 }, { origin: `http://localhost:${PORT}` });
  assert.equal(foreign.status, 403);
  const own = await sync({ ...fixture(), rev: 70 }, { origin: BASE });
  assert.equal(own.status, 200);
});

test("a page on the open web is refused outright", async () => {
  const res = await sync({ ...fixture(), rev: 71 }, { origin: "https://example.com" });
  assert.equal(res.status, 403);
});

test("the write still needs its own header", async () => {
  const res = await fetch(BASE + "/sync", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ project: "lifeos", payload: fixture() }),
  });
  assert.equal(res.status, 403);
});

test("an unknown project is a 404, not a new file", async () => {
  const res = await fetch(BASE + "/sync", {
    method: "POST",
    headers: { "Content-Type": "text/plain", "X-Local-Sync": "1" },
    body: JSON.stringify({ project: "../escape", payload: {} }),
  });
  assert.equal(res.status, 404);
  assert.equal(existsSync(join(data, "..", "escape.json")), false);
});

test("/state hands back exactly what is on disk", async () => {
  await sync({ ...fixture(), rev: 80 });
  const res = await fetch(BASE + "/state?project=lifeos");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.rev, 80);
  assert.equal(body.habits.length, fixture().habits.length);
});
