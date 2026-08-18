#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { patternCompatible, validatePatternRegistry } from "../scripts/validate-pattern-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "assets/layout-patterns.json"), "utf8"));
const result = validatePatternRegistry(registry);
if (!result.passed) throw new Error(`pattern registry failed: ${result.errors.join(" | ")}`);

const allRelations = ["none","parallel","sequence","temporal","causal","comparison","hierarchy","composition","flow","evidence","before-after","problem-cause-solution","dependency"];
let positives = 0;
let negatives = 0;
for (const pattern of registry.patterns) {
  const positive = {
    relationType:pattern.relationTypes[0], pageRole:pattern.pageRoles[0], nodeCount:pattern.cardinality.min,
    dataShape:pattern.dataShapes[0], densityProfile:pattern.densityProfiles[0], readingAxis:pattern.readingAxes[0], connectorPolicy:pattern.connectorPolicies[0]
  };
  if (!patternCompatible(pattern, positive).compatible) throw new Error(`${pattern.id} rejected its own positive contract`);
  positives += 1;
  const wrongRelation = allRelations.find((relation) => !pattern.relationTypes.includes(relation));
  const negative = wrongRelation ? { ...positive, relationType:wrongRelation } : { ...positive, nodeCount:pattern.cardinality.max + 1 };
  if (patternCompatible(pattern, negative).compatible) throw new Error(`${pattern.id} accepted an incompatible negative contract`);
  negatives += 1;
}

const parallelArrow = registry.patterns.filter((pattern) => pattern.relationTypes.includes("parallel") && pattern.connectorPolicies.includes("arrow"));
if (parallelArrow.length) throw new Error(`parallel patterns authorize arrows: ${parallelArrow.map((pattern) => pattern.id).join(",")}`);
const card = registry.patterns.find((pattern) => pattern.id === "card-matrix");
if (!card || card.fallback !== false || card.cardinality.max !== 4) throw new Error("card-matrix guard is missing");

console.log(JSON.stringify({ passed:true, patterns:result.metrics.patterns, coverageTags:result.metrics.coverageTags, positiveCases:positives, incompatibleCases:negatives, parallelArrowPatterns:parallelArrow.length, fallbackPattern:registry.fallbackPatternId }, null, 2));
