/* --- the seams between the source files --------------------------------
 *  LifeOS.jsx is no longer one file. It reads its primitives off
 *  life-shared.jsx, the university desk off life-uni.jsx, the save path off
 *  life-storage.mjs, the state off life-state.mjs and the prayer maths off
 *  prayer-times.mjs — and every one of those seams is a place a helper can
 *  be left behind.
 *
 *  CLAUDE.md has said since the first split that a helper left behind is a
 *  ReferenceError at first render and a blank white page. That turned out to
 *  be the optimistic case. The dangerous one is a name used only inside the
 *  try/catch that every storage read is required to have: `api`, `UI_KEY`,
 *  `OPENED_KEY` and `HANDOVER_KEY` were all missing from the import after
 *  life-storage.mjs was carved out, every reference to them sat inside a
 *  catch, and the page rendered perfectly while `pullDisk` never read the
 *  disk, `readUI` always came back empty and the recovery centre listed
 *  nothing. Nothing threw where anyone could see it.
 *
 *  esbuild cannot catch this. An undefined identifier is not an unresolved
 *  import — it bundles to a bare global reference and the build is clean. So
 *  it is checked here, by text: for every name a module exports, if this file
 *  uses that name and neither imports nor declares it, the module that owns
 *  it is named and the build stops.
 *
 *  Text and not a parser on purpose: there is no node_modules beside these
 *  files and nothing is installed, which is the same constraint that keeps
 *  life-state.mjs browser-free. A regex over stripped source is coarser than
 *  an AST and catches this class of bug completely.
 * --------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/* The source lives under src/ now, grouped into features, components,
   layouts, state and utils. Every name in MODULES and CONSUMERS below is a
   path relative to that, so a file that moves between folders fails here
   loudly instead of being silently skipped. */
const srcDir = join(root, "src");
const read = (f) => readFileSync(join(srcDir, f), "utf8");
/* The build script is not source — it sits beside src/, not inside it. */
const readRoot = (f) => readFileSync(join(root, f), "utf8");

/* A relative specifier, resolved to a path relative to src/. Imports read
   "../state/life-state.mjs" from a feature and "./life-shared.jsx" from a
   sibling, and every check below needs the one canonical spelling — the key
   MODULES and CONSUMERS are written in. Posix throughout: these are import
   specifiers, not filesystem paths. */
const resolveSpec = (fromFile, spec) => {
  const dir = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/")) : "";
  const parts = (dir ? dir.split("/") : []).concat(spec.split("/"));
  const out = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
};
const LOCAL_SPEC = /from\s*["'](\.[^"']+)["']/g;

/* The modules that export into the tree, and the files that consume them.
   life-shared.jsx and life-uni.jsx are on both lists: they import from each
   other's side of the split as well as from the state.

   life-state.mjs is itself split by domain now — life-state-util.mjs holds
   the dependency-free helpers every domain file is built on, seven domain
   files sit on top of it, and life-state.mjs is a thin core plus a barrel
   that re-exports all seven so no outside consumer's imports change. That
   makes life-state.mjs, and the one domain file that reads a sibling
   (life-state-streak.mjs reads `disciplineOf` off life-state-habits.mjs),
   consumers of this same split in their own right. */
const MODULES = [
  "features/life-settings.jsx",
  "layouts/life-nav.jsx",
  "features/life-matrix.jsx",
  "features/life-today.jsx",
  "features/life-routine.jsx",
  "features/life-analytics.jsx",
  "features/life-agenda.jsx",
  "features/life-vault.jsx",
  "features/life-goals.jsx",
  "state/life-state.mjs",
  "features/life-breaker.jsx",
  "utils/prayer-times.mjs",
  "utils/life-storage.mjs",
  "components/life-shared.jsx",
  "features/life-uni.jsx",
  "features/life-finance.jsx",
  "features/life-desks.jsx",
  "features/life-tools.jsx",
  "layouts/life-styles.jsx",
  "components/life-day.jsx",
  "state/life-state-util.mjs",
  "state/life-state-habits.mjs",
  "state/life-state-tasks.mjs",
  "state/life-state-goals.mjs",
  "state/life-state-books.mjs",
  "state/life-state-calendar.mjs",
  "state/life-state-uni.mjs",
  "state/life-state-streak.mjs",
];
const CONSUMERS = [
  "features/life-settings.jsx",
  "layouts/life-nav.jsx",
  "features/life-matrix.jsx",
  "features/life-today.jsx",
  "features/life-routine.jsx",
  "features/life-analytics.jsx",
  "features/life-agenda.jsx",
  "features/life-vault.jsx",
  "features/life-goals.jsx",
  "LifeOS.jsx",
  "features/life-breaker.jsx",
  "components/life-shared.jsx",
  "features/life-uni.jsx",
  "features/life-finance.jsx",
  "features/life-desks.jsx",
  "features/life-tools.jsx",
  "layouts/life-styles.jsx",
  "components/life-day.jsx",
  "utils/life-storage.mjs",
  "state/life-state.mjs",
  "state/life-state-habits.mjs",
  "state/life-state-tasks.mjs",
  "state/life-state-goals.mjs",
  "state/life-state-books.mjs",
  "state/life-state-calendar.mjs",
  "state/life-state-uni.mjs",
  "state/life-state-streak.mjs",
];

