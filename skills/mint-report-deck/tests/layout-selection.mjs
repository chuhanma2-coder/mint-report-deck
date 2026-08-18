#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectLayout } from "../scripts/select-layout.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "assets/layout-patterns.json"), "utf8"));
const cases = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/layout-selection-cases.json"), "utf8"));
let deterministicRuns = 0;
let blocked = 0;
for (const test of cases) {
  const edge = test.relationType === "none" ? null : { id:"E1", relationType:test.relationType, direction:test.connectorPolicy === "none" ? "none" : "directed", connectorPolicy:test.connectorPolicy, confidence:1, needsReview:false };
  const page = {
    pageRole:test.pageRole, atomRefs:Array.from({ length:test.nodeCount }, (_, index) => `A${index + 1}`),
    proofObject:{ kind:test.dataShape === "numeric" || test.dataShape === "chart-series" ? "numeric-evidence" : test.dataShape === "media" ? "media-evidence" : "semantic-relationship", dataShape:test.dataShape },
    relationGraphRefs:edge ? ["E1"] : [], primaryRelationRef:edge ? "E1" : null,
    densityProfile:test.densityProfile, readingAxis:test.readingAxis
  };
  const graph = { edges:edge ? [edge] : [] };
  const outputs = Array.from({ length:3 }, () => selectLayout(page, graph, registry));
  deterministicRuns += outputs.length;
  if (new Set(outputs.map((output) => `${output.status}|${output.patternId}`)).size !== 1) throw new Error(`${test.name}: selection is not deterministic`);
  const output = outputs[0];
  if (test.expectedStatus) {
    if (output.status !== test.expectedStatus || output.patternId != null) throw new Error(`${test.name}: incompatible content did not block`);
    blocked += 1;
  } else if (output.status !== "selected" || output.patternId !== test.expected) {
    throw new Error(`${test.name}: expected ${test.expected}, got ${output.status}/${output.patternId}\n${JSON.stringify(output, null, 2)}`);
  }
}

const parallel = cases.find((item) => item.name === "三项并列");
if (parallel.expected.includes("sequence")) throw new Error("parallel case selected sequence pattern");
const beforeAfter = cases.find((item) => item.name === "前后变化");
if (beforeAfter.expected.includes("capability")) throw new Error("before-after case selected capability chain");

console.log(JSON.stringify({ passed:true, cases:cases.length, deterministicRuns, blockedCases:blocked, parallelSequenceErrors:0, beforeAfterCapabilityErrors:0 }, null, 2));
