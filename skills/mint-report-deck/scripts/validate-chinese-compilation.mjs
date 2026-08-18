#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

export function validateChineseCompilation(map) {
  const errors = [], warnings = [];
  if (!["0.5", "0.6"].includes(map.schemaVersion)) return { passed: true, errors, warnings, metrics: { discourseUnits: 0 } };

  const roles = new Set(["context", "claim", "evidence", "contrast", "condition", "cause", "effect", "action", "boundary"]);
  const relations = new Set(["starts", "elaborates", "supports", "contrasts", "causes", "conditions", "results-in", "sequences", "concludes"]);
  const resolutions = new Set(["explicit", "inherited", "unknown"]);
  const polarities = new Set(["affirmative", "negative"]);
  const modalities = new Set(["confirmed", "plan", "proposal", "hypothesis", "unknown"]);
  const units = arr(map.discourseUnits);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const numericIds = new Set(arr(map.numericClaims).map((claim) => claim.id));
  const unknownIds = new Set(arr(map.unknowns).map((item) => item.id));

  units.forEach((unit, index) => {
    const at = `discourseUnits[${index}]`;
    for (const field of ["id", "text", "subject", "predicate", "sourceRef"]) if (!nonempty(unit[field])) errors.push(`${at}.${field} 缺失`);
    if (!resolutions.has(unit.subjectResolution)) errors.push(`${at}.subjectResolution 无效`);
    if (!polarities.has(unit.polarity)) errors.push(`${at}.polarity 无效`);
    if (!modalities.has(unit.modality)) errors.push(`${at}.modality 无效`);
    if (!roles.has(unit.role)) errors.push(`${at}.role 无效`);
    if (!relations.has(unit.relationToPrevious)) errors.push(`${at}.relationToPrevious 无效`);
    if (index === 0 && unit.relationToPrevious !== "starts") errors.push("首个 discourseUnit 必须 relationToPrevious=starts");
    if (unit.subjectResolution === "inherited") {
      if (!unit.inheritedFrom || !unitById.has(unit.inheritedFrom)) errors.push(`${at} 继承主语但 inheritedFrom 不存在`);
      else if (unitById.get(unit.inheritedFrom)?.sectionId !== unit.sectionId && (unit.sectionId || unitById.get(unit.inheritedFrom)?.sectionId)) errors.push(`${at} 不得跨章节继承主语`);
    }
    if (unit.subjectResolution === "unknown" && !unit.unknownRef) errors.push(`${at} 主语未知但缺少 unknownRef`);
    if (unit.unknownRef && !unknownIds.has(unit.unknownRef)) errors.push(`${at}.unknownRef 不存在：${unit.unknownRef}`);
    for (const ref of arr(unit.numericClaimRefs)) if (!numericIds.has(ref)) errors.push(`${at}.numericClaimRefs 不存在：${ref}`);

    const source = String(unit.text || "");
    if (/^(但|但是|然而|相比之下)/.test(source) && unit.relationToPrevious !== "contrasts") warnings.push(`${at} 含转折标记但未标为 contrasts`);
    if (/^(因此|所以|由此)/.test(source) && !["results-in", "concludes"].includes(unit.relationToPrevious)) warnings.push(`${at} 含结论标记但关系不是 results-in/concludes`);
    if (/^(下一步|需|应|建议)/.test(source) && unit.role !== "action") warnings.push(`${at} 含行动标记但 role 不是 action`);
    if (/(拟|计划|预计|可能|建议|探索)/.test(source) && unit.modality === "confirmed") errors.push(`${at} 含计划/不确定措辞，不得标记为 confirmed`);
    if (/(未|不|尚未|不得|不能|无)/.test(source) && unit.polarity !== "negative") warnings.push(`${at} 可能遗漏否定范围`);
  });

  const referencedNumeric = new Set(units.flatMap((unit) => arr(unit.numericClaimRefs)));
  for (const claim of arr(map.numericClaims).filter((item) => item.materiality === "primary")) if (!referencedNumeric.has(claim.id)) errors.push(`主要数字未绑定到原始语义单元：${claim.id}`);

  for (const [index, atom] of arr(map.contentAtoms).entries()) {
    const refs = arr(atom.discourseRefs);
    if (atom.materiality === "primary" && !refs.length) errors.push(`contentAtoms[${index}] 主要信息缺少 discourseRefs`);
    for (const ref of refs) if (!unitById.has(ref)) errors.push(`contentAtoms[${index}].discourseRefs 不存在：${ref}`);
    if (atom.kind === "judgment" && atom.assertionStatus === "formal") {
      const unresolved = refs.map((ref) => unitById.get(ref)).filter((unit) => unit?.subjectResolution === "unknown" || unit?.modality === "unknown");
      if (unresolved.length) errors.push(`contentAtoms[${index}] 正式判断依赖未知主语或未知口径`);
    }
  }

  if (map.schemaVersion === "0.6") {
    const graph = map.semanticGraph;
    if (!graph || graph.schemaVersion !== "0.6") errors.push("V0.6 缺少有效 semanticGraph");
    else {
      const graphNodeIds = new Set(arr(graph.nodes).map((node) => node.id));
      for (const unit of units) if (!graphNodeIds.has(`DU:${unit.id}`)) errors.push(`semanticGraph 缺少 discourse unit 节点：DU:${unit.id}`);
      for (const edge of arr(graph.edges)) if (edge.needsReview || Number(edge.confidence) < 0.75) errors.push(`semanticGraph 存在未确认关系：${edge.id}`);
      for (const warning of arr(graph.migrationWarnings)) errors.push(`semanticGraph 尚有待确认项：${warning}`);
    }
  }

  const commitment = map.narrativeCommitment || {};
  const spine = arr(commitment.narrativeSpine);
  if (spine.length < 2 || spine.length > 7) errors.push("narrativeCommitment.narrativeSpine 必须包含 2–7 个叙事节拍");
  if (!Array.isArray(commitment.deEmphasizeAtomRefs)) errors.push("narrativeCommitment.deEmphasizeAtomRefs 必须为数组");

  const ghost = arr(map.ghostDeck);
  ghost.forEach((page, index) => {
    const transition = page.transitionFromPrevious;
    if (!transition || typeof transition !== "object" || !nonempty(transition.bridge)) errors.push(`ghostDeck[${index}].transitionFromPrevious 必须包含 bridge`);
    if (index === 0 && transition?.fromPageId != null) errors.push("ghostDeck[0].transitionFromPrevious.fromPageId 必须为空");
    if (index > 0 && transition?.fromPageId !== ghost[index - 1]?.pageId) errors.push(`ghostDeck[${index}] 必须从上一页 ${ghost[index - 1]?.pageId} 过渡`);
    const removal = page.pageNecessity?.removalTest;
    if (!removal || ![removal.losesPrimaryEvidence, removal.breaksDecisionChain, removal.exceedsCapacityElsewhere].some(Boolean)) errors.push(`ghostDeck[${index}] 未通过页面必要性 removalTest`);
    if (!["cover", "section-intro"].includes(page.pageRole) && !arr(page.evidenceRefs).length) errors.push(`ghostDeck[${index}] 内容页缺少 evidenceRefs`);
  });

  return { passed: errors.length === 0, errors, warnings, metrics: { discourseUnits: units.length, primaryAtoms: arr(map.contentAtoms).filter((atom) => atom.materiality === "primary").length, narrativeBeats: spine.length, ghostPages: ghost.length } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = path.resolve(process.argv[2] || "");
  if (!fs.existsSync(file)) {
    console.error("Usage: node validate-chinese-compilation.mjs /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateChineseCompilation(JSON.parse(fs.readFileSync(file, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
