/**
 * Builds LifeOS.jsx into the one self-contained page the shortcut opens.
 *
 *   node scripts/build-life-os.mjs
 *   node scripts/build-life-os.mjs --watch   (rebuilds on every src/ change)
 *
 * Output: life-os/index.html, plus life-os/LifeOS.source.jsx — the source
 * copied beside the build so the two can never drift apart. Until this
 * existed the procedure lived in CLAUDE.md as prose and was retyped by hand
 * every time, which is exactly how a build stops matching the source it
 * claims to be.
 *
 * Three things about it are not obvious:
 *
 * - There is no node_modules beside `src/`, where LifeOS.jsx actually lives.
 *   What the build needs — esbuild, tailwindcss, lucide-react — sits in
 *   life-os/node_modules instead (a small package.json of its own, holding
 *   only those three; not an app), so esbuild is imported from there and
 *   told to resolve packages there too, through `nodePaths`. This borrowed
 *   from iron-log/node_modules until Iron Log was deleted (2026-10-26);
 *   moving it here keeps the same "no deps beside the source" shape without
 *   depending on a second project still existing.
 *
 * - React is not bundled. It loads as a UMD build from cdnjs and the bundle
 *   reaches it through shims that read window.React. Bundling a React of a
 *   different version in beside a page loading 18.3.1 would give the app
 *   two Reacts and one of them would own the hooks — which is why
 *   life-os/node_modules holds no React at all, only the three build tools.
 *
 * - The Tailwind CSS is generated from LifeOS.jsx itself rather than kept as
 *   a file, so a class used once on a new screen cannot be missing from it.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* This file lives in scripts/, so the project root is one level up. Every
   path below hangs off it — src/, life-os/ and tests/ — and resolving it
   from the script's own folder instead would point the whole build at
   scripts/ and fail on the entry point. */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const src = join(srcDir, "LifeOS.jsx");
/* Every local module the app is made of. The bundle's entry point is still
   just `src` — esbuild follows the imports on its own — but the other two
   things done with these files follow nothing: they are handed exactly what
   is named here.
     `scanned` are the files Tailwind reads class names out of. A .jsx file
   missing from it is a class silently absent from the CSS and a screen that
   renders unstyled with nothing in any log to say why; that is how the
   university desk shipped once, thirty classes short.
     `shipped` are the files copied beside the build, so that
   life-os/LifeOS.source.jsx is a source that can actually be built. A file
   missing from it is a published copy that looks complete and is not —
   life-storage.mjs was carved out of LifeOS.jsx and left off this list, so
   the shipped source had no save path at all.
     Both are written out in full rather than one spread into the other: a
   test reads these two arrays and holds them against what the source
   actually imports, and it can only read literals. */
const scanned = [
  "features/life-settings.jsx",
  "layouts/life-nav.jsx",
  "features/life-matrix.jsx",
  "features/life-today.jsx",
  "features/life-routine.jsx",
  "features/life-analytics.jsx",
  "features/life-agenda.jsx",
  "features/life-vault.jsx",
  "features/life-goals.jsx",
  "components/life-shared.jsx",
  "features/life-bot.jsx",
  "features/life-breaker.jsx",
  "components/life-day.jsx",
  "features/life-uni.jsx",
  "features/life-finance.jsx",
  "features/life-desks.jsx",
  "features/life-tools.jsx",
  "layouts/life-styles.jsx",
  "components/life-inbox.jsx",
  "components/life-command.jsx",
  "features/life-agent.jsx",
  "features/life-wrapped.jsx",
  "features/life-sleep.jsx",
  "features/life-review.jsx",
];
const shipped = [
  "life-config.js",
  "features/life-settings.jsx",
  "layouts/life-nav.jsx",
  "features/life-matrix.jsx",
  "features/life-today.jsx",
  "features/life-routine.jsx",
  "features/life-analytics.jsx",
  "features/life-agenda.jsx",
  "features/life-vault.jsx",
  "features/life-goals.jsx",
  "components/life-shared.jsx",
  "features/life-bot.jsx",
  "features/life-breaker.jsx",
  "components/life-day.jsx",
  "features/life-uni.jsx",
  "features/life-finance.jsx",
  "features/life-desks.jsx",
  "features/life-tools.jsx",
  "layouts/life-styles.jsx",
  "components/life-inbox.jsx",
  "components/life-command.jsx",
  "features/life-agent.jsx",
  "features/life-wrapped.jsx",
  "features/life-sleep.jsx",
  "features/life-review.jsx",
  "utils/life-agent.js",
  "state/agent-tools.js",
  "utils/prayer-times.mjs",
  "state/life-state.mjs",
  "utils/life-storage.mjs",
  "state/life-state-util.mjs",
  "state/life-state-habits.mjs",
  "state/life-state-tasks.mjs",
  "state/life-state-goals.mjs",
  "state/life-state-books.mjs",
  "state/life-state-calendar.mjs",
  "state/life-state-uni.mjs",
  "state/life-state-streak.mjs",
  "state/life-state-finance.mjs",
  "state/life-state-bot.mjs",
  "state/life-state-focus.mjs",
  "state/life-state-gym.mjs",
  "state/life-state-sleep.mjs",
];
const splitSrc = scanned.map((f) => join(srcDir, f));
const site = join(root, "life-os");
const modules = join(root, "life-os", "node_modules");

