#!/usr/bin/env node
/**
 * report-agent.js — Master Subagent, read-only.
 *
 * Reads three independent projects WITHOUT touching them:
 *   LifeOS.jsx            → daily routine / discipline / 2027 goals
 *   step-arena.html       → STEP preparation
 *   iron-log/             → gym tracker
 *
 * and writes exactly three SVG charts into graphify-out/.
 *
 * Source cascade, per project:
 *   1. live snapshot  — graphify-out/data/*.json  (localStorage payload)
 *   2. project source — constants sliced out of the file and evaluated in a vm
 * Nothing outside graphify-out/ is ever written.
 *
 * Zero dependencies. Node >= 18.
 *
 * Usage:
 *   node report-agent.js [--root <dir>] [--data <dir>] [--out <dir>] [--quiet]
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* ══════════════════════════════════════════════════════════════════ */
/* Config                                                              */
/* ══════════════════════════════════════════════════════════════════ */

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const QUIET = argv.includes("--quiet");

const ROOT = path.resolve(flag("root", __dirname));
const OUT = path.resolve(flag("out", path.join(ROOT, "graphify-out")));
const DATA = path.resolve(flag("data", path.join(OUT, "data")));

const SRC = {
  lifeos: path.join(ROOT, "LifeOS.jsx"),
  step: path.join(ROOT, "step-arena.html"),
  gymSeed: path.join(ROOT, "iron-log", "src", "lib", "seed.ts"),
  gymTypes: path.join(ROOT, "iron-log", "src", "lib", "types.ts"),
};

const log = (...a) => {
  if (!QUIET) console.log(...a);
};

/* ══════════════════════════════════════════════════════════════════ */
/* Read-only file helpers                                              */
/* ══════════════════════════════════════════════════════════════════ */

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** Newest JSON file in DATA matching any of the given patterns. */
function snapshot(patterns) {
  let names;
  try {
    names = fs.readdirSync(DATA);
  } catch {
    return null;
  }
  const hits = names
    .filter((n) => n.toLowerCase().endsWith(".json"))
    .filter((n) => patterns.some((p) => p.test(n)))
    .map((n) => {
      const full = path.join(DATA, n);
      let mtime = 0;
      try {
        mtime = fs.statSync(full).mtimeMs;
      } catch {}
      return { full, n, mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const h of hits) {
    try {
      const parsed = JSON.parse(fs.readFileSync(h.full, "utf8"));
      if (parsed && typeof parsed === "object") return { data: parsed, name: h.n };
    } catch {}
  }
  return null;
}

/** A dump may be the value itself, or a {"prefix:key": value} localStorage map. */
function unwrap(obj, prefix) {
  if (!obj || typeof obj !== "object") return {};
  const keys = Object.keys(obj);
  if (keys.some((k) => k.startsWith(prefix))) {
    const out = {};
    for (const k of keys) {
      const short = k.startsWith(prefix) ? k.slice(prefix.length) : k;
      let v = obj[k];
      if (typeof v === "string") {
        try {
          v = JSON.parse(v);
        } catch {}
      }
      out[short] = v;
    }
    return out;
  }
  return obj;
}

/* ══════════════════════════════════════════════════════════════════ */
/* Source extraction — slice a `const NAME = …;` and evaluate it       */
/* ══════════════════════════════════════════════════════════════════ */

/** Walks source from `i`, returns index just past the balanced expression. */
function scanToSemicolon(src, i) {
  let depth = 0;
  const tpl = []; // template-literal nesting depths
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];

    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && n === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === "`") {
      i++;
      while (i < src.length) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === "`") {
          i++;
          break;
        }
        if (src[i] === "$" && src[i + 1] === "{") {
          tpl.push(depth);
          depth++;
          i += 2;
          // fall back into code mode
          let d = 1;
          while (i < src.length && d > 0) {
            if (src[i] === "{") d++;
            else if (src[i] === "}") d--;
            else if (src[i] === '"' || src[i] === "'" || src[i] === "`") {
              const q = src[i++];
              while (i < src.length && src[i] !== q) {
                if (src[i] === "\\") i++;
                i++;
              }
            }
            i++;
          }
          depth--;
          tpl.pop();
          continue;
        }
        i++;
      }
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === ";" && depth === 0) return i;
    i++;
  }
  return i;
}

/** Returns the full text `const NAME = …;` or null. */
function sliceDecl(src, name) {
  const re = new RegExp(
    "(?:^|[\\n;])[ \\t]*(?:export[ \\t]+)?const[ \\t]+" + name + "\\b",
    "m",
  );
  const m = re.exec(src);
  if (!m) return null;

  // Find the assignment `=` at depth 0, skipping any TS type annotation.
  let i = m.index + m[0].length;
  let depth = 0;
  let eq = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (
      c === "=" &&
      depth === 0 &&
      src[i + 1] !== "=" &&
      !"=!<>+-*/%&|^".includes(src[i - 1])
    ) {
      eq = i;
      break;
    }
    if (c === ";" && depth === 0) return null;
  }
  if (eq < 0) return null;

  const end = scanToSemicolon(src, eq + 1);
  let body = src.slice(eq + 1, end);
  body = body.replace(/\bas\s+const\b/g, "");
  return "const " + name + " =" + body + ";";
}

/** A permissive value for any identifier the slice happens to reference. */
function makeStub() {
  const f = function () {
    return [];
  };
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.iterator || k === Symbol.toPrimitive || k === "then")
        return undefined;
      if (k === "length") return 0;
      if (k === "name") return "stub";
      return makeStub();
    },
    apply() {
      return [];
    },
  });
}

/**
 * Evaluates `names` (in order) out of `src` and returns a map of their values.
 * Unknown identifiers are stubbed on demand, so a slice may safely reference
 * icons, helpers or constants that were not asked for.
 */
