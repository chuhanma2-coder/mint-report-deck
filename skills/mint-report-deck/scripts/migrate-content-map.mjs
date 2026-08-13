#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = path.resolve(process.argv[2] || "");
const output = path.resolve(process.argv[3] || input);
if (!input || !fs.existsSync(input)) {
  console.error("Usage: node migrate-content-map.mjs /absolute/path/content-map.json [/absolute/path/content-map-v04.json]");
  process.exit(2);
}

const map = JSON.parse(fs.readFileSync(input, "utf8"));
const sourceSchemaVersion = String(map.schemaVersion || "legacy");
const arr = (v) => Array.isArray(v) ? v : [];
if (map.schemaVersion === "0.4" && arr(map.contentAtoms).length) {
  fs.writeFileSync(output, `${JSON.stringify(map, null, 2)}\n`);
  console.log(JSON.stringify({ migrated: false, output }));
  process.exit(0);
}

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

map.schemaVersion = "0.4";
map.contentAtoms = atoms;
map.numericClaims = arr(map.numbers).map((number) => ({
  ...number,
  raw: `${number.value}${number.unit || ""}`,
  role: "unknown",
  materiality: "supporting",
  displayRequirement: "annotation",
  coverageStatus: "planned",
  migrationWarning: "numeric role was not present in the legacy map and must be reviewed"
}));
map.claimGraph = arr(map.claimGraph);
map.migration = { from: sourceSchemaVersion, warnings: ["Legacy numeric roles were not inferred. Review every role, materiality and display requirement before formal generation."] };
fs.writeFileSync(output, `${JSON.stringify(map, null, 2)}\n`);
console.log(JSON.stringify({ migrated: true, atoms: atoms.length, numericClaims: map.numericClaims.length, output }, null, 2));
