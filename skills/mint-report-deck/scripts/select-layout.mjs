#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { patternCompatible, validatePatternRegistry } from "./validate-pattern-registry.mjs";
import { scoreLayoutCandidates } from "./score-layout-candidates.mjs";

const arr = (value) => Array.isArray(value) ? value : [];

function dataShapeFor(page, relationType) {
  if (page.proofObject?.dataShape) return page.proofObject.dataShape;
  if (page.proofObject?.kind === "numeric-evidence") return relationType === "composition" ? "numeric" : "numeric";
  if (page.proofObject?.kind === "media-evidence") return "media";
  const mapping = {
    parallel:"independent-items", sequence:"ordered-actions", temporal:"milestones", flow:"ordered-actions", dependency:"ordered-actions",
    comparison:"paired-objects", "before-after":"paired-objects", causal:"causal-claims", "problem-cause-solution":"causal-claims",
    hierarchy:"hierarchy", composition:"hierarchy", evidence:"mixed-evidence", none:"text"
  };
  return mapping[relationType] || "text";
}

export function buildLayoutRequest(page, semanticGraph) {
  const edgeById = new Map(arr(semanticGraph?.edges).map((edge) => [edge.id, edge]));
  const refs = arr(page.relationGraphRefs);
  if (refs.length > 1 && !page.primaryRelationRef) return { blocked:true, reason:"页面包含多个关系但缺少 primaryRelationRef" };
  const primary = page.primaryRelationRef ? edgeById.get(page.primaryRelationRef) : refs.length === 1 ? edgeById.get(refs[0]) : null;
  if (page.primaryRelationRef && !primary) return { blocked:true, reason:`primaryRelationRef 不存在：${page.primaryRelationRef}` };
  if (primary?.needsReview || Number(primary?.confidence) < 0.75) return { blocked:true, reason:`主关系未确认：${primary.id}` };
  const relationType = primary?.relationType || "none";
  return {
    blocked:false,
    relationType,
    pageRole:page.pageRole,
    nodeCount:arr(page.atomRefs).length,
    dataShape:dataShapeFor(page, relationType),
    densityProfile:page.densityProfile,
    readingAxis:page.readingAxis,
    connectorPolicy:primary?.connectorPolicy || "none",
    proofKind:page.proofObject?.kind
  };
}

export function selectLayout(page, semanticGraph, registry, adjacentPageSummary = {}) {
  const registryValidation = validatePatternRegistry(registry);
  if (!registryValidation.passed) return { status:"blocked", patternId:null, reason:`Pattern Registry无效：${registryValidation.errors.join(" | ")}`, candidates:[], rejected:[] };
  const request = buildLayoutRequest(page, semanticGraph);
  if (request.blocked) return { status:"needs-layout-review", patternId:null, reason:request.reason, request, candidates:[], rejected:[] };
  const compatible = [];
  const rejected = [];
  for (const pattern of registry.patterns) {
    const result = patternCompatible(pattern, request);
    if (result.compatible) compatible.push(pattern);
    else rejected.push({ patternId:pattern.id, reasons:result.reasons });
  }
  if (!compatible.length) return { status:"needs-layout-review", patternId:null, reason:"没有同时满足语义、容量、数据形状、阅读轴和连接器合同的Pattern；禁止回退到表格或卡片页", request, candidates:[], rejected };
  const scored = scoreLayoutCandidates(compatible, request, adjacentPageSummary);
  const recent = arr(adjacentPageSummary.recentPatternIds).slice(-2);
  const repeatedTwice = recent.length === 2 && recent[0] === recent[1];
  const rhythmAlternative = repeatedTwice ? scored.find((candidate) => candidate.patternId !== recent[0]) : null;
  const selected = rhythmAlternative || scored[0];
  const rhythmException = repeatedTwice && !rhythmAlternative ? { type:"no-compatible-alternative", reason:`最近两页均为${recent[0]}，但本页没有其他通过硬约束的兼容Pattern` } : null;
  return {
    status:"selected",
    patternId:selected.patternId,
    request,
    candidates:scored,
    rejected,
    ...(rhythmException ? { rhythmException } : {}),
    selectionReason:`先通过6项硬约束，再按语义50%、容量20%、证据15%、整份节奏10%、媒体适配5%评分；${rhythmAlternative ? `为避免连续第三页重复，在兼容候选中选择${selected.patternId}；` : ""}${selected.reason}`
  };
}

function runCli() {
  const planFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  const registryFile = path.resolve(process.argv[4] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/layout-patterns.json"));
  const outputFile = process.argv[5] ? path.resolve(process.argv[5]) : null;
  if (!fs.existsSync(planFile) || !fs.existsSync(mapFile) || !fs.existsSync(registryFile)) {
    console.error("Usage: node select-layout.mjs deck-plan.json content-map.json [layout-patterns.json] [layout-selection.json]");
    process.exit(2);
  }
  const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
  const map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
  const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
  const selections = [];
  let adjacent = {};
  for (const page of arr(plan.pageContracts)) {
    const selection = selectLayout(page, map.semanticGraph, registry, adjacent);
    selections.push({ pageId:page.id, ...selection });
    if (selection.status === "selected") {
      const pattern = registry.patterns.find((item) => item.id === selection.patternId);
      adjacent = { lastPatternId:selection.patternId, lastRendererKey:pattern?.rendererKeys.html, recentPatternIds:[...arr(adjacent.recentPatternIds),selection.patternId].slice(-2) };
    }
  }
  const output = { schemaVersion:"0.6", status:selections.every((item) => item.status === "selected") ? "selected" : "needs-layout-review", selections };
  if (outputFile) {
    fs.mkdirSync(path.dirname(outputFile), { recursive:true });
    fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`);
  }
  console.log(JSON.stringify(output, null, 2));
  process.exit(output.status === "selected" ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
