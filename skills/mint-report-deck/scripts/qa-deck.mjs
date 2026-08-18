#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateSemanticLayout } from "./validate-semantic-layout.mjs";
import { validateReadingContract } from "./validate-reading-contract.mjs";
import { classifyQaMessages } from "./repair-layout.mjs";
import { validateDeckRhythm } from "./qa-deck-rhythm.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const deckFile = path.resolve(process.argv[2] || "");
const mapFile = path.resolve(process.argv[3] || "");
const output = process.argv[4] && !process.argv[4].startsWith("--") ? path.resolve(process.argv[4]) : null;
const crossDirIndex = process.argv.indexOf("--cross-output-dir");
const crossOutputDir = crossDirIndex >= 0 && process.argv[crossDirIndex + 1] ? path.resolve(process.argv[crossDirIndex + 1]) : null;
if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
  console.error("Usage: node qa-deck.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json [/absolute/path/qa-report.json]");
  process.exit(2);
}

const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
const checks = [
  ["content-map", "validate-content-map.mjs", [mapFile]],
  ["chinese-compilation", "validate-chinese-compilation.mjs", [mapFile]],
  ["deck-schema", "validate-deck.mjs", [deckFile, mapFile]],
  ["component-contract", "validate-component-contract.mjs", [deckFile]],
  ["page-budget", "validate-page-budget.mjs", [deckFile, mapFile]],
  ["content-structure", "validate-content-structure.mjs", [deckFile, mapFile]],
  ["narrative-contract", "validate-narrative-contract.mjs", [deckFile, mapFile]],
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

if (deck.schemaVersion === "0.6" || map.schemaVersion === "0.6") {
  const registry = JSON.parse(fs.readFileSync(path.resolve(here, "../assets/layout-patterns.json"), "utf8"));
  const plan = deck.deckPlan;
  const layoutSelection = deck.layoutSelection;
  const semantic = validateSemanticLayout(plan, map, layoutSelection, registry, deck);
  checks.push({ name:"semantic-layout", exitCode:semantic.passed ? 0 : 1, ...semantic });
  const reading = validateReadingContract(plan, layoutSelection, registry);
  checks.push({ name:"reading-contract", exitCode:reading.passed ? 0 : 1, ...reading });
  const rhythm = validateDeckRhythm(plan, layoutSelection, registry, map.semanticGraph);
  checks.push({ name:"deck-rhythm", exitCode:rhythm.passed ? 0 : 1, ...rhythm });
}

if (crossOutputDir) {
  const crossReportFile = path.join(crossOutputDir, "cross-output-report.json");
  const run = spawnSync(process.execPath, [
    path.join(here,"validate-cross-output.mjs"), deckFile,
    path.join(crossOutputDir,"report.html"), path.join(crossOutputDir,"report.pdf"),
    path.join(crossOutputDir,"report.pptx"), crossReportFile,
    "--manifest", path.join(crossOutputDir,"export-manifest.json")
  ], { encoding:"utf8", env:process.env, maxBuffer:20_000_000 });
  let result;
  try { result = JSON.parse(run.stdout || "{}"); }
  catch { result = { passed:false, status:"unverified", errors:[run.stdout || run.stderr || "cross-output produced invalid output"] }; }
  checks.push({ name:"cross-output", exitCode:run.status, ...result });
}

const passed = checks.every((check) => check.passed);
const hasWarnings = checks.some((check) => (check.warnings || []).length);
const errorMessages = checks.flatMap((check) => (check.errors || []).map((error) => `${check.name}: ${error}`));
const warningMessages = checks.flatMap((check) => (check.warnings || []).map((warning) => `${check.name}: ${warning}`));
const errorRepairIssues = deck.schemaVersion === "0.6" ? classifyQaMessages(errorMessages).map((issue)=>({...issue,severity:"error"})) : [];
const warningReviewIssues = deck.schemaVersion === "0.6" ? classifyQaMessages(warningMessages).map((issue)=>({...issue,severity:"warning",repairable:false})) : [];
const repairIssues = [...errorRepairIssues, ...warningReviewIssues];
const blockingErrors = errorRepairIssues.filter((issue) => !issue.repairable).map((issue) => issue.message);
const crossOutputFailed = checks.some((check)=>check.name === "cross-output" && check.status !== "formal-ready");
const status = passed ? (deck.schemaVersion === "0.6" && hasWarnings ? "repair-required" : "formal-ready") : (crossOutputFailed ? "blocked" : (deck.schemaVersion === "0.6" && !blockingErrors.length ? "repair-required" : "blocked"));

const report = {
  schemaVersion: deck.schemaVersion === "0.6" ? "0.6" : "0.5",
  generatedAt: new Date().toISOString(),
  status,
  passed: status === "formal-ready",
  checks,
  errors: errorMessages,
  warnings: warningMessages,
  repairIssues,
  blockingErrors,
  nextAction: status === "formal-ready" ? "deliver" : status === "repair-required" ? "run-repair-then-rerun-all-qa" : "stop-and-request-content-or-contract-review"
};
if (output) fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "formal-ready" ? 0 : 1);
