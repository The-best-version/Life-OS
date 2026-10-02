import * as esbuild from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

const work = mkdtempSync(join(tmpdir(), "ironlog-test-"));
const out = join(work, "storage.mjs");
await esbuild.build({
  entryPoints: ["src/lib/storage.ts"],
  outfile: out, bundle: true, format: "esm", platform: "node",
  tsconfig: "tsconfig.json",
});
const { normalizeDatabase } = await import(pathToFileURL(out).href);

// A genuine pre-migration payload: the v2 backup taken earlier today.
const v2 = JSON.parse(readFileSync("backups/iron-log-backup-20261001.json", "utf8"));
console.log("INPUT  version:", v2.version, "| sets:", v2.setEntries.length,
            "| sessions:", v2.sessions.length, "| has health:", "health" in v2);

const after = normalizeDatabase(v2);
console.log("OUTPUT version:", after.version, "| sets:", after.setEntries.length,
            "| sessions:", after.sessions.length);
console.log("        health:", JSON.stringify(after.health),
            "| heightCm:", after.settings.heightCm,
            "| healthTargets:", JSON.stringify(after.settings.healthTargets));

const ok =
  after.version === 3 &&
  after.setEntries.length === v2.setEntries.length &&
  after.sessions.length === v2.sessions.length &&
  Object.keys(after.bodyMetrics).length === Object.keys(v2.bodyMetrics).length &&
  after.settings.weeklyGoal === v2.settings.weeklyGoal &&
  after.settings.targets.protein === v2.settings.targets.protein;
console.log(ok ? "\nPASS - nothing lost, v3 fields present" : "\nFAIL - data changed");
rmSync(work, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
