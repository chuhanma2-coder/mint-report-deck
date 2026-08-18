#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const relations = new Set(["none","parallel","sequence","temporal","causal","comparison","hierarchy","composition","flow","evidence","before-after","problem-cause-solution","dependency"]);
const roles = new Set(["opening","section-intro","context","claim","evidence","contrast","diagnosis","mechanism","risk","decision","action","summary"]);
const connectors = new Set(["none","branch","line","arrow","bracket","axis"]);
const densities = new Set(["focused","balanced","compact"]);
const axes = new Set(["left-to-right","top-to-bottom","center-out","numbered-path"]);
const requiredCoverage = new Set(["hero","split","parallel-three","four-grid","card-matrix","radial","timeline","horizontal-flow","vertical-flow","comparison","before-after","problem-solution","data-conclusion","big-number","chart-insight","image-text","full-image","hierarchy","total-detail","summary"]);

export function patternCompatible(pattern, request) {
  const reasons = [];
  if (!arr(pattern.relationTypes).includes(request.relationType || "none")) reasons.push("relationType");
  if (request.pageRole && !arr(pattern.pageRoles).includes(request.pageRole)) reasons.push("pageRole");
  const count = Number(request.nodeCount || 1);
  if (count < pattern.cardinality?.min || count > pattern.cardinality?.max) reasons.push("cardinality");
  if (request.dataShape && !arr(pattern.dataShapes).includes(request.dataShape)) reasons.push("dataShape");
  if (request.densityProfile && !arr(pattern.densityProfiles).includes(request.densityProfile)) reasons.push("densityProfile");
  if (request.readingAxis && !arr(pattern.readingAxes).includes(request.readingAxis)) reasons.push("readingAxis");
  if (request.connectorPolicy && !arr(pattern.connectorPolicies).includes(request.connectorPolicy)) reasons.push("connectorPolicy");
  return { compatible: reasons.length === 0, reasons };
}

export function validatePatternRegistry(registry) {
  const errors = [], warnings = [];
  if (registry?.version !== "0.6") errors.push("pattern registry version 必须为0.6");
  if (registry?.fallbackPatternId != null) errors.push("不得配置通用 fallbackPatternId");
  const ids = new Set();
  const coverage = new Set();
  arr(registry?.patterns).forEach((pattern, index) => {
    const at = `patterns[${index}]`;
    if (!pattern.id || ids.has(pattern.id)) errors.push(`${at}.id 缺失或重复`); else ids.add(pattern.id);
    for (const [field, allowed] of [["relationTypes",relations],["pageRoles",roles],["connectorPolicies",connectors],["densityProfiles",densities],["readingAxes",axes]]) {
      if (!arr(pattern[field]).length) errors.push(`${at}.${field} 不能为空`);
      for (const value of arr(pattern[field])) if (!allowed.has(value)) errors.push(`${at}.${field} 含无效值：${value}`);
    }
    if (!Number.isInteger(pattern.cardinality?.min) || !Number.isInteger(pattern.cardinality?.max) || pattern.cardinality.min < 1 || pattern.cardinality.max < pattern.cardinality.min) errors.push(`${at}.cardinality 无效`);
    for (const field of ["dataShapes","requiredZones","rendererKeys","coverageTags"]) if (!pattern[field] || (field !== "rendererKeys" && !arr(pattern[field]).length)) errors.push(`${at}.${field} 缺失`);
    if (!pattern.rendererKeys?.html || !pattern.rendererKeys?.pptx) errors.push(`${at}.rendererKeys 必须同时声明html和pptx`);
    if (pattern.fallback !== false) errors.push(`${at}.fallback 必须显式为false`);
    if (arr(pattern.relationTypes).includes("parallel") && arr(pattern.connectorPolicies).includes("arrow")) errors.push(`${at} parallel Pattern 不得授权 arrow`);
    if (pattern.id === "card-matrix" && (pattern.relationTypes.join(",") !== "parallel" || pattern.cardinality.max > 4 || pattern.dataShapes.join(",") !== "independent-items")) errors.push("card-matrix 只能用于2-4项真正独立并列内容");
    arr(pattern.coverageTags).forEach((tag) => coverage.add(tag));
  });
  for (const tag of requiredCoverage) if (!coverage.has(tag)) errors.push(`缺少用户要求的版式能力：${tag}`);
  return { passed: errors.length === 0, errors, warnings, metrics: { patterns: ids.size, coverageTags: coverage.size } };
}

function runCli() {
  const file = path.resolve(process.argv[2] || "");
  if (!fs.existsSync(file)) {
    console.error("Usage: node validate-pattern-registry.mjs /absolute/path/layout-patterns.json");
    process.exit(2);
  }
  const result = validatePatternRegistry(JSON.parse(fs.readFileSync(file, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
