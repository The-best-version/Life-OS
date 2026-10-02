/**
 * Builds the whole app into one self-contained HTML file.
 *
 * Why this exists: `next build` needs a server, and a static export is no better
 * here — its client router fetches RSC payloads, which Chrome forbids over
 * file://. The point of this artefact is a desktop shortcut that opens the
 * tracker with no terminal and no localhost, so the app is re-bundled as a plain
 * SPA instead. Every page under `src/app` is already "use client", which is the
 * only reason that is possible: there is no server half to replace. The only
 * Next surface left — `next/link` and `usePathname` — is aliased to the two
 * shims in `scripts/standalone/shims`, through `tsconfig.standalone.json`.
 *
 *   npm run build:standalone
 *
 * Output: `standalone/index.html`. React is bundled rather than loaded from a
 * CDN: React 19 ships no UMD build, and a file that needs the network to start
 * is not standalone.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "standalone");
const work = mkdtempSync(join(tmpdir(), "ironlog-standalone-"));

try {
  // 1. The pre-paint theme script, read from its own module rather than copied,
  //    so this build can never drift from what `app/layout.tsx` injects.
  const themeModule = join(work, "theme-script.mjs");
  await esbuild.build({
    entryPoints: [join(root, "src/lib/theme-script.ts")],
    outfile: themeModule,
    bundle: true,
    format: "esm",
    platform: "node",
  });
  const { THEME_SCRIPT, CHROME_COLOR } = await import(pathToFileURL(themeModule).href);

  // 2. The app.
  const bundleFile = join(work, "bundle.js");
  await esbuild.build({
    entryPoints: [join(root, "scripts/standalone/entry.tsx")],
    outfile: bundleFile,
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2020",
    jsx: "automatic",
    tsconfig: join(root, "tsconfig.standalone.json"),
    define: { "process.env.NODE_ENV": '"production"' },
    legalComments: "none",
  });

  // 3. The exact CSS these class names need, generated from the project's own
  //    Tailwind config so the standalone and the dev server style identically.
  const cssFile = join(work, "app.css");
  //    Tailwind's own CLI entry is invoked through node rather than through the
  //    `.bin` shim: the shim is a .cmd on Windows, and Node refuses to spawn one
  //    without a shell — which would then need the project's space-bearing path
  //    quoted by hand.
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/tailwindcss/lib/cli.js"),
      "-c", join(root, "tailwind.config.ts"),
      "-i", join(root, "src/app/globals.css"),
      "-o", cssFile,
      "--minify",
    ],
    { cwd: root, stdio: "inherit" },
  );

  // 4. One file. Assembled by joining an array — never String.replace with the
  //    bundle as the replacement, because `$&` and `$'` inside minified JS are
  //    substitution patterns and would silently corrupt the output.
  const html = [
    "<!DOCTYPE html>",
    '<html lang="ar" dir="rtl">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">',
    `<meta name="theme-color" content="${CHROME_COLOR.light}">`,
    '<meta name="description" content="متتبع تمارين محلي بالكامل: سجّل المجموعات والأوزان وشاهد تقدّمك في رسوم واضحة.">',
    "<title>Iron Log — متتبع التمرين</title>",
    // Inline and synchronous, exactly as in the layout: a deferred script would
    // paint light and then flip.
    `<script>${THEME_SCRIPT}</script>`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    // The one network request in the file, and an optional one: the CSS stack in
    // globals.css falls back to the system sans when it does not arrive.
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap">',
    "<style>",
    readFileSync(cssFile, "utf8"),
    "</style>",
    "</head>",
    "<body>",
    '<div id="root"></div>',
    "<script>",
    readFileSync(bundleFile, "utf8"),
    "</script>",
    "</body>",
    "</html>",
    "",
  ].join("\n");

  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "index.html");
  writeFileSync(target, html, "utf8");
  console.log(`\nOK  ${target}  (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
