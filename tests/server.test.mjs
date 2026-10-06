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

test("a write level with the file but holding something else is refused", async () => {
  /* The hole. The revision counter lives in each window's own localStorage,
     so a window holding a stale snapshot keeps numbering its own saves and
     eventually hands up the number already on disk. `mine < theirs` is false
     at that point, and last-writer-wins is back. */
  const full = fixture();
  const fewer = { ...full, rev: 5, habits: full.habits.slice(0, full.habits.length - 5) };
  const res = await sync(fewer);
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.rev, 5);
  assert.equal(onDisk().habits.length, full.habits.length, "the level write landed anyway");
});

test("the same payload at the same revision is a retry, not a conflict", async () => {
  /* A request that is cut off after the server wrote it, or a flush that
     overlaps the debounced write it was flushing. The write already landed;
     refusing the second copy would raise the conflict bar over nothing. */
  const prevBefore = readFileSync(join(data, "lifeos.prev.json"), "utf8");
  const guardBefore = backups("guard").length;
  const res = await sync({ ...fixture(), rev: 5 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.rev, 5);
  assert.equal(onDisk().rev, 5);
  assert.equal(
    readFileSync(join(data, "lifeos.prev.json"), "utf8"),
    prevBefore,
    "a retry pushed the real previous generation out of .prev.json",
  );
  assert.equal(backups("guard").length, guardBefore, "a retry was guarded");
});

test("a retry whose keys come out in another order is still a retry", async () => {
  /* The same state serialized by two code paths can come out key-ordered
     differently, and comparing the text rather than the contents would read
     that as two divergent copies. */
  const same = { ...fixture(), rev: 5 };
  const shuffled = {};
  for (const k of Object.keys(same).reverse()) shuffled[k] = same[k];
  const res = await sync(shuffled);
  assert.equal(res.status, 200);
  assert.equal(onDisk().habits.length, fixture().habits.length);
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

test("the copy that caught up cannot overwrite the copy that was recovered", async () => {
  /* The whole bug, end to end: a recovered copy on disk, a stale window whose
     counter has climbed to the same number, and a habit list five rows
     shorter arriving to sit on top of it. */
  const recovered = { ...fixture(), rev: 100 };
  assert.equal((await sync(recovered)).status, 200);
  const stale = {
    ...fixture(),
    rev: 100,
    habits: fixture().habits.slice(0, fixture().habits.length - 5),
    books: fixture().books.slice(0, Math.max(0, fixture().books.length - 1)),
  };
  assert.equal((await sync(stale)).status, 409);
  assert.equal(onDisk().habits.length, recovered.habits.length);
  assert.equal(onDisk().books.length, recovered.books.length);
  /* And a window that answers «اعتمد هذه النافذة» still gets its way — the
     guard refuses a guess, not a decision. */
  assert.equal((await sync(stale, { force: true })).status, 200);
  assert.equal(onDisk().habits.length, stale.habits.length);
});

/* ===================================================================== *
 *  /snapshots — the recovery centre's half of the deal
 * ===================================================================== */

const snapshots = async () => {
  const res = await fetch(BASE + "/snapshots", { headers: { Origin: BASE } });
  assert.equal(res.status, 200);
  return res.json();
};

const kindOf = (json, kind) => json.kinds.find((k) => k.kind === kind) || null;

test("/snapshots lists what is on disk, with enough to tell two apart", async () => {
  await sync({ ...fixture(), rev: 300 });
  const json = await snapshots();
  for (const kind of ["auto", "daily", "guard", "manual", "verified"]) {
    assert.ok(kindOf(json, kind), `${kind} is missing from the listing`);
    assert.ok(typeof kindOf(json, kind).label === "string");
  }
  const auto = kindOf(json, "auto");
  assert.ok(auto.items.length >= 1, "the hourly snapshot was not listed");
  const item = auto.items[0];
  assert.ok(item.ok, "a snapshot this server just wrote came back unreadable");
  assert.equal(item.rev, 300);
  assert.equal(item.date, fixture().date);
  assert.equal(item.counts.habits, fixture().habits.length);
  assert.equal(item.counts.history, fixture().history.length);
  assert.ok(item.size > 0 && item.at > 0);
  /* The name is what the read route takes back, so it has to be in the row. */
  assert.ok(/^lifeos-.*\.json$/.test(item.name));
});

test("/snapshots hands back one snapshot by name", async () => {
  await sync({ ...fixture(), rev: 310 });
  const { name } = kindOf(await snapshots(), "daily").items[0];
  const res = await fetch(`${BASE}/snapshots/daily/${encodeURIComponent(name)}`, {
    headers: { Origin: BASE },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.rev, 310);
  assert.equal(body.habits.length, fixture().habits.length);
});

test("a snapshot name is matched, never joined onto a path", async () => {
  /* No path joining, by construction: a name has to pass the regex *and* be
     in the directory listing taken a moment earlier. Every one of these is a
     404 rather than a file from somewhere else on the drive. */
  const attempts = [
    "auto/../../../graphify-out/data/lifeos.json",
    "auto/" + encodeURIComponent("../../lifeos.json"),
    "auto/..%2F..%2Flifeos.json",
    "auto/lifeos.json",
    "auto/" + encodeURIComponent("lifeos-2026-10-06-16.json/../../../../etc/hosts"),
    "bogus/lifeos-2026-10-06-16.json",
    "auto/not-this-app-2026.json",
    "auto",
    "auto/",
  ];
  for (const path of attempts) {
    const res = await fetch(`${BASE}/snapshots/${path}`, { headers: { Origin: BASE } });
    assert.equal(res.status, 404, `${path} answered ${res.status}`);
  }
});

test("an unreadable snapshot is listed as unreadable, not hidden", async () => {
  writeFileSync(join(data, "backups", "manual", "lifeos-broken-test.json"), "{ not json");
  const manual = kindOf(await snapshots(), "manual");
  const row = manual.items.find((i) => i.name === "lifeos-broken-test.json");
  assert.ok(row, "a corrupted snapshot vanished from the listing");
  assert.equal(row.ok, false);
  assert.equal(row.rev, null);
  /* And it cannot be handed back as state. */
  const res = await fetch(`${BASE}/snapshots/manual/lifeos-broken-test.json`, {
    headers: { Origin: BASE },
  });
  assert.equal(res.status, 404);
});

test("the listing re-reads a snapshot that changed under it", async () => {
  /* The summaries are cached by size and mtime, because parsing every file on
     every click would read megabytes to answer one question. The hourly
     snapshot is overwritten within its own hour, so the cache has to notice. */
  await sync({ ...fixture(), rev: 320 });
  assert.equal(kindOf(await snapshots(), "daily").items[0].rev, 320);
  await sync({ ...fixture(), rev: 321, water: 3 });
  assert.equal(kindOf(await snapshots(), "daily").items[0].rev, 321);
});

test("X-Guard stows the file before a restore lands on it", async () => {
  /* A restore is an older copy deliberately overwriting a newer one, and
     `shrinkReason` cannot catch it: the snapshot may well have *more* rows.
     Without the guard, the copy the user would undo back to is simply gone. */
  await sync({ ...fixture(), rev: 400 });
  const before = backups("guard").length;
  const bigger = {
    ...fixture(),
    rev: 401,
    habits: [...fixture().habits, { id: "zz1", label: "مستعادة", group: "morning", done: false }],
  };
  const res = await fetch(BASE + "/sync", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "X-Local-Sync": "1",
      "X-Force": "1",
      "X-Guard": "1",
      Origin: BASE,
    },
    body: JSON.stringify({ project: "lifeos", payload: bigger }),
  });
  assert.equal(res.status, 200);
  assert.equal(onDisk().habits.length, bigger.habits.length);
  const after = backups("guard");
  assert.equal(after.length, before + 1, "nothing was stowed before the restore");
  /* And what was stowed is the copy that was replaced, so restoring it is
     how the restore is undone. */
  const stowed = JSON.parse(
    readFileSync(join(data, "backups", "guard", after.sort().at(-1)), "utf8"),
  );
  assert.equal(stowed.rev, 400);
  assert.equal(stowed.habits.length, fixture().habits.length);
});