const esbuild = await import(pathToFileURL(join(modules, "esbuild", "lib", "main.js")).href);

/* The named exports the bundle reaches for, read off the global rather than
   re-exported from a module — there is no module to re-export from, the UMD
   build puts everything on window.React. */
const REACT_EXPORTS = [
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useLayoutEffect",
  "useId",
  "useReducer",
  "useContext",
  "createContext",
  "createElement",
  "cloneElement",
  "isValidElement",
  "Children",
  "Fragment",
  "StrictMode",
  "memo",
  "forwardRef",
];

/* One build, start to finish — tests, bundle, CSS, the one HTML file. Called
   once for a plain run, and again on every change under `--watch`, which is
   why it owns its own temp dir instead of sharing one across calls: a watch
   run that crashed mid-build must not leave the NEXT run writing into a
   directory the previous `finally` already deleted out from under it. */
async function runOnce() {
  const work = mkdtempSync(join(tmpdir(), "life-os-build-"));

  /* The tests first, and the build stops if they fail. There is no CI here
     and no second pair of eyes: this script is the only thing that runs
     between a change and the page he opens, so it is the only place a
     failing test can actually stop something. Skippable with --no-test for
     the rare case of debugging the build itself.
       Under `--watch` a failing test must not kill the watcher — the next
     save has to get its own chance — so this throws instead of exiting, and
     only the top-level, non-watch call below turns that throw into exit 1. */
  if (!process.argv.includes("--no-test")) {
    try {
      execFileSync(process.execPath, ["--test", "tests/*.test.mjs"], {
        cwd: root,
        stdio: "inherit",
      });
    } catch {
      throw new Error(
        "Build stopped: the tests failed. Fix them, or run with --no-test if you" +
          " are debugging the build itself — but then nothing is checking the state.",
      );
    }
  }

  try {
    // 1. The shims React resolves to.
    const shim = (name, body) => {
      const file = join(work, name);
      writeFileSync(file, body, "utf8");
      return file;
    };
    const reactShim = shim(
      "react-shim.js",
      "const R = window.React;\nexport default R;\n" +
        REACT_EXPORTS.map((n) => `export const ${n} = R.${n};`).join("\n") +
        "\n",
    );
    const domShim = shim(
      "react-dom-shim.js",
      "const D = window.ReactDOM;\nexport default D;\n" +
        ["createPortal", "flushSync", "render", "createRoot", "hydrateRoot"]
          .map((n) => `export const ${n} = D.${n};`)
          .join("\n") +
        "\n",
    );
    const clientShim = shim(
      "react-dom-client-shim.js",
      "const D = window.ReactDOM;\nexport default D;\nexport const createRoot = D.createRoot;\nexport const hydrateRoot = D.hydrateRoot;\n",
    );

    // 2. The bundle.
    const built = await esbuild.build({
      entryPoints: [src],
      bundle: true,
      write: false,
      minify: true,
      format: "iife",
      target: "es2020",
      jsx: "transform",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      loader: { ".jsx": "jsx" },
      nodePaths: [modules], // lucide-react lives in life-os/node_modules
      alias: { react: reactShim, "react-dom": domShim, "react-dom/client": clientShim },
      define: { "process.env.NODE_ENV": '"production"' },
      legalComments: "none",
    });
    const js = built.outputFiles[0].text;

    // 3. The exact CSS these class names need — scanned off every source
    //    file, the split ones included, or a class used only in life-uni.jsx
    //    comes out of the build silently absent and the university desk
    //    renders unstyled with nothing in any log to say why.
    for (const f of [src, ...splitSrc]) copyFileSync(f, join(work, basename(f)));
    writeFileSync(
      join(work, "tailwind.config.js"),
      "module.exports = { content: ['./*.jsx'], theme: { extend: {} }, plugins: [] };\n",
      "utf8",
    );
    writeFileSync(join(work, "in.css"), "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n", "utf8");
    execFileSync(
      process.execPath,
      [join(modules, "tailwindcss", "lib", "cli.js"), "-c", "tailwind.config.js", "-i", "in.css", "-o", "out.css", "--minify"],
      { cwd: work, stdio: "inherit" },
    );
    const css = readFileSync(join(work, "out.css"), "utf8").replace(/^﻿/, "");

    // 4. One file.
    const head = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0B1026">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="description" content="نظام انضباط يومي بالعربية — روتين، مصفوفة مهام، مكتبة كتب، وتتبّع شهري.">
<title>2027 Life OS</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap">
<style>
`;

    const mid = `</style>
</head>
<body>
<div id="root"><div id="boot">2027 LIFE OS</div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
(function(){
  if (window.React && window.ReactDOM) return;
  var b = document.getElementById('boot');
  if (b) { b.style.letterSpacing = 'normal'; b.textContent = 'تعذّر تحميل المكتبات. تأكّد من الاتصال بالإنترنت في أول تشغيل، وبعدها يعمل التطبيق بلا إنترنت.'; }
})();
</script>
<script>
`;

    const tail = `</script>
<script>
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
}
</script>
</body>
</html>
`;

    const swCode = `const CACHE_NAME = "athar-life-os-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest"];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS).catch(() => {})));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/state") || url.pathname.startsWith("/health") || url.pathname.startsWith("/ping")) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
