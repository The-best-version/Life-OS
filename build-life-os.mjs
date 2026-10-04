/**
 * Builds LifeOS.jsx into the one self-contained page the shortcut opens.
 *
 *   node build-life-os.mjs
 *
 * Output: life-os/index.html, plus life-os/LifeOS.source.jsx — the source
 * copied beside the build so the two can never drift apart. Until this
 * existed the procedure lived in CLAUDE.md as prose and was retyped by hand
 * every time, which is exactly how a build stops matching the source it
 * claims to be.
 *
 * Three things about it are not obvious:
 *
 * - There is no node_modules beside LifeOS.jsx and no package.json. What it
 *   needs — esbuild, tailwindcss, lucide-react — already sits in
 *   iron-log/node_modules, so esbuild is imported from there and told to
 *   resolve packages there too, through `nodePaths`. Nothing is installed,
 *   nothing is copied, and nothing is fetched.
 *
 * - React is not bundled. It loads as a UMD build from cdnjs and the bundle
 *   reaches it through shims that read window.React. Bundling the React 19
 *   in iron-log beside a page that loads 18.3.1 would give the app two
 *   copies of React and one of them would own the hooks.
 *
 * - The Tailwind CSS is generated from LifeOS.jsx itself rather than kept as
 *   a file, so a class used once on a new screen cannot be missing from it.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "LifeOS.jsx");
const site = join(root, "life-os");
const modules = join(root, "iron-log", "node_modules");
const work = mkdtempSync(join(tmpdir(), "life-os-build-"));

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
    nodePaths: [modules], // lucide-react lives over in iron-log
    alias: { react: reactShim, "react-dom": domShim, "react-dom/client": clientShim },
    define: { "process.env.NODE_ENV": '"production"' },
    legalComments: "none",
  });
  const js = built.outputFiles[0].text;

  // 3. The exact CSS these class names need — scanned off the source.
  copyFileSync(src, join(work, "LifeOS.jsx"));
  writeFileSync(
    join(work, "tailwind.config.js"),
    "module.exports = { content: ['./LifeOS.jsx'], theme: { extend: {} }, plugins: [] };\n",
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
</body>
</html>
`;

  //    Joined, never String.replace: a bundle used as a replacement string
  //    has its $& and $' read as substitution patterns and comes out quietly
  //    corrupted.
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, "index.html"), [head, css, mid, js, tail].join(""), "utf8");
  copyFileSync(src, join(site, "LifeOS.source.jsx"));

  const kb = (n) => (n / 1024).toFixed(0) + " KB";
  console.log(`\nlife-os/index.html          css ${kb(css.length)}   js ${kb(js.length)}`);
  console.log("life-os/LifeOS.source.jsx   in step with LifeOS.jsx");
} finally {
  try {
    rmSync(work, { recursive: true, force: true });
  } catch {}
}
