#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = path.resolve(process.argv[2] || "");
const output = path.resolve(process.argv[3] || input);
const graphOutput = process.argv[4] ? path.resolve(process.argv[4]) : null;
if (!input || !fs.existsSync(input)) {
  console.error("Usage: node migrate-content-map.mjs /absolute/path/content-map.json [/absolute/path/content-map-v06.json] [/absolute/path/semantic-graph.json]");
  process.exit(2);
}

const map = JSON.parse(fs.readFileSync(input, "utf8"));
const sourceSchemaVersion = String(map.schemaVersion || "legacy");
const arr = (value) => Array.isArray(value) ? value : [];
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

if (map.schemaVersion === "0.6" && map.semanticGraph) {
  writeJson(output, map);
  if (graphOutput) writeJson(graphOutput, map.semanticGraph);
  console.log(JSON.stringify({ migrated: false, output, graphOutput }, null, 2));
  process.exit(0);
}

if (!arr(map.contentAtoms).length) {
  const atoms = [];
  for (const fact of arr(map.facts)) atoms.push({
    id: `ATOM-${fact.id}`,
    kind: "fact",
    text: fact.text,
    materiality: "supporting",
    displayRequirement: "annotation",
    coverageStatus: "planned",
    sourceRef: fact.sourceRef
  });
  for (const number of arr(map.numbers)) atoms.push({
    id: `ATOM-${number.id}`,
    kind: "numeric",
    text: `${number.subject || number.id}：${number.value}${number.unit || ""}`,
    materiality: "supporting",
    displayRequirement: "annotation",
    coverageStatus: "planned",
    sourceRef: number.sourceRef
  });
  for (const action of arr(map.actions)) atoms.push({
    id: `ATOM-${action.id}`,
    kind: "action",
    text: action.action,
    materiality: "supporting",
    displayRequirement: "annotation",
    coverageStatus: "planned",
    sourceRef: action.sourceRef
  });
  map.contentAtoms = atoms;
}

if (!arr(map.numericClaims).length) {
  map.numericClaims = arr(map.numbers).map((number) => ({
    ...number,
    raw: `${number.value}${number.unit || ""}`,
    role: "unknown",
    materiality: "supporting",
    displayRequirement: "annotation",
    coverageStatus: "planned",
    migrationWarning: "numeric role was not present in the legacy map and must be reviewed"
  }));
}
map.claimGraph = arr(map.claimGraph);

const nodes = [];
const nodeIds = new Set();
const addNode = (node) => {
  if (!node.id || nodeIds.has(node.id) || !arr(node.sourceRefs).length) return;
  nodeIds.add(node.id);
  nodes.push(node);
};
for (const atom of arr(map.contentAtoms)) addNode({
  id: atom.id,
  kind: "atom",
  label: atom.text || atom.id,
  sourceRefs: [atom.sourceRef].filter(Boolean),
  materiality: atom.materiality || "unknown",
  needsReview: true
});
for (const claim of arr(map.numericClaims)) addNode({
  id: claim.id,
  kind: "numeric-claim",
  label: claim.raw || `${claim.subject || claim.id}：${claim.value}${claim.unit || ""}`,
  sourceRefs: [claim.sourceRef].filter(Boolean),
  materiality: claim.materiality || "unknown",
  needsReview: true
});
for (const action of arr(map.actions)) addNode({
  id: action.id,
  kind: "action",
  label: action.action || action.id,
  sourceRefs: [action.sourceRef].filter(Boolean),
  materiality: "supporting",
  needsReview: true
});
for (const entity of arr(map.entities)) {
  const sourceRefs = [...arr(entity.sourceRefs), entity.sourceRef].filter(Boolean);
  if (sourceRefs.length) addNode({ id: entity.id, kind: "entity", label: entity.canonicalName || entity.id, sourceRefs, materiality: "unknown", needsReview: true });
}

const migrationWarnings = arr(map.relationships).map((relationship) =>
  `Legacy relationship ${relationship.id || "<unknown>"} (${relationship.type || "unknown"}) was preserved but not converted to an edge; recompile it from source evidence in P0-02.`
);
const entitiesWithoutSource = arr(map.entities).filter((entity) => !arr(entity.sourceRefs).length && !entity.sourceRef);
if (entitiesWithoutSource.length) migrationWarnings.push(`${entitiesWithoutSource.length} legacy entities lack sourceRefs and were not promoted to semantic graph nodes.`);
if (!nodes.length) migrationWarnings.push("No evidence-bearing nodes could be migrated; source content must be recompiled before page planning.");

const semanticGraph = {
  schemaVersion: "0.6",
  sourceContentMapVersion: sourceSchemaVersion,
  nodes,
  edges: [],
  migrationWarnings
};

map.schemaVersion = "0.6";
map.semanticGraph = semanticGraph;
map.migration = {
  from: sourceSchemaVersion,
  warnings: [
    "Legacy numeric roles were not inferred. Review every role, materiality and display requirement before formal generation.",
    "Legacy relationship labels were not converted to directed edges. Recompile relations from source evidence before layout routing.",
    ...migrationWarnings
  ]
};

writeJson(output, map);
if (graphOutput) writeJson(graphOutput, semanticGraph);
console.log(JSON.stringify({ migrated: true, from: sourceSchemaVersion, to: "0.6", atoms: map.contentAtoms.length, numericClaims: map.numericClaims.length, graphNodes: nodes.length, graphEdges: 0, unresolvedRelationships: arr(map.relationships).length, output, graphOutput }, null, 2));