`;

    //    Joined, never String.replace: a bundle used as a replacement string
    //    has its $& and $' read as substitution patterns and comes out quietly
    //    corrupted.
    mkdirSync(site, { recursive: true });
    writeFileSync(join(site, "index.html"), [head, css, mid, js, tail].join(""), "utf8");
    writeFileSync(join(site, "sw.js"), swCode, "utf8");
    copyFileSync(src, join(site, "LifeOS.source.jsx"));
    /* The folders come with them: the published copy has to be a source that
       actually builds, and LifeOS.source.jsx imports "./features/…". */
    for (const f of shipped) {
      const to = join(site, f);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(join(srcDir, f), to);
    }

    const kb = (n) => (n / 1024).toFixed(0) + " KB";
    console.log(`\nlife-os/index.html          css ${kb(css.length)}   js ${kb(js.length)}`);
    console.log("life-os/LifeOS.source.jsx   in step with LifeOS.jsx");
  } finally {
    try {
      rmSync(work, { recursive: true, force: true });
    } catch {}
  }
}

/* --watch: rebuild on every change under src/, so editing src/life-config.js
   (or anything else) in VS Code and hitting Ctrl+S is enough — no second
   terminal command between a save and the page he reloads (he still reloads
   the page himself; there is no live-reload socket here, only a build that
   no longer needs typing). It still runs the full test suite on every
   rebuild: a config file is still code, and the whole point of running the
   tests first is that they are what stops a broken change — in watch mode
   exactly as in a one-shot build.
     `fs.watch` with `recursive: true` is a Windows-native capability (and
   this app ships on Windows only), so no extra dependency and no polling.
   Debounced, because saving a file is not always one write — some editors
   write a temp file and rename it, which is two events a millisecond apart
   for one save. A build that throws (a failing test, a bad import) is
   caught and logged so the watcher keeps running for the next save, rather
   than the whole process dying on the first red test. */
async function watch() {
  console.log(
    "⏱  يراقب src/ للتغييرات — عدّل ملفًا واحفظه (Ctrl+S)، والبناء يُعاد تلقائيًا.\n   Ctrl+C للإيقاف.\n",
  );
  try {
    await runOnce();
  } catch (e) {
    console.error("\n" + e.message);
  }
  const { watch: fsWatch } = await import("node:fs");
  let timer = null;
  fsWatch(srcDir, { recursive: true }, (_event, filename) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      console.log(`\n[watch] ${filename ?? "ملف"} تغيّر — إعادة البناء...`);
      try {
        await runOnce();
      } catch (e) {
        console.error("\n" + e.message);
      }
    }, 250);
  });
}

if (process.argv.includes("--watch")) {
  await watch();
} else {
  try {
    await runOnce();
  } catch (e) {
    console.error("\n" + e.message);
    process.exit(1);
  }
}
