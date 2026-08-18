#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cjkUnits, validateCjkLines } from "./cjk-text-fit.mjs";

const arr = (value) => Array.isArray(value) ? value : [];
const readingAxes = new Set(["left-to-right", "top-to-bottom", "center-out", "numbered-path"]);
const roles = new Set(["opening", "section-intro", "context", "claim", "evidence", "contrast", "diagnosis", "mechanism", "risk", "decision", "action", "summary"]);
const densityProfiles = new Set(["focused", "balanced", "compact"]);
const proofKinds = new Set(["source-backed-claim", "semantic-relationship", "numeric-evidence", "decision-evidence", "media-evidence"]);
const titleUnits = cjkUnits;

export function validatePageContracts(plan, map) {
  const errors = [], warnings = [];
  if (plan?.schemaVersion !== "0.6") errors.push("deck plan schemaVersion 必须为0.6");
  const pages = arr(plan?.pageContracts);
  const atoms = new Map(arr(map?.contentAtoms).map((atom) => [atom.id, atom]));
  const primaryIds = new Set(arr(map?.contentAtoms).filter((atom) => atom.materiality === "primary").map((atom) => atom.id));
  const edges = new Map(arr(map?.semanticGraph?.edges).map((edge) => [edge.id, edge]));
  const pageIds = new Set();
  const atomCounts = new Map();
  const budget = map?.pageBudget || plan?.pageBudget || {};
  if (!pages.length) errors.push("pageContracts 不能为空");
  if (pages.length !== budget.planned) errors.push(`pageContracts ${pages.length}页与 planned ${budget.planned}页不一致`);
  if (budget.constraint === "exact" && pages.length !== budget.requested) errors.push(`强制 ${budget.requested} 页合同被拆成 ${pages.length} 页`);
  if (budget.constraint === "maximum" && pages.length > budget.requested) errors.push(`页面合同超过最多 ${budget.requested} 页`);

  pages.forEach((page, index) => {
    const at = `pageContracts[${index}]`;
    if (!page.id || pageIds.has(page.id)) errors.push(`${at}.id 缺失或重复`); else pageIds.add(page.id);
    for (const field of ["sectionId", "actionTitle", "pageQuestion", "pageAnswer", "focalAnchor"]) if (!page[field]) errors.push(`${at}.${field} 缺失`);
    if (!roles.has(page.pageRole)) errors.push(`${at}.pageRole 无效`);
    if (!readingAxes.has(page.readingAxis)) errors.push(`${at}.readingAxis 无效`);
    if (!densityProfiles.has(page.densityProfile)) errors.push(`${at}.densityProfile 无效`);
    const titleValidation = validateCjkLines(arr(page.titleLines));
    if (!titleValidation.passed) errors.push(...titleValidation.errors.map((error) => `${at}.titleLines ${error}`));
    if (titleUnits(page.actionTitle) > 36) errors.push(`${at}.actionTitle 超过36个中文字符宽`);
    const order = arr(page.contentOrder);
    if (order.length < 3 || new Set(order).size !== order.length) errors.push(`${at}.contentOrder 必须包含至少3个唯一阅读位置`);
    if (order[0] !== "title") errors.push(`${at}.contentOrder 第一阅读位置必须为 title`);
    if (!order.includes(page.focalAnchor)) errors.push(`${at}.focalAnchor 未进入 contentOrder`);
    const refs = arr(page.atomRefs);
    if (!refs.length) errors.push(`${at}.atomRefs 不能为空`);
    const pagePrimary = refs.filter((ref) => primaryIds.has(ref));
    if (!pagePrimary.length) errors.push(`${at} 没有 primary atom，属于空内容页`);
    refs.forEach((ref) => {
      if (!atoms.has(ref)) errors.push(`${at}.atomRef 不存在：${ref}`);
      if (primaryIds.has(ref)) atomCounts.set(ref, (atomCounts.get(ref) || 0) + 1);
    });
    const proof = page.proofObject || {};
    if (!proofKinds.has(proof.kind)) errors.push(`${at}.proofObject.kind 无效`);
    if (!proof.primaryAtomRef || !pagePrimary.includes(proof.primaryAtomRef)) errors.push(`${at}.proofObject.primaryAtomRef 必须引用本页主要信息`);
    if (!arr(proof.atomRefs).length || !arr(proof.atomRefs).every((ref) => refs.includes(ref))) errors.push(`${at}.proofObject.atomRefs 必须是本页 atomRefs 的非空子集`);
    if (!arr(proof.evidenceRefs).length) errors.push(`${at}.proofObject.evidenceRefs 不能为空`);
    if (!proof.description) errors.push(`${at}.proofObject.description 缺失`);
    for (const ref of arr(page.relationGraphRefs)) {
      const edge = edges.get(ref);
      if (!edge) errors.push(`${at}.relationGraphRef 不存在：${ref}`);
      else if (edge.needsReview || Number(edge.confidence) < 0.75) errors.push(`${at}.relationGraphRef 未确认：${ref}`);
    }
    if (arr(page.relationGraphRefs).length > 1 && !page.primaryRelationRef) errors.push(`${at} 有多个语义关系但未声明 primaryRelationRef`);
    if (page.primaryRelationRef != null && !arr(page.relationGraphRefs).includes(page.primaryRelationRef)) errors.push(`${at}.primaryRelationRef 未进入 relationGraphRefs`);
    if (index === 0 && page.transitionFromPrevious != null) errors.push(`${at} 首页面不得引用上一页`);
    if (index > 0 && page.transitionFromPrevious?.fromPageId !== pages[index - 1]?.id) errors.push(`${at} 未从上一页 ${pages[index - 1]?.id} 顺序承接`);
  });

  for (const id of primaryIds) {
    const count = atomCounts.get(id) || 0;
    if (count === 0) errors.push(`主要信息未分配到任何页面：${id}`);
    if (count > 1) errors.push(`主要信息重复分配到多个页面：${id}`);
  }
  const sectionIds = new Set(arr(plan?.sections).map((section) => section.id));
  for (const page of pages) if (!sectionIds.has(page.sectionId)) errors.push(`页面 ${page.id} 的 sectionId 未进入 sections：${page.sectionId}`);
  for (const section of arr(plan?.sections)) {
    if (!section.id || !section.title || section.introFamily !== plan.sectionIntroFamily || !arr(section.pageIds).length) errors.push(`section ${section.id || "<empty>"} 合同不完整`);
    for (const pageId of arr(section.pageIds)) if (!pageIds.has(pageId)) errors.push(`section ${section.id} 引用不存在页面：${pageId}`);
  }
  const introPages = pages.filter((page) => page.pageRole === "section-intro");
  if (new Set(introPages.map((page) => page.introFamily)).size > 1) errors.push("章节引言 introFamily 不一致");
  if (new Set(introPages.map((page) => `${page.readingAxis}|${page.contentOrder.join(",")}`)).size > 1) errors.push("章节引言阅读结构不一致");
  if (budget.constraint === "exact" && budget.requested === 1) {
    if (!plan.onePagePlan) errors.push("强制一页缺少 onePagePlan");
    if (pages.some((page) => page.pageRole === "section-intro")) errors.push("强制一页不得生成独立章节引言");
  }
  return { passed: errors.length === 0, errors, warnings, metrics: { pages: pages.length, primaryAtoms: primaryIds.size, coveredPrimaryAtoms: [...primaryIds].filter((id) => atomCounts.get(id) === 1).length, sections: arr(plan?.sections).length } };
}

function runCli() {
  const planFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(planFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-page-contracts.mjs /absolute/path/deck-plan.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validatePageContracts(JSON.parse(fs.readFileSync(planFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