function evalConsts(src, names) {
  if (!src) return {};
  const decls = [];
  const found = [];
  for (const n of names) {
    const d = sliceDecl(src, n);
    if (d) {
      decls.push(d);
      found.push(n);
    }
  }
  if (!found.length) return {};

  const sandbox = {
    uid: () => "s" + Math.random().toString(36).slice(2, 10),
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Map,
    Set,
    isNaN,
    parseInt,
    parseFloat,
  };
  const code =
    decls.join("\n") +
    "\n;({" +
    found.map((n) => n + ": " + n).join(", ") +
    "})";

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const ctx = vm.createContext({ ...sandbox });
      return vm.runInContext(code, ctx, { timeout: 4000 }) || {};
    } catch (err) {
      const miss = /(\w+) is not defined/.exec(String(err && err.message));
      if (miss && !(miss[1] in sandbox)) {
        sandbox[miss[1]] = makeStub();
        continue;
      }
      return {};
    }
  }
  return {};
}

/* ══════════════════════════════════════════════════════════════════ */
/* Date helpers — the week opens on Saturday, as iron-log does         */
/* ══════════════════════════════════════════════════════════════════ */

const iso = (d) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");

const parseIso = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

function weekStart(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 1) % 7));
  return x;
}

const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

const MONTH_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/* ══════════════════════════════════════════════════════════════════ */
/* SVG kit                                                             */
/* ══════════════════════════════════════════════════════════════════ */

const FONT = "Tajawal, Cairo, 'Segoe UI', system-ui, sans-serif";
const C = {
  coral: "#FF5722",
  emerald: "#10B981",
  amber: "#FFB020",
  rose: "#FF3B5C",
  violet: "#9D5CFF",
  cyan: "#00C2FF",
  blue: "#5B8CFF",
  pink: "#FF4D8D",
  orange: "#FF7A45",
};
const INK = "#FFF6F0";
const MUTED = "rgba(255,246,240,0.56)";
const FAINT = "rgba(255,246,240,0.30)";
const LINE = "rgba(255,225,210,0.18)";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const num = (n, d = 0) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.0+$/, "") : "0";

/** Arabic label. Under direction:rtl the text START is its RIGHT edge, so
    text-anchor="start" is what right-aligns it — "end" would run off-canvas. */
const ar = (x, y, t, o = {}) =>
  `<text x="${x}" y="${y}" fill="${o.fill || INK}" font-size="${o.size || 13}" font-weight="${o.weight || 500}" text-anchor="${o.anchor || "start"}" style="direction:rtl;unicode-bidi:isolate">${esc(t)}</text>`;

/** Latin / numeric label — isolated so it never flips inside Arabic text. */
const lt = (x, y, t, o = {}) =>
  `<text x="${x}" y="${y}" fill="${o.fill || INK}" font-size="${o.size || 13}" font-weight="${o.weight || 600}" text-anchor="${o.anchor || "start"}" style="direction:ltr;unicode-bidi:isolate">${esc(t)}</text>`;

function doc(w, h, body, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2A2028"/>
    <stop offset="55%" stop-color="#1B1418"/>
    <stop offset="100%" stop-color="#120C10"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#FF5722" stop-opacity="0.10"/>
    <stop offset="55%" stop-color="#FF5722" stop-opacity="0.02"/>
    <stop offset="100%" stop-color="#9D5CFF" stop-opacity="0.07"/>
  </linearGradient>
  <linearGradient id="title" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0%" stop-color="#FF5722"/>
    <stop offset="100%" stop-color="#FFB020"/>
  </linearGradient>
${defs}
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
${body}
</svg>
`;
}

function card(x, y, w, h) {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="rgba(255,255,255,0.045)" stroke="${LINE}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="url(#sheen)"/></g>`;
}

/** Page header: gradient title on the right, source badge on the left. */
function header(w, title, sub, source) {
  const live = source === "live";
  const badge = live ? "لقطة حيّة" : "بنية المشروع";
  const bc = live ? C.emerald : C.amber;
  return [
    `<text x="${w - 32}" y="52" fill="url(#title)" font-size="28" font-weight="800" text-anchor="start" style="direction:rtl;unicode-bidi:isolate">${esc(title)}</text>`,
    ar(w - 32, 78, sub, { size: 13, fill: MUTED, weight: 500 }),
    `<rect x="32" y="30" width="118" height="28" rx="14" fill="${bc}" fill-opacity="0.16" stroke="${bc}" stroke-opacity="0.55"/>`,
    `<circle cx="${live ? 50 : 50}" cy="44" r="4" fill="${bc}"/>`,
    `<text x="91" y="49" fill="${bc}" font-size="12" font-weight="700" text-anchor="middle" style="direction:rtl;unicode-bidi:isolate">${esc(badge)}</text>`,
  ].join("\n");
}

function panelTitle(x, y, t, sub) {
  return (
    ar(x, y, t, { size: 15, weight: 700 }) +
    (sub ? "\n" + ar(x, y + 19, sub, { size: 11.5, fill: MUTED, weight: 500 }) : "")
  );
}

/** Horizontal bars, RTL: bars grow from the right edge leftwards. */
function barsRTL(x, y, w, h, rows, opts = {}) {
  if (!rows.length) return emptyNote(x, y, w, h, opts.empty || "لا توجد بيانات");
  const labelW = opts.labelW || 128;
  const valueW = 52;
  const trackRight = x + w - labelW;
  const trackW = Math.max(40, w - labelW - valueW);
  const max = Math.max(opts.max || 0, ...rows.map((r) => r.value)) || 1;
  const gap = 12;
  const bh = Math.max(
    10,
    Math.min(26, (h - gap * (rows.length - 1)) / rows.length),
  );
  const step = bh + gap;
  const out = [];
  rows.forEach((r, i) => {
    const by = y + i * step;
    const bw = Math.max(3, (r.value / max) * trackW);
    out.push(
      ar(x + w, by + bh * 0.72, r.label, { size: 12.5, weight: 600 }),
      `<rect x="${trackRight - trackW}" y="${by}" width="${trackW}" height="${bh}" rx="${bh / 2}" fill="rgba(255,255,255,0.055)"/>`,
      `<rect x="${trackRight - bw}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${r.color}"/>`,
      lt(trackRight - trackW - 10, by + bh * 0.72, r.text != null ? r.text : num(r.value), {
        size: 12,
        anchor: "end",
        fill: r.color,
        weight: 700,
      }),
    );
  });
  return out.join("\n");
}

