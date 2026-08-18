#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [pptxArg, reportArg, expectChartArg] = process.argv.slice(2);
if (!pptxArg) {
  console.error("Usage: node qa-pptx-editability.mjs report.pptx [qa-pptx.json] [--expect-native-chart]");
  process.exit(2);
}
const pptx = path.resolve(pptxArg);
const output = path.resolve(reportArg || path.join(path.dirname(pptx), "qa-pptx.json"));
const expectedNativeChart = expectChartArg === "--expect-native-chart";
const list = spawnSync("unzip", ["-Z1", pptx], { encoding: "utf8" });
if (list.status !== 0) throw new Error(list.stderr || "cannot list pptx package");
const parts = list.stdout.trim().split(/\r?\n/).filter(Boolean);
const slideParts = parts.filter((item) => /^ppt\/slides\/slide\d+\.xml$/.test(item));
const chartParts = parts.filter((item) => /^ppt\/(?:charts|slides\/charts)\/chart\d+\.xml$/.test(item));
const relationshipParts = parts.filter((item) => /^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/.test(item));
const nativeChartRelationships = relationshipParts.reduce((count, relationshipPart) => {
  const xml = spawnSync("unzip", ["-p", pptx, relationshipPart], { encoding: "utf8", maxBuffer: 5_000_000 }).stdout;
  return count + (xml.match(/relationships\/chart/g) || []).length;
}, 0);
const mediaParts = parts.filter((item) => /^ppt\/media\//.test(item));
let editableTextCount = 0;
let editableShapeCount = 0;
let pictureCount = 0;
let forbiddenSpecimenText = [];
for (const slidePart of slideParts) {
  const xml = spawnSync("unzip", ["-p", pptx, slidePart], { encoding: "utf8", maxBuffer: 20_000_000 }).stdout;
  editableTextCount += (xml.match(/<a:t>/g) || []).length;
  editableShapeCount += (xml.match(/<p:sp>/g) || []).length;
  pictureCount += (xml.match(/<p:pic>/g) || []).length;
  if (/填写已确认|组件母版示例|生成时必须替换|在此填写/.test(xml)) forbiddenSpecimenText.push(slidePart);
}
const errors = [];
if (!slideParts.length) errors.push("PPTX has no slide XML");
if (!editableTextCount) errors.push("PPTX has no editable text runs");
if (!editableShapeCount) errors.push("PPTX has no editable shapes");
if (forbiddenSpecimenText.length) errors.push(`specimen copy remains in ${forbiddenSpecimenText.join(", ")}`);
if (expectedNativeChart && (!chartParts.length || !nativeChartRelationships)) errors.push("chart page requested but PPTX package has no native chart XML and chart relationship");
const report = {
  schemaVersion: "0.6",
  passed: errors.length === 0,
  pptx,
  metrics: { slides: slideParts.length, editableTextRuns: editableTextCount, editableShapes: editableShapeCount, pictures: pictureCount, mediaParts: mediaParts.length, nativeChartParts: chartParts.length, nativeChartRelationships },
  assertions: { titlesAndBodyEditable: editableTextCount > 0, simpleGraphicsEditable: editableShapeCount > 0, noFullSlideImageSubstitute: pictureCount === 0, nativeChartRequired: expectedNativeChart, nativeChartPresent: chartParts.length > 0 && nativeChartRelationships > 0, noSpecimenCopy: forbiddenSpecimenText.length === 0 },
  errors
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
