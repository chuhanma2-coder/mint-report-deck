#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { compileSemanticGraph } from "../scripts/compile-semantic-graph.mjs";
import { validateSemanticGraph } from "../scripts/validate-semantic-graph.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const cases = JSON.parse(fs.readFileSync(path.join(fixtures, "semantic-minimal-pairs.json"), "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-chinese-relations-v06-"));
let edgeCount = 0;

for (const test of cases) {
  const input = { schemaVersion: "0.5", discourseUnits: test.units, contentAtoms: [] };
  const outputs = Array.from({ length: 3 }, () => compileSemanticGraph(input));
  if (new Set(outputs.map((graph) => JSON.stringify(graph))).size !== 1) throw new Error(`${test.name}: compiler is not deterministic`);
  const graph = outputs[0];
  const validation = validateSemanticGraph(graph);
  if (!validation.passed) throw new Error(`${test.name}: invalid graph: ${validation.errors.join(" | ")}`);
  const relations = graph.edges.map((item) => item.relationType);
  if (JSON.stringify(relations) !== JSON.stringify(test.expectedRelations)) throw new Error(`${test.name}: expected ${test.expectedRelations.join(",")}, got ${relations.join(",")}`);
  const arrows = graph.edges.filter((item) => item.connectorPolicy === "arrow").length;
  if (arrows !== test.expectedArrowEdges) throw new Error(`${test.name}: expected ${test.expectedArrowEdges} arrows, got ${arrows}`);
  if (graph.migrationWarnings.length !== test.expectedReviewItems) throw new Error(`${test.name}: expected ${test.expectedReviewItems} review items, got ${graph.migrationWarnings.length}`);
  if (test.expectedAssertionStatus && graph.edges[0]?.assertionStatus !== test.expectedAssertionStatus) throw new Error(`${test.name}: causal assertion status drifted`);
  if (graph.edges.some((item) => item.relationType === "parallel" && item.connectorPolicy === "arrow")) throw new Error(`${test.name}: parallel relation received an arrow`);
  edgeCount += graph.edges.length;
}

const narrativePath = path.join(fixtures, "chinese-narrative-content-map.json");
const graphPath = path.join(tmp, "semantic-graph.json");
const mapPath = path.join(tmp, "content-map-v06.json");
const cli = spawnSync(process.execPath, [path.join(root, "scripts/compile-semantic-graph.mjs"), narrativePath, graphPath, mapPath], { encoding: "utf8" });
if (cli.status !== 0) throw new Error(`compile CLI failed\n${cli.stdout}${cli.stderr}`);
const compiledMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
if (compiledMap.schemaVersion !== "0.6" || !compiledMap.semanticGraph) throw new Error("CLI did not create a V0.6 content map");
const chineseValidation = spawnSync(process.execPath, [path.join(root, "scripts/validate-chinese-compilation.mjs"), mapPath], { encoding: "utf8" });
if (chineseValidation.status !== 0) throw new Error(`compiled V0.6 Chinese map failed validation\n${chineseValidation.stdout}${chineseValidation.stderr}`);

console.log(JSON.stringify({ passed: true, minimalPairs: cases.length, deterministicRuns: cases.length * 3, compiledEdges: edgeCount, parallelArrowErrors: 0, output: tmp }, null, 2));