/** Columns with an optional goal line. Newest at the LEFT (RTL time flow). */
function columnsRTL(x, y, w, h, points, opts = {}) {
  if (!points.length) return emptyNote(x, y, w, h, opts.empty || "لا توجد بيانات");
  const max = Math.max(opts.max || 0, ...points.map((p) => p.value), 1);
  const n = points.length;
  const slot = w / n;
  const bw = Math.min(opts.barWidth || 26, slot * 0.62);
  const base = y + h;
  const out = [`<line x1="${x}" y1="${base}" x2="${x + w}" y2="${base}" stroke="${LINE}"/>`];

  if (opts.goal > 0 && opts.goal <= max) {
    const gy = base - (opts.goal / max) * h;
    out.push(
      `<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="${C.emerald}" stroke-opacity="0.65" stroke-dasharray="5 5"/>`,
      lt(x + 4, gy - 6, "goal " + num(opts.goal), {
        size: 10.5,
        fill: C.emerald,
        weight: 700,
      }),
    );
  }

  points.forEach((p, i) => {
    // RTL: index 0 (newest) sits at the right edge.
    const cx = x + w - (i + 0.5) * slot;
    const bh = Math.max(2, (p.value / max) * h);
    const hit = opts.goal > 0 && p.value >= opts.goal;
    const col = p.color || (hit ? C.emerald : C.coral);
    out.push(
      `<rect x="${cx - bw / 2}" y="${base - bh}" width="${bw}" height="${bh}" rx="${Math.min(7, bw / 2)}" fill="${col}" fill-opacity="${p.value ? 0.92 : 0.25}"/>`,
    );
    if (p.value)
      out.push(
        lt(cx, base - bh - 7, num(p.value, p.decimals || 0), {
          size: 10.5,
          anchor: "middle",
          fill: col,
          weight: 700,
        }),
      );
    if (p.label && (n <= 14 || i % 2 === 0))
      out.push(
        lt(cx, base + 16, p.label, { size: 10, anchor: "middle", fill: FAINT, weight: 600 }),
      );
  });
  return out.join("\n");
}

/** Contribution-style heatmap. Weeks flow right → left; rows are Sat…Fri. */
function heatmap(x, y, w, weeks, valueOf, opts = {}) {
  const cell = opts.cell || 15;
  const gap = 4;
  const rowLabels = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
  const gridW = weeks * (cell + gap) - gap;
  const left = x + w - gridW - 22;
  const out = [];
  const today = new Date();
  const thisWeek = weekStart(today);

  rowLabels.forEach((rl, r) => {
    out.push(
      ar(x + w, y + r * (cell + gap) + cell * 0.8, rl, {
        size: 10,
        fill: FAINT,
        weight: 600,
      }),
    );
  });

  let lastMonth = -1;
  for (let wk = 0; wk < weeks; wk++) {
    const start = addDays(thisWeek, -(weeks - 1 - wk) * 7);
    const cx = left + (weeks - 1 - wk) * (cell + gap);
    if (start.getMonth() !== lastMonth) {
      lastMonth = start.getMonth();
      out.push(
        ar(cx + cell, y - 8, MONTH_AR[lastMonth], {
          size: 9.5,
          fill: FAINT,
          weight: 600,
        }),
      );
    }
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, d);
      if (day > today) continue;
      const v = valueOf(iso(day));
      const cy = y + d * (cell + gap);
      let fill = "rgba(255,255,255,0.055)";
      let op = 1;
      if (v != null) {
        const t = Math.max(0, Math.min(1, v / 100));
        fill = t >= (opts.target || 80) / 100 ? C.emerald : C.coral;
        op = 0.2 + t * 0.8;
      }
      out.push(
        `<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" rx="4" fill="${fill}" fill-opacity="${op.toFixed(2)}"/>`,
      );
    }
  }
  return out.join("\n");
}

/** Radar over N axes, values 0…1. */
function radar(cx, cy, r, axes, opts = {}) {
  if (!axes.length) return "";
  const n = axes.length;
  const pt = (i, t) => {
    // Start at 12 o'clock, travel counter-clockwise so it reads right-to-left.
    const a = -Math.PI / 2 - (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r * t, cy + Math.sin(a) * r * t];
  };
  const out = [];
  for (const ring of [0.25, 0.5, 0.75, 1]) {
    const pts = axes.map((_, i) => pt(i, ring).map((v) => v.toFixed(1)).join(","));
    out.push(
      `<polygon points="${pts.join(" ")}" fill="none" stroke="${LINE}" stroke-opacity="${ring === 1 ? 1 : 0.55}"/>`,
    );
  }
  axes.forEach((_, i) => {
    const [px, py] = pt(i, 1);
    out.push(
      `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${LINE}" stroke-opacity="0.5"/>`,
    );
  });

  const poly = axes
    .map((a, i) => pt(i, Math.max(0.03, Math.min(1, a.value))).map((v) => v.toFixed(1)).join(","))
    .join(" ");
  out.push(
    `<polygon points="${poly}" fill="${C.coral}" fill-opacity="0.22" stroke="${C.coral}" stroke-width="2"/>`,
  );

  axes.forEach((a, i) => {
    const [px, py] = pt(i, Math.max(0.03, Math.min(1, a.value)));
    out.push(
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${a.color || C.coral}" stroke="#1B1418" stroke-width="1.5"/>`,
    );
    const [lx, ly] = pt(i, 1.30);
    // RTL label: anchor "end" makes it grow rightwards, "start" leftwards.
    const arAnchor = lx > cx + 6 ? "end" : lx < cx - 6 ? "start" : "middle";
    const ltAnchor = lx > cx + 6 ? "start" : lx < cx - 6 ? "end" : "middle";
    out.push(
      `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" fill="${INK}" font-size="11.5" font-weight="600" text-anchor="${arAnchor}" style="direction:rtl;unicode-bidi:isolate">${esc(a.label)}</text>`,
      `<text x="${lx.toFixed(1)}" y="${(ly + 18).toFixed(1)}" fill="${a.color || MUTED}" font-size="10.5" font-weight="700" text-anchor="${ltAnchor}" style="direction:ltr;unicode-bidi:isolate">${esc(a.text != null ? a.text : Math.round(a.value * 100) + "%")}</text>`,
    );
  });
  return out.join("\n");
}

