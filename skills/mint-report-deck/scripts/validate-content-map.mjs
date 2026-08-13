#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(file)) {
  console.error("Usage: node validate-content-map.mjs /absolute/path/content-map.json");
  process.exit(2);
}
const map = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const warnings = [];
const arr = (v) => Array.isArray(v) ? v : [];
const requireRefs = (items, name) => arr(items).forEach((x, i) => {
  if (!x.id) errors.push(`${name}[${i}] 缺少 id`);
  if (!x.sourceRef) errors.push(`${name}[${i}] 缺少 sourceRef`);
});

if (map.schemaVersion !== "0.2") errors.push("schemaVersion 必须为 0.2");
for (const key of ["audience", "purpose", "desiredOutcome", "managementTakeaway"]) {
  if (!map.communicationJob?.[key]) errors.push(`communicationJob.${key} 缺失`);
}
requireRefs(map.facts, "facts");
requireRefs(map.numbers, "numbers");
requireRefs(map.actions, "actions");
arr(map.entities).forEach((x, i) => { if (!x.id || !x.canonicalName) errors.push(`entities[${i}] 缺少 id 或 canonicalName`); });
arr(map.relationships).forEach((x, i) => { if (!x.id || !x.type || !x.statement) errors.push(`relationships[${i}] 缺少 id、type 或 statement`); });
const budget = map.pageBudget || {};
if (!Number.isInteger(budget.minimum) || budget.minimum < 1) errors.push("pageBudget.minimum 必须为正整数");
if (!Number.isInteger(budget.planned) || budget.planned < budget.minimum) errors.push("pageBudget.planned 必须不小于 minimum");
if (budget.requested != null && (!Number.isInteger(budget.requested) || budget.requested < 1)) errors.push("pageBudget.requested 必须为空或正整数");
if (budget.planned > 1 && !budget.reason) warnings.push("多页材料应说明增加页面的容量或命题理由");
if (!["ordinary", "confirm-first"].includes(map.riskLevel)) errors.push("riskLevel 必须为 ordinary 或 confirm-first");
if (map.riskLevel === "confirm-first" && (arr(map.unknowns).length || arr(map.conflicts).length)) warnings.push("高风险材料仍有未知或冲突，正式生成前应确认");

console.log(JSON.stringify({ passed: errors.length === 0, errors, warnings }, null, 2));
process.exit(errors.length ? 1 : 0);
