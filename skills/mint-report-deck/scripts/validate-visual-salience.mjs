#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (v) => Array.isArray(v) ? v : [];
const quantitativeKinds = new Set(["hero-metric", "metric-strip", "threshold-bar", "allocation-bar", "formula-band", "gap-bridge", "actual-target", "range-band", "ranked-comparison", "trend-chart", "waterfall", "distribution", "scenario-comparison"]);

export function validateVisualSalience(deck, map) {
  const errors = [], warnings = [];
  const claimMap = new Map(arr(map.numericClaims).map((claim) => [claim.id, claim]));
  for (const [index, slide] of arr(deck.slides).entries()) {
    const at = `第 ${index + 1} 页`;
    if (["0.4", "0.5"].includes(deck.schemaVersion)) {
      if (!slide.pageQuestion) errors.push(`${at} 缺少 pageQuestion`);
      if (!slide.pageAnswer) errors.push(`${at} 缺少 pageAnswer`);
      if (!slide.primaryVisual?.kind) errors.push(`${at} 缺少 primaryVisual.kind`);
      if (arr(slide.supportModules).length > 2) errors.push(`${at} 辅助模块超过 2 个`);
      if (!arr(slide.readingOrder).length) errors.push(`${at} 缺少 readingOrder`);
      const share = Number(slide.primaryVisual?.visualShare ?? 0.62);
      if (share < 0.55 || share > 0.70) errors.push(`${at} 主视觉占比必须在 55%–70%`);
    }
    const primaryClaims = arr(slide.primaryVisual?.claimRefs).map((id) => claimMap.get(id)).filter(Boolean);
    if (primaryClaims.some((claim) => claim.materiality === "primary") && !quantitativeKinds.has(slide.primaryVisual?.kind)) {
      errors.push(`${at} 重要数字使用了非定量主视觉 ${slide.primaryVisual?.kind || "missing"}`);
    }
    if (slide.type === "table" && primaryClaims.length) warnings.push(`${at} 重要数字仍使用表格；确认受众任务是否为精确查阅`);
    if (slide.type === "comparison" && primaryClaims.some((claim) => ["formula-result", "upper-bound", "lower-bound", "gap", "part", "remainder", "actual", "target"].includes(claim.role))) {
      errors.push(`${at} 公式、阈值、差额或构成被降级为普通对比`);
    }
  }
  return { passed: errors.length === 0, errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-visual-salience.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateVisualSalience(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
