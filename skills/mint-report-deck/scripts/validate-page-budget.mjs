#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (v) => Array.isArray(v) ? v : [];
const allowedZones = new Set(["title", "primary-visual", "support-band", "risk-callout", "decision-callout", "source-footer", "source-drawer"]);

export function validatePageBudget(deck, map) {
  const errors = [], warnings = [];
  const budget = map.pageBudget || {};
  const constraint = budget.constraint || (budget.requested == null ? "minimum-needed" : "flexible");
  const actual = arr(deck.slides).length;
  if (!["exact", "maximum", "flexible", "minimum-needed"].includes(constraint)) errors.push(`pageBudget.constraint 无效：${constraint}`);
  if (["exact", "maximum"].includes(constraint) && budget.overflowPolicy !== "block") errors.push(`${constraint} 页数合同的 overflowPolicy 必须为 block`);
  if (constraint === "exact" && actual !== budget.requested) errors.push(`用户要求严格 ${budget.requested} 页，实际生成 ${actual} 页；不得擅自拆页`);
  if (constraint === "exact" && budget.planned !== budget.requested) errors.push(`exact 页数合同中 planned 必须等于 requested`);
  if (constraint === "maximum" && actual > budget.requested) errors.push(`用户要求最多 ${budget.requested} 页，实际生成 ${actual} 页`);
  if (budget.requested === 1 && constraint === "exact") {
    if (arr(deck.slides).some((slide) => ["cover", "section-intro"].includes(slide.type))) errors.push("强制一页材料不得生成独立封面或章节页");
    const plan = deck.onePagePlan;
    if (!plan?.managementQuestion || !plan?.pageAnswer || !plan?.primaryRelationship) errors.push("强制一页材料缺少 onePagePlan 的管理问题、页面答案或主关系");
    if (!arr(plan?.readingPath).length) errors.push("强制一页材料缺少 onePagePlan.readingPath");
    const placements = arr(plan?.atomPlacement);
    const primaryAtoms = arr(map.contentAtoms).filter((atom) => atom.materiality === "primary");
    const placementMap = new Map(placements.map((placement) => [placement.atomRef, placement]));
    for (const atom of primaryAtoms) {
      const placement = placementMap.get(atom.id);
      if (!placement) errors.push(`强制一页的信息原子未安排版面位置：${atom.id}`);
      else if (!allowedZones.has(placement.zone) || ["source-footer", "source-drawer"].includes(placement.zone)) errors.push(`主要信息 ${atom.id} 的一页位置无效：${placement.zone}`);
    }
    for (const placement of placements) if (!allowedZones.has(placement.zone)) errors.push(`onePagePlan 使用未知区域：${placement.zone}`);
  }
  if (constraint === "flexible" && budget.requested != null && actual !== budget.requested) warnings.push(`实际页数 ${actual} 与偏好页数 ${budget.requested} 不同；应记录容量理由`);
  return { passed: errors.length === 0, errors, warnings, metrics: { requested: budget.requested ?? null, planned: budget.planned ?? null, actual, constraint } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-page-budget.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validatePageBudget(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