function exportsOf(src) {
  const names = new Set();
  for (const m of src.matchAll(
    /^export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm,
  ))
    names.add(m[1]);
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const part of m[1].split(",")) {
      const t = part.trim().split(/\s+as\s+/).pop().trim();
      if (t) names.add(t);
    }
  return names;
}

function importsOf(src) {
  const names = new Set();
  for (const m of src.matchAll(
    /import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([^}]*)\}\s*from/g,
  )) {
    if (m[1]) names.add(m[1]);
    for (const part of m[2].split(",")) {
      const t = part.trim().split(/\s+as\s+/).pop().trim();
      if (t) names.add(t);
    }
  }
  for (const m of src.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*,?\s*from/g)) names.add(m[1]);
  /* A bare re-export — `export { A, B } from "./mod.mjs"` — pulls a name in
     from another module exactly as an import does, which is how
     life-state.mjs re-exports the eight domain files it is built from
     without binding every one of their names locally. Left out of this scan,
     every such name would read as "used but never imported". */
  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    for (const part of m[1].split(",")) {
      const t = part.trim().split(/\s+as\s+/).pop().trim();
      if (t) names.add(t);
    }
  }
  return names;
}

/* Comments and string literals out, or every name mentioned in the prose
   above a function reads as a use of it — and this project's comments name
   nearly everything. The backtick class is built rather than written so the
   regex literal does not have to carry one. */
const BQ = String.fromCharCode(96);
const TEMPLATE = new RegExp(BQ + "(?:[^" + BQ + "\\\\]|\\\\.)*" + BQ, "g");

/* A template literal is not a string: `${meetWord(n)} مسجّلة` is prose
   *and* a call, and blanking the whole thing hides the call. This kept one
   name out of this check completely — `meetWord` was used only inside
   interpolations in the code carved out to life-breaker.jsx, so it was
   never counted as used, never reported as unimported, and the screen threw
   a ReferenceError on open with the tests green and the build clean. Which
   is the precise failure this file exists to prevent.

   So the literal text goes and the interpolations stay. Brace-matched
   rather than regexed, because `${x ? {a: 1} : null}` closes twice. */
const interpolations = (tpl) => {
  const out = [];
  let i = 0;
  for (;;) {
    const open = tpl.indexOf("${", i);
    if (open === -1) break;
    let depth = 1;
    let k = open + 2;
    while (k < tpl.length && depth > 0) {
      if (tpl[k] === "{") depth++;
      else if (tpl[k] === "}") depth--;
      k++;
    }
    out.push(tpl.slice(open + 2, k - 1));
    i = k;
  }
  return " " + out.join(" ") + " ";
};

const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(TEMPLATE, interpolations);

function declaredIn(body) {
  const names = new Set();
  for (const m of body.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))
    names.add(m[1]);
  return names;
}

/* A property access is not a free variable: `.done` is not the exported
   `done`. The lookbehind drops anything preceded by a dot or a word
   character, which is what separates `row.date` from `date`. */
function usedIn(body) {
  const names = new Set();
  for (const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  return names;
}

const EXPORTED = new Map(MODULES.map((f) => [f, exportsOf(read(f))]));

for (const file of CONSUMERS) {
  test(`${file} imports every split-module name it uses`, () => {
    const src = read(file);
    const body = strip(src);
    const imported = importsOf(src);
    const declared = declaredIn(body);
    const used = usedIn(body);

    const missing = [];
    for (const [mod, names] of EXPORTED) {
      if (mod === file) continue;
      for (const name of names)
        if (used.has(name) && !imported.has(name) && !declared.has(name))
          missing.push(`${name} — exported by ${mod}`);
    }

    assert.deepEqual(
      missing.sort(),
      [],
      `${file} uses these without importing or declaring them. Each one is a` +
        ` ReferenceError, and inside a try/catch it is a feature that silently` +
        ` does nothing:\n  ` + missing.sort().join("\n  "),
    );
  });
}

/* The other half of the same seam: a name imported from a module the module
   does not actually export. esbuild does catch this one — it is a hard build
   error — but it catches it after the tests have passed, and the point of
   running the tests first is that they are what stops a broken change. */
for (const file of CONSUMERS) {
  test(`${file} imports nothing a split module does not export`, () => {
    const src = read(file);
    const bad = [];
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'](\.[^"']+)["']/g)) {
      const mod = resolveSpec(file, m[2]);
      const names = EXPORTED.get(mod);
      if (!names) continue; // react, lucide-react, anything not ours
      for (const part of m[1].split(",")) {
        const want = part.trim().split(/\s+as\s+/)[0].trim();
        if (want && !names.has(want)) bad.push(`${want} — not exported by ${mod}`);
      }
    }
    assert.deepEqual(bad.sort(), [], bad.sort().join("\n  "));
  });
}

