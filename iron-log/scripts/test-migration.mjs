/**
 * Runs a real pre-migration backup through `normalizeDatabase` and checks
 * that nothing was lost on the way to the current schema version.
 *
 * `DB_VERSION` moves as the schema grows (v3 added the daily health log, v4
 * added `athleticSessions` for the multi-sport layer) — this script reads it
 * from `seed.ts` rather than hardcoding a number, which is what let it drift
 * out of sync once already: it kept asserting `version === 3` after v4
 * shipped and reported FAIL on a migration that was actually correct.
 *
 *   node scripts/test-migration.mjs
 */
import * as esbuild from "esbuild";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const work = mkdtempSync(join(tmpdir(), "ironlog-test-"));

// Explicit `.mjs` outfiles, not `outdir`'s default `.js` naming: this
// directory has no package.json of its own, so a bare `.js` file is read as
// CommonJS by Node and the `import()` below would fail on the bundle's own
// `export` statements.
const storageOut = join(work, "storage.mjs");
const seedOut = join(work, "seed.mjs");
await esbuild.build({
  entryPoints: ["src/lib/storage.ts"],
  outfile: storageOut, bundle: true, format: "esm", platform: "node",
  tsconfig: "tsconfig.json",
});
await esbuild.build({
  entryPoints: ["src/lib/seed.ts"],
  outfile: seedOut, bundle: true, format: "esm", platform: "node",
  tsconfig: "tsconfig.json",
});
const { normalizeDatabase } = await import(pathToFileURL(storageOut).href);
const { DB_VERSION } = await import(pathToFileURL(seedOut).href);

// A genuine pre-migration payload: the v2 backup taken earlier today.
const v2 = JSON.parse(readFileSync("backups/iron-log-backup-20261001.json", "utf8"));
console.log("INPUT  version:", v2.version, "| sets:", v2.setEntries.length,
            "| sessions:", v2.sessions.length, "| has health:", "health" in v2);

const after = normalizeDatabase(v2);
console.log(`OUTPUT version: ${after.version} (current: ${DB_VERSION})`,
            "| sets:", after.setEntries.length, "| sessions:", after.sessions.length);
console.log("        health:", JSON.stringify(after.health),
            "| heightCm:", after.settings.heightCm,
            "| healthTargets:", JSON.stringify(after.settings.healthTargets));
console.log("        athleticSessions:", after.athleticSessions.length,
            "(a gym-only v2 backup carries none — nothing invented for it)");

const ok =
  after.version === DB_VERSION &&
  after.setEntries.length === v2.setEntries.length &&
  after.sessions.length === v2.sessions.length &&
  Array.isArray(after.athleticSessions) && after.athleticSessions.length === 0 &&
  Object.keys(after.bodyMetrics).length === Object.keys(v2.bodyMetrics).length &&
  after.settings.weeklyGoal === v2.settings.weeklyGoal &&
  after.settings.targets.protein === v2.settings.targets.protein;
console.log(ok ? "\nPASS - nothing lost, current schema fields present" : "\nFAIL - data changed");
rmSync(work, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