/** Line + area trend. Oldest at the right, newest at the left (RTL). */
function trendRTL(x, y, w, h, series, opts = {}) {
  if (series.length < 2)
    return emptyNote(x, y, w, h, opts.empty || "نقطتان على الأقل مطلوبتان");
  const max = Math.max(opts.max || 0, ...series.map((p) => p.value), 1);
  const n = series.length;
  const px = (i) => x + w - (i / (n - 1)) * w; // i = 0 is newest
  const py = (v) => y + h - (v / max) * h;
  const pts = series.map((p, i) => [px(i), py(p.value)]);
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = `${x + w},${y + h} ${line} ${px(n - 1).toFixed(1)},${y + h}`;
  const out = [
    `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${LINE}"/>`,
  ];
  if (opts.goal > 0 && opts.goal <= max) {
    const gy = py(opts.goal);
    out.push(
      `<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="${C.emerald}" stroke-opacity="0.6" stroke-dasharray="5 5"/>`,
      lt(x + 4, gy - 6, "target " + num(opts.goal), {
        size: 10.5,
        fill: C.emerald,
        weight: 700,
      }),
    );
  }
  out.push(
    `<polygon points="${area}" fill="${C.coral}" fill-opacity="0.16"/>`,
    `<polyline points="${line}" fill="none" stroke="${C.coral}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`,
  );
  pts.forEach((p, i) => {
    const v = series[i].value;
    const col = opts.goal && v >= opts.goal ? C.emerald : C.coral;
    out.push(
      `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="${col}" stroke="#1B1418" stroke-width="1.5"/>`,
    );
    if (n <= 12)
      out.push(
        lt(p[0], p[1] - 11, num(v), {
          size: 10.5,
          anchor: "middle",
          fill: col,
          weight: 700,
        }),
      );
    if (series[i].label && n <= 12)
      out.push(
        lt(p[0], y + h + 16, series[i].label, {
          size: 9.5,
          anchor: "middle",
          fill: FAINT,
          weight: 600,
        }),
      );
  });
  return out.join("\n");
}

/** Row of KPI tiles, laid out right → left. */
function tilesRTL(x, y, w, tiles, opts = {}) {
  const h = opts.height || 64;
  const gap = 12;
  const n = tiles.length || 1;
  const tw = (w - gap * (n - 1)) / n;
  const out = [];
  tiles.forEach((t, i) => {
    const tx = x + w - (i + 1) * tw - i * gap;
    out.push(
      `<rect x="${tx}" y="${y}" width="${tw}" height="${h}" rx="14" fill="rgba(255,255,255,0.05)" stroke="${LINE}"/>`,
      `<rect x="${tx + tw - 4}" y="${y + 12}" width="3" height="${h - 24}" rx="2" fill="${t.color || C.coral}"/>`,
      ar(tx + tw - 14, y + 24, t.label, { size: 11, fill: MUTED, weight: 600 }),
      `<text x="${tx + tw - 14}" y="${y + 50}" fill="${t.color || INK}" font-size="21" font-weight="800" text-anchor="end" style="direction:ltr;unicode-bidi:isolate">${esc(t.value)}</text>`,
    );
  });
  return out.join("\n");
}

function emptyNote(x, y, w, h, text) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="rgba(255,255,255,0.03)" stroke="${LINE}" stroke-dasharray="6 6"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + 5}" fill="${FAINT}" font-size="12.5" font-weight="600" text-anchor="middle" style="direction:rtl;unicode-bidi:isolate">${esc(text)}</text>`
  );
}

