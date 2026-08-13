#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (v) => Array.isArray(v) ? v : [];
const close = (a, b, epsilon = 0.0001) => Math.abs(Number(a) - Number(b)) <= epsilon;

function calculate(formula) {
  const values = arr(formula?.operands).map(Number);
  if (values.some((x) => !Number.isFinite(x))) return null;
  if (formula.operator === "multiply") {
    const raw = values.reduce((acc, value) => acc * value, 1);
    return arr(formula.operandUnits).every((unit) => unit === "%") ? raw / 100 : raw;
  }
  if (formula.operator === "add") return values.reduce((acc, value) => acc + value, 0);
  if (formula.operator === "subtract") return values.slice(1).reduce((acc, value) => acc - value, values[0]);
  if (formula.operator === "divide" && values.length === 2 && values[1] !== 0) return values[0] / values[1];
  return null;
}

export function validateNumericIntegrity(deck, map) {
  const errors = [], warnings = [];
  const claims = new Map(arr(map.numericClaims).map((claim) => [claim.id, claim]));

  for (const claim of claims.values()) {
    if (!Number.isFinite(Number(claim.value))) errors.push(`数字 ${claim.id} 的 value 无效`);
    if (!claim.unit) warnings.push(`数字 ${claim.id} 缺少单位`);
    if (!claim.subject) warnings.push(`数字 ${claim.id} 缺少统计对象`);
    if (claim.formula) {
      const calculated = calculate(claim.formula);
      if (calculated == null) errors.push(`公式 ${claim.id} 无法计算`);
      else if (!close(calculated, claim.formula.result ?? claim.value)) errors.push(`公式 ${claim.id} 不成立：计算值 ${calculated}，声明值 ${claim.formula.result ?? claim.value}`);
      if (!close(claim.formula.result ?? claim.value, claim.value)) errors.push(`公式结果与数字值不一致：${claim.id}`);
    }
  }

  for (const [slideIndex, slide] of arr(deck.slides).entries()) {
    const visual = slide.primaryVisual;
    for (const group of arr(visual?.data?.groups)) {
      const segments = arr(group.segments);
      if (segments.length) {
        const sum = segments.reduce((total, segment) => total + Number(segment.value || 0), 0);
        const expected = Number(group.total ?? (segments.every((segment) => segment.unit === "%") ? 100 : sum));
        if (!close(sum, expected)) errors.push(`第 ${slideIndex + 1} 页 ${group.label || group.id} 构成不闭合：${sum} ≠ ${expected}`);
      }
      if (group.theoretical != null && group.direct != null && group.gap != null && !close(Number(group.theoretical) - Number(group.direct), Number(group.gap))) {
        errors.push(`第 ${slideIndex + 1} 页 ${group.label || group.id} 差额不成立：理论值 - 直接值 ≠ 差额`);
      }
      if (group.threshold && group.actual != null && group.threshold.unit && group.unit && group.threshold.unit !== group.unit) {
        errors.push(`第 ${slideIndex + 1} 页 ${group.label || group.id} 实际值与阈值单位不一致`);
      }
    }
    for (const ref of arr(visual?.claimRefs)) if (!claims.has(ref)) errors.push(`第 ${slideIndex + 1} 页引用不存在的数字 claim：${ref}`);
    for (const module of arr(slide.supportModules)) for (const ref of arr(module.claimRefs)) if (!claims.has(ref)) errors.push(`第 ${slideIndex + 1} 页辅助模块引用不存在的数字 claim：${ref}`);
  }
  return { passed: errors.length === 0, errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-numeric-integrity.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateNumericIntegrity(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
