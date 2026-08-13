#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const deckFile = path.resolve(process.argv[2] || "");
const mapFile = path.resolve(process.argv[3] || "");
const output = process.argv[4] ? path.resolve(process.argv[4]) : null;
if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
  console.error("Usage: node qa-deck.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json [/absolute/path/qa-report.json]");
  process.exit(2);
}

const checks = [
  ["content-map", "validate-content-map.mjs", [mapFile]],
  ["deck-schema", "validate-deck.mjs", [deckFile, mapFile]],
  ["information-coverage", "validate-information-coverage.mjs", [deckFile, mapFile]],
  ["numeric-integrity", "validate-numeric-integrity.mjs", [deckFile, mapFile]],
  ["visual-salience", "validate-visual-salience.mjs", [deckFile, mapFile]]
].map(([name, script, args]) => {
  const run = spawnSync(process.execPath, [path.join(here, script), ...args], { encoding: "utf8" });
  let result;
  try { result = JSON.parse(run.stdout || "{}"); }
  catch { result = { passed: false, errors: [run.stdout || run.stderr || `${name} produced invalid output`] }; }
  return { name, exitCode: run.status, ...result };
});

const report = {
  schemaVersion: "0.4",
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.passed) ? "formal-ready" : "blocked",
  passed: checks.every((check) => check.passed),
  checks,
  errors: checks.flatMap((check) => (check.errors || []).map((error) => `${check.name}: ${error}`)),
  warnings: checks.flatMap((check) => (check.warnings || []).map((warning) => `${check.name}: ${warning}`))
};
if (output) fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
