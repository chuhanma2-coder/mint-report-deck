#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePageContracts } from "./validate-page-contracts.mjs";
import { buildLayoutRequest } from "./select-layout.mjs";
import { patternCompatible, validatePatternRegistry } from "./validate-pattern-registry.mjs";
import { validateConnectorContract } from "./validate-connector-contract.mjs";

const arr = (value) => Array.isArray(value) ? value : [];

export function validateSemanticLayout(plan, map, layoutSelection, registry, deck = null) {
  const errors = [], warnings = [];
  const pageResult = validatePageContracts(plan, map);
  errors.push(...pageResult.errors.map((error) => `page-contract: ${error}`));
  warnings.push(...pageResult.warnings.map((warning) => `page-contract: ${warning}`));
  const registryResult = validatePatternRegistry(registry);
  errors.push(...registryResult.errors.map((error) => `pattern-registry: ${error}`));
  const patternById = new Map(arr(registry?.patterns).map((pattern) => [pattern.id, pattern]));
  const selectionByPage = new Map(arr(layoutSelection?.selections).map((selection) => [selection.pageId, selection]));
  for (const page of arr(plan?.pageContracts)) {
    const selection = selectionByPage.get(page.id);
    if (!selection) {
      errors.push(`页面 ${page.id} 缺少 layout selection`);
      continue;
    }
    if (selection.status !== "selected" || !selection.patternId) {
      errors.push(`页面 ${page.id} 未选择合法Pattern：${selection.status || "unknown"}`);
      continue;
    }
    const pattern = patternById.get(selection.patternId);
    if (!pattern) {
      errors.push(`页面 ${page.id} 引用不存在Pattern：${selection.patternId}`);
      continue;
    }
    const request = buildLayoutRequest(page, map?.semanticGraph);
    if (request.blocked) {
      errors.push(`页面 ${page.id} 主关系不可用于版式：${request.reason}`);
      continue;
    }
    const compatible = patternCompatible(pattern, request);
    if (!compatible.compatible) errors.push(`页面 ${page.id} 的Pattern ${pattern.id} 与页面合同不兼容：${compatible.reasons.join(",")}`);
  }
  for (const selection of arr(layoutSelection?.selections)) if (!arr(plan?.pageContracts).some((page) => page.id === selection.pageId)) errors.push(`layout selection 包含无页面合同的页面：${selection.pageId}`);
  if (deck) {
    const connectorResult = validateConnectorContract(deck, map);
    errors.push(...connectorResult.errors.map((error) => `connector-contract: ${error}`));
    warnings.push(...connectorResult.warnings.map((warning) => `connector-contract: ${warning}`));
  }
  return { passed: errors.length === 0, errors, warnings, metrics: { pages: arr(plan?.pageContracts).length, selectedPatterns: selectionByPage.size, connectorPages: deck ? arr(deck.slides).length : 0 } };
}

function runCli() {
  const [planArg, mapArg, selectionArg, registryArg, deckArg] = process.argv.slice(2);
  const files = [planArg, mapArg, selectionArg, registryArg].map((file) => path.resolve(file || ""));
  if (files.some((file) => !fs.existsSync(file))) {
    console.error("Usage: node validate-semantic-layout.mjs deck-plan.json content-map.json layout-selection.json layout-patterns.json [deck-spec.json]");
    process.exit(2);
  }
  const [plan, map, selection, registry] = files.map((file) => JSON.parse(fs.readFileSync(file, "utf8")));
  const deckFile = deckArg ? path.resolve(deckArg) : null;
  const deck = deckFile && fs.existsSync(deckFile) ? JSON.parse(fs.readFileSync(deckFile, "utf8")) : null;
  const result = validateSemanticLayout(plan, map, selection, registry, deck);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
