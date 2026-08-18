#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const compact = (value) => String(value || "").replace(/[\s，。；：、,.!?！？—-]/g, "");
const titleUnits = (value) => [...String(value || "").replace(/\s/g, "")].reduce((sum, char) => sum + (/^[\x00-\xff]$/.test(char) ? 0.55 : 1), 0);
const genericTitles = new Set(["背景", "现状", "进展", "问题", "方案", "风险", "下一步", "总结", "项目介绍", "业务介绍", "市场情况"]);

export function validateNarrativeContract(deck, map) {
  const errors = [], warnings = [];
  if (map.schemaVersion !== "0.5" && deck.schemaVersion !== "0.5") return { passed: true, errors, warnings, metrics: { ghostPages: 0, discourseUnits: 0 } };

  const commitment = map.narrativeCommitment || {};
  for (const field of ["audienceShift", "coreThesis", "decision", "pageBudgetPriority"]) if (!commitment[field]) errors.push(`narrativeCommitment.${field} 缺失`);
  if (!arr(commitment.mustShowAtomRefs).length) errors.push("narrativeCommitment.mustShowAtomRefs 不能为空");
  if (!Array.isArray(commitment.mustNotInfer)) errors.push("narrativeCommitment.mustNotInfer 必须为数组");

  const allowedRoles = new Set(["context", "claim", "evidence", "contrast", "condition", "cause", "effect", "action", "boundary"]);
  const allowedRelations = new Set(["starts", "elaborates", "supports", "contrasts", "causes", "conditions", "results-in", "sequences", "concludes"]);
  const discourseUnits = arr(map.discourseUnits);
  if (!discourseUnits.length) errors.push("discourseUnits 不能为空；V0.5 不得直接从原始段落选择页面");
  discourseUnits.forEach((unit, index) => {
    if (!unit.id || !unit.text || !unit.subject || !unit.predicate || !unit.sourceRef) errors.push(`discourseUnits[${index}] 缺少 id、text、subject、predicate 或 sourceRef`);
    if (!allowedRoles.has(unit.role)) errors.push(`discourseUnits[${index}] role 无效`);
    if (!allowedRelations.has(unit.relationToPrevious)) errors.push(`discourseUnits[${index}] relationToPrevious 无效`);
  });

  const ghost = arr(map.ghostDeck);
  if (!ghost.length) errors.push("ghostDeck 不能为空；必须先用行动标题讲通整份材料");
  if (ghost.length !== map.pageBudget?.planned) errors.push(`ghostDeck 页数 ${ghost.length} 与 pageBudget.planned ${map.pageBudget?.planned} 不一致`);
  const slideById = new Map(arr(deck.slides).map((slide) => [slide.id, slide]));
  const knownEvidence = new Set([
    ...arr(map.facts).map((item) => item.id),
    ...arr(map.numericClaims).map((item) => item.id),
    ...arr(map.contentAtoms).filter((item) => item.kind === "evidence" || item.kind === "fact" || item.kind === "numeric").map((item) => item.id)
  ]);
  const primaryAtoms = arr(map.contentAtoms).filter((atom) => atom.materiality === "primary");
  const atomCounts = new Map();
  const titleSet = new Set();
  const allowedNecessity = new Set(["opening", "independent-decision", "capacity", "section-intro"]);

  ghost.forEach((page, index) => {
    for (const field of ["pageId", "actionTitle", "pageRole", "managementQuestion", "answer"]) if (!page[field]) errors.push(`ghostDeck[${index}].${field} 缺失`);
    const normalizedTitle = compact(page.actionTitle);
    if (genericTitles.has(normalizedTitle)) errors.push(`ghostDeck[${index}] 使用主题标签而非行动标题：${page.actionTitle}`);
    if (titleUnits(page.actionTitle) > 36) errors.push(`ghostDeck[${index}] 行动标题超过 36 个中文字符宽`);
    if (titleSet.has(normalizedTitle)) errors.push(`ghostDeck[${index}] 与其他页面标题重复：${page.actionTitle}`);
    titleSet.add(normalizedTitle);
    if (index > 0 && !page.transitionFromPrevious) errors.push(`ghostDeck[${index}] 缺少 transitionFromPrevious`);
    const necessity = page.pageNecessity || {};
    if (!allowedNecessity.has(necessity.type) || !necessity.reason) errors.push(`ghostDeck[${index}] 缺少有效 pageNecessity.type/reason`);
    if (!arr(page.atomRefs).length && !["opening", "section-intro"].includes(necessity.type)) errors.push(`ghostDeck[${index}] 内容页没有 atomRefs`);
    arr(page.atomRefs).forEach((ref) => atomCounts.set(ref, (atomCounts.get(ref) || 0) + 1));
    arr(page.evidenceRefs).forEach((ref) => { if (!knownEvidence.has(ref)) errors.push(`ghostDeck[${index}] evidenceRef 不存在：${ref}`); });

    const slide = slideById.get(page.pageId);
    if (!slide) errors.push(`ghostDeck[${index}] 未映射到 deck slide：${page.pageId}`);
    else {
      if (compact(arr(slide.titleLines).join("")) !== normalizedTitle) errors.push(`页面 ${page.pageId} 标题与 ghostDeck.actionTitle 不一致`);
      if (compact(slide.pageQuestion) !== compact(page.managementQuestion)) errors.push(`页面 ${page.pageId} pageQuestion 与 ghostDeck 不一致`);
      if (compact(slide.pageAnswer) !== compact(page.answer)) errors.push(`页面 ${page.pageId} pageAnswer 与 ghostDeck 不一致`);
      const slideAtoms = new Set(arr(slide.atomRefs));
      for (const ref of arr(page.atomRefs)) if (!slideAtoms.has(ref)) errors.push(`页面 ${page.pageId} 未承接 ghostDeck atomRef：${ref}`);
    }
  });

  for (const atom of primaryAtoms) {
    const count = atomCounts.get(atom.id) || 0;
    if (count === 0) errors.push(`主要信息未进入 ghostDeck：${atom.id}`);
    if (count > 1) errors.push(`主要信息在 ghostDeck 重复分配：${atom.id}`);
  }
  for (const ref of arr(commitment.mustShowAtomRefs)) if ((atomCounts.get(ref) || 0) !== 1) errors.push(`narrativeCommitment 重点信息未且仅未出现一次：${ref}`);
  for (const slide of arr(deck.slides)) if (slide.id && !ghost.some((page) => page.pageId === slide.id)) errors.push(`deck 页面未进入 ghostDeck：${slide.id}`);

  return { passed: errors.length === 0, errors, warnings, metrics: { ghostPages: ghost.length, discourseUnits: discourseUnits.length, coveredPrimaryAtoms: primaryAtoms.filter((atom) => atomCounts.get(atom.id) === 1).length, primaryAtoms: primaryAtoms.length } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-narrative-contract.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateNarrativeContract(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

