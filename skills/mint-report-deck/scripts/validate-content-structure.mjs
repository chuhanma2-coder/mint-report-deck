#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (v) => Array.isArray(v) ? v : [];
const validRoles = new Set(["background", "evidence", "mechanism", "implication", "risk", "action", "boundary"]);

export function validateContentStructure(deck, map) {
  const errors = [], warnings = [];
  const threads = arr(map.decisionThreads);
  const primaryAtoms = arr(map.contentAtoms).filter((atom) => atom.materiality === "primary");
  if (!threads.length) {
    warnings.push("缺少 decisionThreads；旧输入继续兼容，但新生成不得直接按标题分页面");
    return { passed: true, errors, warnings, metrics: { threads: 0, assignedPrimaryAtoms: 0, primaryAtoms: primaryAtoms.length } };
  }
  const counts = new Map();
  for (const [index, thread] of threads.entries()) {
    if (!thread.id || !thread.managementQuestion || !thread.answer) errors.push(`decisionThreads[${index}] 缺少 id、managementQuestion 或 answer`);
    if (!thread.pageAssignment) errors.push(`decisionThreads[${index}] 缺少 pageAssignment`);
    for (const role of arr(thread.roles)) if (!validRoles.has(role)) errors.push(`decisionThreads[${index}] 内容角色无效：${role}`);
    for (const atomRef of arr(thread.atomRefs)) counts.set(atomRef, (counts.get(atomRef) || 0) + 1);
  }
  for (const atom of primaryAtoms) {
    const count = counts.get(atom.id) || 0;
    if (count === 0) errors.push(`主要信息未分配到决策线程：${atom.id}`);
    if (count > 1) errors.push(`主要信息被重复分配到多个决策线程：${atom.id}`);
  }
  const budget = map.pageBudget || {};
  if (budget.constraint === "exact" && budget.requested === 1) {
    const assignments = new Set(threads.map((thread) => thread.pageAssignment));
    if (assignments.size !== 1) errors.push(`强制一页材料的决策线程被分配到 ${assignments.size} 个页面`);
  }
  if (threads.length > 1 && budget.constraint !== "exact") {
    for (const thread of threads.slice(1)) {
      const test = thread.independenceTest || {};
      if (![test.differentDecision, test.understandableWithoutOtherThreads, test.ownEvidenceAndImplication, test.separationPreservesLogic].every(Boolean)) {
        errors.push(`决策线程 ${thread.id} 未通过四项独立性检查，不得单独成页`);
      }
    }
  }
  const deckThreadRefs = new Set(arr(deck.slides).flatMap((slide) => arr(slide.threadRefs)));
  for (const thread of threads) if (!deckThreadRefs.has(thread.id)) errors.push(`决策线程未映射到页面：${thread.id}`);
  return { passed: errors.length === 0, errors, warnings, metrics: { threads: threads.length, assignedPrimaryAtoms: primaryAtoms.filter((atom) => counts.get(atom.id) === 1).length, primaryAtoms: primaryAtoms.length } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-content-structure.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateContentStructure(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