/* The build script follows nothing: esbuild follows the imports, but the
   Tailwind scan and the published source copy are handed exactly the files
   the script names. So the two lists it names are held against what the
   source actually imports.
     Missing from `shipped`, and life-os/LifeOS.source.jsx is a source that
   cannot be built — the one thing it exists to not be. That is what happened
   to life-storage.mjs after it was carved out of LifeOS.jsx.
     Missing from `scanned`, and a class used only in that file is absent from
   the CSS and the screen renders unstyled. That is what happened to
   life-uni.jsx, thirty-odd classes short. */
const arrayIn = (src, name) => {
  const m = src.match(new RegExp("const\\s+" + name + "\\s*=\\s*\\[([^\\]]*)\\]"));
  assert.ok(m, `scripts/build-life-os.mjs no longer declares a \`${name}\` array`);
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
};

/* Every local file the app is actually made of, walked transitively from the
   entry point. Deliberately NOT derived from CONSUMERS: that list is itself
   hand-written, so reading it here would mean a file left off it is a file
   left out of every check that follows — the omission would hide itself.
   The imports are the one description of the source that cannot go stale. */
const reachable = () => {
  const seen = new Set(["LifeOS.jsx"]);
  const queue = ["LifeOS.jsx"];
  while (queue.length)
  {
    const from = queue.pop();
    for (const m of read(from).matchAll(LOCAL_SPEC)) {
      const target = resolveSpec(from, m[1]);
      if (!seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return seen;
};

const localImports = () => {
  const wanted = reachable();
  wanted.delete("LifeOS.jsx"); // copied under its own name, as LifeOS.source.jsx
  return wanted;
};

/* --- the two lists this file is itself built from ----------------------
 *  Everything above checks the source against MODULES and CONSUMERS. Those
 *  two arrays are hand-written, and a new file missing from them is the one
 *  failure in this whole scheme that announces nothing at all: the tests go
 *  green, and the file is simply not guarded. The build catches a file left
 *  out of `scanned` or `shipped`; nothing caught a file left out of here.
 *  So the arrays are held against the imports too.
 *    This found life-storage.mjs, which imports `uid` off life-state.mjs and
 *  had never been on CONSUMERS — the module whose four missing names caused
 *  the incident this file exists for, with its own imports unchecked.
 * --------------------------------------------------------------------- */
test("every module the source imports is guarded as a MODULE", () => {
  const absent = [...localImports()].filter((f) => !MODULES.includes(f)).sort();
  assert.deepEqual(
    absent,
    [],
    "missing from MODULES, so nothing checks that the names these export are" +
      " imported where they are used:\n  " + absent.join("\n  "),
  );
});

test("every file that imports a local module is guarded as a CONSUMER", () => {
  const absent = [...reachable()]
    .filter((f) => /from\s*["']\./.test(read(f)) && !CONSUMERS.includes(f))
    .sort();
  assert.deepEqual(
    absent,
    [],
    "missing from CONSUMERS, so nothing checks that these import every name" +
      " they use:\n  " + absent.join("\n  "),
  );
});

test("the build copies every local module the source imports", () => {
  const build = readRoot("scripts/build-life-os.mjs");
  const shipped = new Set(arrayIn(build, "shipped"));
  const absent = [...localImports()].filter((f) => !shipped.has(f)).sort();
  assert.deepEqual(
    absent,
    [],
    "not copied into life-os/, so the published source cannot be built:\n  " +
      absent.join("\n  "),
  );
});

test("the Tailwind scan reads every file that can hold a class name", () => {
  const build = readRoot("scripts/build-life-os.mjs");
  const scanned = new Set(arrayIn(build, "scanned"));
  const absent = [...localImports()]
    .filter((f) => f.endsWith(".jsx") && !scanned.has(f))
    .sort();
  assert.deepEqual(
    absent,
    [],
    "classes used only in these are dropped from the built CSS:\n  " + absent.join("\n  "),
  );
});

/* --- the bug the four missing names caused ----------------------------
 *  pullDisk is in LifeOS.jsx, which the tests cannot load — it touches
 *  window, document and React. What can be loaded is the module it reads
 *  the disk through, and the contract it depends on: a recovered profile has
 *  to come back carrying the revision the file already holds. Start it at
 *  zero and its first save arrives behind every revision on disk, the server
 *  is right to refuse it, and the conflict bar is the only thing the user
 *  ever sees. That is what a broken `api` reference produced.
 * --------------------------------------------------------------------- */
test("the recovery path seeds the revision counter from the disk copy", async () => {
  const store = new Map();
  const g = globalThis;
  const hadWindow = "window" in g;
  const hadLocation = "location" in g;
  const prevWindow = g.window;
  const prevLocation = g.location;
  const prevFetch = g.fetch;

  const disk = { habits: [{ id: "a", label: "قراءة" }], date: "2026-10-07", rev: 393 };
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };

  g.window = { localStorage, LIFE_OS_PRIMARY: "http://127.0.0.1:47615" };
  g.location = { origin: "http://127.0.0.1:47615", protocol: "http:", hostname: "127.0.0.1" };

  try {
    const { adoptDisk, served, api, readRev, STORAGE_KEY } = await import("../src/utils/life-storage.mjs");

    /* The seam the whole write path hangs off: served() true means this copy
       writes, and api() goes same-origin. If `api` is not reachable from the
       caller, this is the call that throws. */
    assert.equal(served(), true);
    assert.equal(api("/state?project=lifeos"), "/state?project=lifeos");

    let asked = null;
    g.fetch = (url) => {
      asked = String(url);
      return Promise.resolve({ ok: true, status: 200, json: async () => disk });
    };

    await adoptDisk();

    assert.equal(asked, "/state?project=lifeos");
    assert.equal(readRev(), 393, "a recovered profile must not start behind the file");
    const back = JSON.parse(store.get(STORAGE_KEY));
    assert.equal(back.rev, undefined, "the revision belongs to the write, not to the day");
    assert.deepEqual(back.habits, disk.habits);
  } finally {
    if (hadWindow) g.window = prevWindow;
    else delete g.window;
    if (hadLocation) g.location = prevLocation;
    else delete g.location;
    g.fetch = prevFetch;
  }
});

/* --- a helper that moved, and the file that still calls it -------------
   The two checks above only know about names a module *exports*. That is
   the whole surface they can see, and it has a hole in it exactly the size
   of this bug: carve a helper into another file, forget to export it, and
   the file it came from still calls it. esbuild bundles that as a bare
   global reference and says nothing, the tests above have no export to
   match it against, and the screen throws on open.

   `horizonClock`, `clockLabel` and `HorizonRow` all moved to life-goals.jsx
   while life-routine.jsx went on calling them, and nothing caught it but
   the blank screen.

   So: for every pair of our files, a name declared at the top level of one
   and used by another that neither declares nor imports it. Scoped to our
   own declarations on purpose — that is what makes it free of the false
   positives a general free-variable scan drowns in (every lowercase JSX
   tag, every destructured `setX`). */
const topLevelDecls = (src) => {
  const names = new Set();
  for (const m of src.matchAll(
    /^(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm,
  ))
    names.add(m[1]);
  return names;
};

const ALL_FILES = [...new Set([...MODULES, ...CONSUMERS])];
const DECLARED_IN = new Map(ALL_FILES.map((f) => [f, topLevelDecls(read(f))]));

for (const file of ALL_FILES) {
  test(`${file} does not call a helper that lives in another file unimported`, () => {
    const src = read(file);
    const body = strip(src);
    const imported = importsOf(src);
    /* Everything this file binds, not only at the top level: a local
       `const rows = ...` inside a function shadows the `rows` another
       module happens to export, and reporting that would be noise. */
    const mine = declaredIn(body);
    const used = usedIn(body);

    /* `{ money: Wallet }` is a key, not a reference to anything, and this
       project's icon and tint tables are full of keys that collide with
       helper names elsewhere. A name counts as used only where it appears
       somewhere that is not immediately followed by a colon. */
    const reallyUsed = (name) =>
      new RegExp(`(?<![.\\w$])${name}(?!\\s*:)(?![\\w$])`).test(body);

    const missing = [];
    for (const [other, names] of DECLARED_IN) {
      if (other === file) continue;
      for (const name of names)
        if (used.has(name) && !imported.has(name) && !mine.has(name) && reallyUsed(name))
          missing.push(`${name} — declared at the top level of ${other}`);
    }

    assert.deepEqual(
      [...new Set(missing)].sort(),
      [],
      `${file} uses these and neither declares nor imports them. Each one is` +
        ` a ReferenceError the moment the screen renders: ` +
        [...new Set(missing)].sort().join(" · "),
    );
  });
}
