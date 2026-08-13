#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (v) => Array.isArray(v) ? v : [];
const text = (v) => typeof v === "string" ? v : Array.isArray(v) ? v.map(text).join(" ") : v && typeof v === "object" ? Object.values(v).map(text).join(" ") : "";
const refsOnSlide = (slide, field) => new Set([
  ...arr(slide[field]),
  ...arr(slide.primaryVisual?.[field]),
  ...arr(slide.supportModules).flatMap((module) => arr(module?.[field]))
]);

export function validateInformationCoverage(deck, map) {
  const errors = [], warnings = [];
  const atomRefs = new Set(arr(deck.slides).flatMap((slide) => [...refsOnSlide(slide, "atomRefs")]));
  const claimRefs = new Set(arr(deck.slides).flatMap((slide) => [...refsOnSlide(slide, "claimRefs")]));
  const deckText = text(deck);
  const graph = arr(map.claimGraph);

  for (const atom of arr(map.contentAtoms)) {
    if (!atom.id) continue;
    const primary = atom.materiality === "primary";
    const omitted = atom.coverageStatus === "omitted-with-reason";
    if (omitted && !atom.omissionReason) errors.push(`信息原子 ${atom.id} 被省略但缺少 omissionReason`);
    if (primary && ["source-only"].includes(atom.displayRequirement)) errors.push(`主要信息 ${atom.id} 不得仅作为来源信息`);
    if (primary && omitted) errors.push(`主要信息 ${atom.id} 不得省略`);
    if (!omitted && !atomRefs.has(atom.id)) {
      const message = `信息原子未映射到页面：${atom.id} · ${atom.text || atom.kind}`;
      (primary ? errors : warnings).push(message);
    }
    if (primary && atom.kind === "judgment" && atom.assertionStatus === "formal") {
      const supported = graph.some((edge) => arr(edge.to).includes(atom.id) && arr(edge.from).length);
      if (!supported) errors.push(`正式判断缺少事实、数字或明确假设支撑：${atom.id}`);
    } else if (primary && atom.kind === "judgment" && !atom.assertionStatus) {
      warnings.push(`判断 ${atom.id} 缺少 assertionStatus；旧输入继续兼容，但新生成必须标记 formal、proposal 或 hypothesis`);
    }
    if (atom.kind === "judgment" && atom.judgmentType === "risk") {
      const risk = atom.risk || {};
      for (const field of ["judgment", "evidence", "impact", "action"]) if (!risk[field] || (Array.isArray(risk[field]) && !risk[field].length)) errors.push(`风险 ${atom.id} 缺少 ${field}`);
    }
  }

  for (const claim of arr(map.numericClaims)) {
    if (!claim.id) continue;
    const primary = claim.materiality === "primary";
    const referenced = claimRefs.has(claim.id);
    if (primary && !referenced) errors.push(`重要数字未进入主视觉或辅助模块：${claim.id} · ${claim.raw || claim.value}`);
    else if (!referenced) warnings.push(`数字未建立结构化页面引用：${claim.id} · ${claim.raw || claim.value}`);
    if (primary && claim.displayRequirement === "annotation") errors.push(`重要数字 ${claim.id} 不能只作为普通说明文字`);
    if (primary && !deckText.includes(String(claim.value))) errors.push(`重要数字值未出现在正式页面：${claim.id} · ${claim.value}${claim.unit || ""}`);
  }

  const sourceEntities = new Set(arr(map.entities).flatMap((entity) => [entity.canonicalName, ...arr(entity.aliases)]));
  for (const entity of arr(map.entities).filter((entity) => entity.requiredOnSlides)) {
    if (!deckText.includes(entity.canonicalName)) errors.push(`缺少关键实体：${entity.canonicalName}`);
  }
  for (const banned of ["Sinova", "Twende", "BaaS"]) {
    if (deckText.includes(banned) && !sourceEntities.has(banned)) errors.push(`出现来源未提供实体：${banned}`);
  }

  for (const priority of arr(map.priorities).filter((item) => item.level === "material")) {
    const visible = arr(deck.slides).some((slide) => slide.type === "risk-spotlight" || slide.type === "decision" || arr(slide.supportModules).some((module) => ["risk-alert", "capital-alert", "decision-callout"].includes(module.kind)) || text(slide.primaryVisual).includes(priority.subject) || text(slide.emphasis).includes(priority.subject));
    if (!visible) errors.push(`重大事项未进入醒目主视觉或提示模块：${priority.id} · ${priority.subject}`);
  }
  for (const action of arr(map.actions)) {
    for (const field of ["action", "owner", "time", "expectedResult"]) if (!action[field]) warnings.push(`行动 ${action.id} 缺少 ${field}；不得补造`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    metrics: {
      primaryAtoms: arr(map.contentAtoms).filter((x) => x.materiality === "primary").length,
      coveredPrimaryAtoms: arr(map.contentAtoms).filter((x) => x.materiality === "primary" && atomRefs.has(x.id)).length,
      primaryNumericClaims: arr(map.numericClaims).filter((x) => x.materiality === "primary").length,
      visiblePrimaryNumericClaims: arr(map.numericClaims).filter((x) => x.materiality === "primary" && claimRefs.has(x.id)).length
    }
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-information-coverage.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateInformationCoverage(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
