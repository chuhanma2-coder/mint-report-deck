#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateSemanticGraph } from "../scripts/validate-semantic-graph.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-semantic-v06-"));
const run = (script, args) => spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], { encoding: "utf8" });
const mustRun = (script, args) => {
  const result = run(script, args);
  if (result.status !== 0) throw new Error(`${script}\n${result.stdout}${result.stderr}`);
  return result;
};

const validPath = path.join(fixtures, "semantic-graph-valid.json");
const invalidPath = path.join(fixtures, "semantic-graph-invalid.json");
const valid = JSON.parse(fs.readFileSync(validPath, "utf8"));
const invalid = JSON.parse(fs.readFileSync(invalidPath, "utf8"));
const validResult = validateSemanticGraph(valid);
if (!validResult.passed) throw new Error(`valid graph failed: ${validResult.errors.join(" | ")}`);
const invalidResult = validateSemanticGraph(invalid);
if (invalidResult.passed) throw new Error("invalid graph unexpectedly passed");
for (const marker of ["id 重复", "parallel 不得为 directed", "parallel 不得授权 arrow", "缺少可验证的 orderBasis", "target 未引用有效节点"]) {
  if (!invalidResult.errors.some((error) => error.includes(marker))) throw new Error(`invalid graph did not report: ${marker}`);
}
mustRun("validate-semantic-graph.mjs", [validPath]);
const invalidCli = run("validate-semantic-graph.mjs", [invalidPath]);
if (invalidCli.status === 0) throw new Error("invalid graph CLI unexpectedly passed");

const legacyPath = path.join(fixtures, "vodafone-content-map.json");
const migratedPath = path.join(tmp, "vodafone-content-map-v06.json");
const graphPath = path.join(tmp, "semantic-graph.json");
const originalLegacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
mustRun("migrate-content-map.mjs", [legacyPath, migratedPath, graphPath]);
const migrated = JSON.parse(fs.readFileSync(migratedPath, "utf8"));
const standalone = JSON.parse(fs.readFileSync(graphPath, "utf8"));
if (migrated.schemaVersion !== "0.6") throw new Error("legacy map was not upgraded to V0.6");
if (JSON.stringify(migrated.semanticGraph) !== JSON.stringify(standalone)) throw new Error("standalone semantic graph differs from embedded graph");
if (migrated.relationships.length !== originalLegacy.relationships.length) throw new Error("legacy relationships were lost during migration");
if (migrated.semanticGraph.edges.length !== 0) throw new Error("legacy relationship labels must not be guessed into graph edges");
if (!migrated.semanticGraph.migrationWarnings.some((warning) => warning.includes("R1"))) throw new Error("unresolved legacy relationship was not reported");
mustRun("validate-semantic-graph.mjs", [graphPath]);
mustRun("validate-content-map.mjs", [migratedPath]);

const equityPath = path.join(fixtures, "equity-content-map.json");
const equityMigratedPath = path.join(tmp, "equity-content-map-v06.json");
const equityBefore = JSON.parse(fs.readFileSync(equityPath, "utf8"));
mustRun("migrate-content-map.mjs", [equityPath, equityMigratedPath]);
const equityAfter = JSON.parse(fs.readFileSync(equityMigratedPath, "utf8"));
if (equityAfter.numericClaims.length !== equityBefore.numericClaims.length) throw new Error("numeric claims were lost during V0.4 migration");
const formulaBefore = equityBefore.numericClaims.find((claim) => claim.id === "N-K-21")?.formula;
const formulaAfter = equityAfter.numericClaims.find((claim) => claim.id === "N-K-21")?.formula;
if (JSON.stringify(formulaBefore) !== JSON.stringify(formulaAfter)) throw new Error("existing numeric formula was changed during migration");
mustRun("validate-content-map.mjs", [equityMigratedPath]);

const idempotentPath = path.join(tmp, "equity-content-map-v06-again.json");
mustRun("migrate-content-map.mjs", [equityMigratedPath, idempotentPath]);
const idempotent = JSON.parse(fs.readFileSync(idempotentPath, "utf8"));
if (JSON.stringify(idempotent) !== JSON.stringify(equityAfter)) throw new Error("V0.6 migration is not idempotent");

console.log(JSON.stringify({
  passed: true,
  validGraphs: 3,
  blockedGraphs: 1,
  legacyRelationsPreserved: originalLegacy.relationships.length,
  guessedLegacyEdges: migrated.semanticGraph.edges.length,
  numericClaimsPreserved: equityAfter.numericClaims.length,
  output: tmp
}, null, 2));