function stamp(w, h) {
  const d = new Date();
  const t =
    iso(d) +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0");
  return (
    lt(32, h - 18, t, { size: 10.5, fill: FAINT, weight: 600 }) +
    "\n" +
    ar(w - 32, h - 18, "report-agent · للقراءة فقط", {
      size: 10.5,
      fill: FAINT,
      weight: 600,
    })
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* 1 · STEP                                                            */
/* ══════════════════════════════════════════════════════════════════ */

const SEC_AR = {
  Grammar: "القواعد",
  Reading: "القراءة",
  Vocabulary: "المفردات",
  Listening: "الاستماع",
};
const SEC_COLOR = {
  Grammar: C.coral,
  Reading: C.emerald,
  Vocabulary: C.violet,
  Listening: C.amber,
};

function extractStep() {
  const snap = snapshot([/^step/i, /arena/i]);
  const src = read(SRC.step);
  const statics = evalConsts(src, ["PILLARS", "SEED_VOCAB", "MOCK_SECTIONS"]);

  const out = {
    source: "static",
    file: path.basename(SRC.step),
    sections: [],
    mocks: [],
    activity: {},
    vocab: { new: 0, reviewing: 0, mastered: 0 },
    streak: 0,
    notes: 0,
  };

  // Structure: the four pillars carry a baseline percentage.
  const PILLAR_AR = {
    grammar: "القواعد",
    reading: "القراءة",
    writing: "التحليل الكتابي",
    vocab: "المفردات والاستماع",
  };
  const PILLAR_COLOR = {
    grammar: C.coral,
    reading: C.violet,
    writing: C.emerald,
    vocab: C.amber,
  };
  if (Array.isArray(statics.PILLARS)) {
    out.sections = statics.PILLARS.map((p) => ({
      key: p.id,
      label: PILLAR_AR[p.id] || p.ar || p.en || p.id,
      color: PILLAR_COLOR[p.id] || C.coral,
      value: Number(p.pct) || 0,
    }));
  }
  if (Array.isArray(statics.SEED_VOCAB))
    for (const v of statics.SEED_VOCAB)
      if (v && out.vocab[v.status] != null) out.vocab[v.status]++;

  if (!snap) return out;

  const d = unwrap(snap.data, "step:");
  const usable =
    Array.isArray(d.mock) ||
    Array.isArray(d.vocab) ||
    (d.activity && typeof d.activity === "object");
  if (!usable) return out; // a JSON file that is not a STEP dump
  out.source = "live";
  out.file = snap.name;
  out.mocks = Array.isArray(d.mock) ? d.mock.slice() : [];
  out.activity = d.activity && typeof d.activity === "object" ? d.activity : {};
  out.streak = Number(d.streak) || 0;
  out.notes = Array.isArray(d.notes) ? d.notes.length : 0;

  if (Array.isArray(d.vocab)) {
    out.vocab = { new: 0, reviewing: 0, mastered: 0 };
    for (const v of d.vocab) if (v && out.vocab[v.status] != null) out.vocab[v.status]++;
  }

  // Section mastery = answered-correct share across every recorded mock.
  const agg = {};
  for (const m of out.mocks) {
    const by = (m && m.bySec) || {};
    for (const k of Object.keys(by)) {
      agg[k] = agg[k] || { correct: 0, total: 0 };
      agg[k].correct += Number(by[k].correct) || 0;
      agg[k].total += Number(by[k].total) || 0;
    }
  }
  const keys = Object.keys(agg);
  if (keys.length)
    out.sections = keys.map((k) => ({
      key: k,
      label: SEC_AR[k] || k,
      color: SEC_COLOR[k] || C.coral,
      value: agg[k].total ? Math.round((agg[k].correct / agg[k].total) * 100) : 0,
    }));

  return out;
}

function chartStep(d) {
  const W = 980,
    H = 540;
  const b = [];
  b.push(header(W, "تقدّم STEP", "إتقان الأقسام، ومسار الاختبارات التجريبية", d.source));

  // ── KPI row
  const mocks = d.mocks;
  const best = mocks.length ? Math.max(...mocks.map((m) => Number(m.score) || 0)) : 0;
  const last = mocks.length ? Number(mocks[0].score) || 0 : 0;
  const avgSec = d.sections.length
    ? Math.round(d.sections.reduce((s, x) => s + x.value, 0) / d.sections.length)
    : 0;
  const attempts = Object.values(d.activity).reduce(
    (s, r) => s + (Number(r && r.attempts) || 0),
    0,
  );
  b.push(
    tilesRTL(32, 100, W - 64, [
      { label: "متوسّط الإتقان", value: avgSec + "%", color: C.coral },
      { label: "أفضل درجة تجريبية", value: mocks.length ? best + "%" : "—", color: C.amber },
      { label: "آخر درجة", value: mocks.length ? last + "%" : "—", color: C.emerald },
      { label: "أسئلة مُجابة", value: String(attempts || 0), color: C.cyan },
      { label: "سلسلة الأيام", value: String(d.streak || 0), color: C.violet },
    ]),
  );

  // ── Left card: mock trend (or vocabulary split when no mocks yet)
  const cw = (W - 64 - 16) / 2;
  b.push(card(32, 190, cw, 300));
  const hasTrend = mocks.length >= 2;
  b.push(
    panelTitle(
      32 + cw - 20,
      222,
      hasTrend ? "مسار الاختبارات التجريبية" : "حالة المفردات",
      hasTrend ? "الأحدث على اليسار · الهدف ٧٠٪" : "مقسّمة حسب درجة الإتقان",
    ),
  );
  if (hasTrend) {
    b.push(
      trendRTL(
        32 + 28,
        268,
        cw - 56,
        180,
        mocks.slice(0, 10).map((m, i) => ({
          value: Number(m.score) || 0,
          label: "#" + (mocks.length - i),
        })),
        { max: 100, goal: 70 },
      ),
    );
  } else {
    const rows = [
      { label: "متقن", value: d.vocab.mastered, color: C.emerald },
      { label: "مراجعة", value: d.vocab.reviewing, color: C.violet },
      { label: "جديد", value: d.vocab.new, color: C.amber },
    ];
    b.push(barsRTL(32 + 24, 272, cw - 48, 150, rows, { labelW: 76 }));
    b.push(
      ar(32 + cw - 20, 462, "المصدر: SEED_VOCAB داخل step-arena.html", {
        size: 11,
        fill: FAINT,
      }),
    );
  }

  // ── Right card: section mastery
  const rx = 32 + cw + 16;
  b.push(card(rx, 190, cw, 300));
  b.push(
    panelTitle(
      rx + cw - 20,
      222,
      "إتقان الأقسام",
      d.source === "live" ? "من سجل الاختبارات التجريبية" : "من PILLARS داخل الملف",
    ),
  );
  b.push(
    barsRTL(
      rx + 24,
      268,
      cw - 48,
      180,
      d.sections.map((s) => ({
        label: s.label,
        value: s.value,
        text: s.value + "%",
        color: s.color || SEC_COLOR[s.key] || C.coral,
      })),
      { max: 100, labelW: 136 },
    ),
  );

  b.push(stamp(W, H));
  return doc(W, H, b.join("\n"));
}

/* ══════════════════════════════════════════════════════════════════ */
/* 2 · Life OS                                                         */
/* ══════════════════════════════════════════════════════════════════ */

function extractLifeOS() {
  const snap = snapshot([/life[-_]?os/i, /^lifeos/i]);
  const src = read(SRC.lifeos);
  const statics = evalConsts(src, [
    "PILLARS",
    "GROUPS",
    "STREAK_TARGET",
    "READ_ACTIVE",
    "ADDED_HABITS",
    "ASR_HABITS",
    "MAGHRIB_HABITS",
    "POSTISHA_LABELS",
    "SEED_HABITS",
    "SEED_GOALS",
  ]);

  const pillars = Array.isArray(statics.PILLARS)
    ? statics.PILLARS.map((p) => ({ id: p.id, label: p.label, tint: p.tint }))
    : [];
  const groups = Array.isArray(statics.GROUPS)
    ? statics.GROUPS.map((g) => ({ id: g.id, label: g.label, tint: g.tint }))
    : [];

  const out = {
    source: "static",
    file: path.basename(SRC.lifeos),
    target: Number(statics.STREAK_TARGET) || 80,
    pillars,
    groups,
    habits: Array.isArray(statics.SEED_HABITS) ? statics.SEED_HABITS : [],
    goals: Array.isArray(statics.SEED_GOALS) ? statics.SEED_GOALS : [],
    history: [],
    bestStreak: 0,
    readGoal: 0,
    readingPages: 0,
  };

  if (!snap) return out;

  // Accept the app's own export (the state object) or a raw localStorage map
  // such as {"life-os-2027:v3": {...}, "life-os-2027:ui": {...}}.
  const looksLikeState = (v) =>
    v &&
    typeof v === "object" &&
    (Array.isArray(v.history) || Array.isArray(v.goals) || Array.isArray(v.habits));

  let s = snap.data;
  if (!looksLikeState(s)) {
    const map = unwrap(s, "life-os-2027:");
    s = Object.values(map).find(looksLikeState) || null;
  }
  if (!looksLikeState(s)) return out; // a JSON file that is not a Life OS export

  out.source = "live";
  out.file = snap.name;
  if (Array.isArray(s.habits) && s.habits.length) out.habits = s.habits;
  if (Array.isArray(s.goals) && s.goals.length) out.goals = s.goals;
  out.history = Array.isArray(s.history) ? s.history : [];
  out.bestStreak = Number(s.bestStreak) || 0;
  out.readGoal = Number(s.readGoal) || 0;
  out.readingPages = Array.isArray(s.reading)
    ? s.reading.reduce((n, r) => n + (Number(r && r.pages) || 0), 0)
    : 0;
  return out;
}

function chartLifeOS(d) {
  const W = 980,
    H = 700;
  const b = [];
  const live = d.source === "live";
  b.push(
    header(
      W,
      "انضباط Life OS",
      live ? "خريطة الأيام، وركائز ٢٠٢٧ الستّ" : "توزيع العادات على البلوكات، وركائز ٢٠٢٧",
      d.source,
    ),
  );

  const byDate = new Map(
    (d.history || []).map((h) => [h.date, Number(h.pct) || 0]),
  );
  const pcts = [...byDate.values()];
  const avg = pcts.length ? Math.round(pcts.reduce((a, c) => a + c, 0) / pcts.length) : 0;
  const hit = pcts.filter((p) => p >= d.target).length;
  const goalsDone = d.goals.filter((g) => g && g.done).length;

  b.push(
    tilesRTL(32, 100, W - 64, [
      { label: "أيام مسجّلة", value: String(pcts.length), color: C.coral },
      { label: "متوسّط الانضباط", value: avg + "%", color: C.amber },
      { label: "أيام فوق الهدف", value: String(hit), color: C.emerald },
      { label: "أفضل سلسلة", value: String(d.bestStreak), color: C.pink },
      { label: "أهداف مكتملة", value: goalsDone + "/" + d.goals.length, color: C.violet },
    ]),
  );

  // ── Top card: heatmap (live) or habit distribution per block (structure)
  b.push(card(32, 186, W - 64, 262));
  if (live) {
    b.push(
      panelTitle(W - 52, 218, "خريطة الانضباط", "٣٤ أسبوعًا · الأحدث على اليسار · الأسبوع يبدأ السبت"),
    );
    b.push(
      heatmap(52, 258, W - 104, 34, (day) => (byDate.has(day) ? byDate.get(day) : null), {
        target: d.target,
        cell: 20,
      }),
    );
    b.push(
      ar(W - 52, 434, "الأخضر: يوم بلغ الهدف · المرجاني: دونه · الفارغ: لم يُسجّل", {
        size: 10.5,
        fill: FAINT,
      }),
    );
  } else {
    b.push(
      panelTitle(W - 52, 218, "العادات في كل بلوك", "ستّة بلوكات مربوطة بأوقات الصلاة"),
    );
    const counts = d.groups.map((g, i) => ({
      label: g.label,
      value: d.habits.filter((h) => h && h.group === g.id).length,
      color: g.tint || C.coral,
    }));
    b.push(
      columnsRTL(72, 268, W - 144, 118, counts.map((c) => ({ value: c.value, color: c.color })), {
        barWidth: 52,
      }),
    );
    // Block labels in Arabic, under the columns.
    const slot = (W - 144) / (counts.length || 1);
    counts.forEach((c, i) => {
      const cx = 72 + (W - 144) - (i + 0.5) * slot;
      b.push(
        `<text x="${cx.toFixed(1)}" y="${412}" fill="${MUTED}" font-size="11.5" font-weight="600" text-anchor="middle" style="direction:rtl;unicode-bidi:isolate">${esc(c.label)}</text>`,
      );
    });
  }

  // ── Bottom left: quarters
  const cw = (W - 64 - 16) / 2;
  b.push(card(32, 464, cw, 200));
  b.push(panelTitle(32 + cw - 20, 494, "أهداف ٢٠٢٧ حسب الربع", "منجَز مقابل مخطَّط"));
  const quarters = ["q1", "q2", "q3", "q4"];
  const qRows = quarters.map((q, i) => {
    const all = d.goals.filter((g) => g && g.quarter === q);
    const done = all.filter((g) => g.done).length;
    return {
      label: "الربع " + ["الأول", "الثاني", "الثالث", "الرابع"][i],
      value: all.length,
      text: done + "/" + all.length,
      color: [C.coral, C.amber, C.emerald, C.violet][i],
    };
  });
  b.push(barsRTL(32 + 22, 534, cw - 44, 104, qRows, { labelW: 96 }));

  // ── Bottom right: pillar radar
  const rx = 32 + cw + 16;
  b.push(card(rx, 464, cw, 200));
  b.push(
    panelTitle(
      rx + cw - 20,
      494,
      "الركائز الستّ",
      live ? "نسبة الأهداف المنجَزة في كل ركيزة" : "ثقل كل ركيزة في خطّة السنة",
    ),
  );
  const maxPer =
    Math.max(
      1,
      ...d.pillars.map((p) => d.goals.filter((g) => g && g.pillar === p.id).length),
    ) || 1;
  const axes = d.pillars.map((p) => {
    const all = d.goals.filter((g) => g && g.pillar === p.id);
    const done = all.filter((g) => g.done).length;
    return {
      label: p.label,
      color: p.tint,
      value: live
        ? all.length
          ? done / all.length
          : 0
        : all.length / maxPer,
      text: live ? (all.length ? Math.round((done / all.length) * 100) + "%" : "0%") : String(all.length),
    };
  });
  b.push(radar(rx + cw / 2, 464 + 112, 56, axes));

  b.push(stamp(W, H));
  return doc(W, H, b.join("\n"));
}

/* ══════════════════════════════════════════════════════════════════ */
/* 3 · Gym (iron-log)                                                  */
/* ══════════════════════════════════════════════════════════════════ */

function extractGym() {
  const snap = snapshot([/iron/i, /gym/i]);
  const seedSrc = read(SRC.gymSeed);
  const typeSrc = read(SRC.gymTypes);
  const seeds = evalConsts(seedSrc, ["CATALOG", "PROGRAM", "DEFAULT_SETTINGS"]);
  const types = evalConsts(typeSrc, ["MUSCLE_GROUPS", "MUSCLE_GROUP_LABELS"]);

  const labels =
    types.MUSCLE_GROUP_LABELS && typeof types.MUSCLE_GROUP_LABELS === "object"
      ? types.MUSCLE_GROUP_LABELS
      : {};

  const out = {
    source: "static",
    file: path.join("iron-log", "src", "lib", "seed.ts"),
    labels,
    weeklyGoal: Number(seeds.DEFAULT_SETTINGS && seeds.DEFAULT_SETTINGS.weeklyGoal) || 4,
    programDays: [],
    muscleCounts: {},
    weeks: [],
    sessions: 0,
    setCount: 0,
    volumeKg: 0,
    prCount: 0,
  };

  const catalog = seeds.CATALOG && typeof seeds.CATALOG === "object" ? seeds.CATALOG : {};
  if (Array.isArray(seeds.PROGRAM)) {
    out.programDays = seeds.PROGRAM.map((p) => ({
      name: p.name,
      focus: p.focus,
      count: Array.isArray(p.exercises) ? p.exercises.length : 0,
    }));
    const seen = new Set();
    for (const day of seeds.PROGRAM)
      for (const slug of day.exercises || []) {
        if (seen.has(slug)) continue;
        seen.add(slug);
        const g = catalog[slug] && catalog[slug].muscleGroup;
        if (g) out.muscleCounts[g] = (out.muscleCounts[g] || 0) + 1;
      }
  }

  if (!snap) return out;

  const raw = snap.data;
  const db =
    raw && Array.isArray(raw.setEntries)
      ? raw
      : (unwrap(raw, "ironlog.") || {})["db.v1"] || raw["ironlog.db.v1"] || null;
  if (!db || !Array.isArray(db.sessions) || !Array.isArray(db.setEntries)) return out;

  out.source = "live";
  out.file = snap.name;
  if (db.settings && Number(db.settings.weeklyGoal))
    out.weeklyGoal = Number(db.settings.weeklyGoal);

  const exById = new Map((db.exercises || []).map((e) => [e.id, e]));
  const sessById = new Map((db.sessions || []).map((s) => [s.id, s]));
  const working = (db.setEntries || []).filter((s) => s && !s.isWarmup);

  out.sessions = db.sessions.length;
  out.setCount = working.length;
  out.volumeKg = Math.round(
    working.reduce((n, s) => n + (Number(s.weightKg) || 0) * (Number(s.reps) || 0), 0),
  );

  // Muscle-group volume replaces the structural exercise count.
  const vol = {};
  for (const s of working) {
    const ex = exById.get(s.exerciseId);
    if (!ex) continue;
    vol[ex.muscleGroup] =
      (vol[ex.muscleGroup] || 0) + (Number(s.weightKg) || 0) * (Number(s.reps) || 0);
  }
  if (Object.keys(vol).length) {
    out.muscleCounts = {};
    for (const k of Object.keys(vol)) out.muscleCounts[k] = Math.round(vol[k]);
    out.muscleUnit = "kg";
  }

  // Personal records: best working weight per exercise.
  const bestByEx = new Map();
  for (const s of working) {
    const w = Number(s.weightKg) || 0;
    if (w > (bestByEx.get(s.exerciseId) || 0)) bestByEx.set(s.exerciseId, w);
  }
  out.prCount = bestByEx.size;

  // Weekly buckets, 12 weeks back, week opening Saturday.
  const thisWeek = weekStart(new Date());
  const weeks = [];
  for (let i = 0; i < 12; i++) {
    const start = addDays(thisWeek, -i * 7);
    weeks.push({ start, key: iso(start), sessions: 0, attended: 0 });
  }
  const byKey = new Map(weeks.map((w) => [w.key, w]));
  for (const s of db.sessions) {
    const dt = parseIso(s.date);
    if (!dt) continue;
    const b = byKey.get(iso(weekStart(dt)));
    if (b) b.sessions++;
  }
  for (const [day, on] of Object.entries(db.attendance || {})) {
    if (!on) continue;
    const dt = parseIso(day);
    if (!dt) continue;
    const b = byKey.get(iso(weekStart(dt)));
    if (b) b.attended++;
  }
  out.weeks = weeks; // index 0 = current week

  return out;
}

function chartGym(d) {
  const W = 980,
    H = 580;
  const b = [];
  const live = d.source === "live";
  b.push(
    header(
      W,
      "انتظام النادي",
      live ? "الجلسات الأسبوعية مقابل الهدف، وتوزيع الحجم" : "برنامج التقسيم وتغطية العضلات",
      d.source,
    ),
  );

  const metGoal = d.weeks.filter((w) => w.sessions >= d.weeklyGoal).length;
  let run = 0;
  for (const w of d.weeks) {
    if (w.sessions >= d.weeklyGoal) run++;
    else break;
  }
  b.push(
    tilesRTL(32, 100, W - 64, [
      { label: "الهدف الأسبوعي", value: String(d.weeklyGoal), color: C.emerald },
      { label: "جلسات مسجّلة", value: String(d.sessions), color: C.coral },
      { label: "مجاميع فعّالة", value: String(d.setCount), color: C.amber },
      { label: "الحجم الكلّي", value: d.volumeKg ? d.volumeKg.toLocaleString("en-US") + " kg" : "—", color: C.cyan },
      { label: "أسابيع متتالية", value: String(run), color: C.pink },
    ]),
  );

  // ── Top card: weekly columns (live) or program days (structure)
  b.push(card(32, 186, W - 64, 196));
  if (live) {
    b.push(
      panelTitle(W - 52, 218, "الجلسات في كل أسبوع", "١٢ أسبوعًا · الأحدث على اليسار · الأسبوع يبدأ السبت"),
    );
    b.push(
      columnsRTL(
        72,
        266,
        W - 144,
        86,
        d.weeks.map((w) => ({
          value: w.sessions,
          label: String(w.start.getDate()).padStart(2, "0") + "/" + String(w.start.getMonth() + 1).padStart(2, "0"),
        })),
        { goal: d.weeklyGoal, max: Math.max(d.weeklyGoal + 1, 5), barWidth: 30 },
      ),
    );
  } else {
    b.push(panelTitle(W - 52, 218, "أيام البرنامج", "عدد التمارين في كل يوم من التقسيم"));
    const days = d.programDays;
    const slot = (W - 144) / (days.length || 1);
    b.push(
      columnsRTL(
        72,
        266,
        W - 144,
        86,
        days.map((p) => ({ value: p.count, color: C.coral })),
        { barWidth: Math.min(44, slot * 0.6) },
      ),
    );
    days.forEach((p, i) => {
      const cx = 72 + (W - 144) - (i + 0.5) * slot;
      b.push(
        lt(cx, 370, p.name, { size: 11.5, anchor: "middle", fill: INK, weight: 700 }),
      );
    });
  }

  // ── Bottom card: muscle coverage
  b.push(card(32, 398, W - 64, 142));
  b.push(
    panelTitle(
      W - 52,
      428,
      live ? "الحجم حسب المجموعة العضلية" : "تغطية المجموعات العضلية",
      live ? "كيلوجرام × تكرار عبر كل الجلسات" : "عدد التمارين الفريدة في البرنامج",
    ),
  );
  const entries = Object.entries(d.muscleCounts)
    .sort((a, b2) => b2[1] - a[1])
    .slice(0, 10);
  if (!entries.length) {
    b.push(emptyNote(56, 460, W - 112, 48, "لا توجد مجموعات عضلية مسجَّلة"));
  } else {
    const max = Math.max(...entries.map((e) => e[1])) || 1;
    const slot = (W - 112) / entries.length;
    entries.forEach(([g, v], i) => {
      const cx = 56 + (W - 112) - (i + 0.5) * slot;
      const bw = Math.min(46, slot * 0.66);
      const bh = Math.max(3, (v / max) * 40);
      const col = [C.coral, C.amber, C.emerald, C.violet, C.cyan, C.pink, C.blue, C.orange, C.rose, C.coral][i % 10];
      b.push(
        `<rect x="${(cx - bw / 2).toFixed(1)}" y="${(514 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${col}" fill-opacity="0.92"/>`,
        lt(cx, 514 - bh - 6, d.muscleUnit ? Math.round(v / 1000) + "k" : String(v), {
          size: 10,
          anchor: "middle",
          fill: col,
          weight: 700,
        }),
        `<text x="${cx.toFixed(1)}" y="531" fill="${MUTED}" font-size="11" font-weight="600" text-anchor="middle" style="direction:rtl;unicode-bidi:isolate">${esc(d.labels[g] || g)}</text>`,
      );
    });
  }

  b.push(stamp(W, H));
  return doc(W, H, b.join("\n"));
}

/* ══════════════════════════════════════════════════════════════════ */
/* Main                                                                */
/* ══════════════════════════════════════════════════════════════════ */

const JOBS = [
  { name: "step-progress.svg", extract: extractStep, chart: chartStep, tag: "STEP" },
  { name: "lifeos-discipline.svg", extract: extractLifeOS, chart: chartLifeOS, tag: "Life OS" },
  { name: "gym-consistency.svg", extract: extractGym, chart: chartGym, tag: "Gym" },
];

function render() {
  let failed = 0;
  const rows = [];
  for (const job of JOBS) {
    try {
      const data = job.extract();
      const svg = job.chart(data);
      fs.writeFileSync(path.join(OUT, job.name), svg, "utf8");
      rows.push([job.tag, job.name, data.source, data.file, svg.length]);
    } catch (err) {
      failed++;
      console.error("report-agent: " + job.tag + " failed — " + (err && err.message));
    }
  }

  if (!QUIET) {
    log("report-agent → " + OUT);
    for (const [tag, file, source, from, size] of rows)
      log(
        "  " +
          tag.padEnd(8) +
          " " +
          file.padEnd(24) +
          (source === "live" ? "live    " : "static  ") +
          String(Math.round(size / 1024)).padStart(3) +
          " KB   " +
          from,
      );
    if (!rows.some((r) => r[2] === "live"))
      log(
        "\n  no snapshots in " +
          DATA +
          "\n  drop lifeos.json / step.json / ironlog.json there for live charts",
      );
  }
  return failed;
}

/** --watch: regenerate whenever a source file or a snapshot changes. */
function watch() {
  const targets = [SRC.lifeos, SRC.step, SRC.gymSeed, SRC.gymTypes, DATA];
  let timer = null;
  const kick = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      log("");
      render();
    }, 700);
  };
  for (const t of targets) {
    try {
      fs.watch(t, { persistent: true }, kick);
    } catch {}
  }
  log("\n  watching " + targets.length + " paths — Ctrl+C to stop");
}

function main() {
  try {
    fs.mkdirSync(OUT, { recursive: true });
    fs.mkdirSync(DATA, { recursive: true }); // snapshot inbox, read-only to us
  } catch {
    console.error("report-agent: cannot create output folder: " + OUT);
    process.exit(1);
  }

  const failed = render();

  if (argv.includes("--watch")) {
    watch();
    return; // stay alive
  }
  process.exit(failed ? 1 : 0);
}

main();
