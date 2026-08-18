#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const axes = new Set(["left-to-right", "top-to-bottom", "center-out", "numbered-path"]);

export function validateReadingContract(plan, layoutSelection, registry) {
  const errors = [], warnings = [];
  const patternById = new Map(arr(registry?.patterns).map((pattern) => [pattern.id, pattern]));
  const selectionByPage = new Map(arr(layoutSelection?.selections).map((selection) => [selection.pageId, selection]));
  for (const page of arr(plan?.pageContracts)) {
    const at = `页面 ${page.id}`;
    const order = arr(page.contentOrder);
    if (!axes.has(page.readingAxis)) errors.push(`${at} readingAxis 无效`);
    if (order.length < 3 || new Set(order).size !== order.length) errors.push(`${at} 必须有至少3个唯一阅读位置`);
    if (order[0] !== "title") errors.push(`${at} 第一阅读位置必须为标题`);
    if (order[1] !== "page-answer") errors.push(`${at} 第二阅读位置必须为页面答案`);
    if (order[2] !== "proof-object") errors.push(`${at} 第三阅读位置必须为主证据`);
    if (order.filter((item) => item === page.focalAnchor).length !== 1) errors.push(`${at} 必须且只能有一个 focalAnchor`);
    const selection = selectionByPage.get(page.id);
    const pattern = patternById.get(selection?.patternId);
    if (selection?.status === "selected" && pattern && !arr(pattern.readingAxes).includes(page.readingAxis)) errors.push(`${at} readingAxis 与Pattern ${pattern.id}不一致`);
  }
  return { passed: errors.length === 0, errors, warnings, metrics: { pages: arr(plan?.pageContracts).length, clearReadingPaths: arr(plan?.pageContracts).filter((page) => arr(page.contentOrder).length >= 3 && page.contentOrder[0] === "title").length } };
}

function runCli() {
  const [planArg, selectionArg, registryArg] = process.argv.slice(2);
  const files = [planArg, selectionArg, registryArg].map((file) => path.resolve(file || ""));
  if (files.some((file) => !fs.existsSync(file))) {
    console.error("Usage: node validate-reading-contract.mjs deck-plan.json layout-selection.json layout-patterns.json");
    process.exit(2);
  }
  const [plan, selection, registry] = files.map((file) => JSON.parse(fs.readFileSync(file, "utf8")));
  const result = validateReadingContract(plan, selection, registry);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
