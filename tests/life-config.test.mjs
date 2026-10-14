/* --- guarding a config file that cannot be imported here --------------
 *  `life-config.js` reaches for lucide-react, which plain `node --test`
 *  cannot resolve outside the esbuild build (no node_modules sits above it
 *  on the normal resolution path). So this reads it as text — the same
 *  trick split.test.mjs already uses for every split file's imports and
 *  exports — rather than ever importing the module.
 * --------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { NAV_IDS, TAB_BAR } from "../src/state/life-state.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "src", "life-config.js"), "utf8");

function parseSidebarNav(text) {
  const m = text.match(/export const sidebarNav = \[([\s\S]*?)\n\];/);
  assert.ok(m, "sidebarNav array not found in life-config.js");
  const rows = [...m[1].matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?\}/g)];
  assert.ok(rows.length, "no rows parsed out of sidebarNav");
  return rows.map((r) => ({ id: r[1], visible: !/visible:\s*false/.test(r[0]) }));
}

/* «اليوم» is the screen the app opens on. Previously `migrate()` placed it
   at the head of `navOrder` by hand across three schemas to guarantee this;
   now there is no migration left to do it, because `sidebarNav`'s own
   literal order is the only order there is — so the guarantee has to live
   here instead, against the config itself. */
test("sidebarNav lists «اليوم» first, and every NAV_IDS tab has a row", () => {
  const nav = parseSidebarNav(src);
  assert.equal(nav[0]?.id, "today", "«اليوم» must stay the first row — it is the landing screen");
  const ids = new Set(nav.map((n) => n.id));
  for (const id of NAV_IDS) {
    assert.ok(ids.has(id), id + " has no row in sidebarNav — it would render nameless");
  }
});

test("«اليوم» is still inside the phone bar's first TAB_BAR tabs", () => {
  const nav = parseSidebarNav(src).filter((n) => n.visible);
  assert.ok(
    nav.slice(0, TAB_BAR).some((n) => n.id === "today"),
    "the landing screen must not be pushed past the phone bar's first " + TAB_BAR + " tabs",
  );
});
