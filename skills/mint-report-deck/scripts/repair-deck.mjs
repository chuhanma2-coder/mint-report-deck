#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateInformationCoverage } from "./validate-information-coverage.mjs";
import { validateNumericIntegrity } from "./validate-numeric-integrity.mjs";
import { validateVisualSalience } from "./validate-visual-salience.mjs";
import { applyRepairRound, classifyQaMessages, orchestrateRepairs } from "./repair-layout.mjs";

const deckFile = path.resolve(process.argv[2] || "");
const mapFile = path.resolve(process.argv[3] || "");
const output = path.resolve(process.argv[4] || "");
if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile) || !process.argv[4]) {
  console.error("Usage: node repair-deck.mjs deck-spec.json content-map.json repaired-deck.json [qa-report.json] [layout-plan.json]");
  process.exit(2);
}

const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
const arr = (v) => Array.isArray(v) ? v : [];

if (deck.schemaVersion === "0.6" || map.schemaVersion === "0.6") {
  const qaFile = process.argv[5] ? path.resolve(process.argv[5]) : null;
  const layoutFile = process.argv[6] ? path.resolve(process.argv[6]) : null;
  if (!qaFile || !fs.existsSync(qaFile)) {
    console.error("V0.6 repair requires an explicit qa-report.json; the repairer must not guess failures");
    process.exit(2);
  }
  const report = JSON.parse(fs.readFileSync(qaFile, "utf8"));
  const registry = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/layout-patterns.json"), "utf8"));
  const initialBundle = { deck, map, deckPlan:deck.deckPlan, layoutSelection:deck.layoutSelection, layoutPlan:layoutFile && fs.existsSync(layoutFile) ? JSON.parse(fs.readFileSync(layoutFile,"utf8")) : null };
  const roundReports = arr(report.roundReports);
  const orchestration = roundReports.length ? orchestrateRepairs(initialBundle, roundReports, registry, 2) : null;
  const issues = arr(report.repairIssues).length ? report.repairIssues : classifyQaMessages([...(report.errors || []), ...(report.warnings || [])]);
  const result = orchestration ? {bundle:orchestration.bundle,status:orchestration.status,repairs:orchestration.history.flatMap((item)=>item.repairs),blockedReasons:orchestration.blockedReasons || orchestration.history.flatMap((item)=>item.blockedReasons),diff:orchestration.history.map((item)=>item.diff),rounds:orchestration.rounds} : {...applyRepairRound(initialBundle, issues, registry, 1),rounds:1};
  const repaired = result.bundle.deck;
  repaired.deckPlan = result.bundle.deckPlan;
  repaired.layoutSelection = result.bundle.layoutSelection;
  if (result.bundle.layoutPlan) repaired.layoutPlan = result.bundle.layoutPlan;
  repaired.version = Number(repaired.version || 0) + 1;
  repaired.repairLog = [...arr(repaired.repairLog), ...result.repairs];
  repaired.repairState = { status:result.status, rounds:result.rounds, blockedReasons:result.blockedReasons, diff:result.diff, requiredNextChecks:result.status === "repair-required" ? ["render-html","visual-qa","qa-deck"] : [] };
  fs.writeFileSync(output, `${JSON.stringify(repaired, null, 2)}\n`);
  console.log(JSON.stringify({passed:result.status==="formal-ready",status:result.status,rounds:result.rounds,repairs:result.repairs,blockedReasons:result.blockedReasons,diff:result.diff,requiredNextChecks:repaired.repairState.requiredNextChecks},null,2));
  process.exit(result.status === "formal-ready" ? 0 : 1);
}
const claimsByGroup = new Map();
for (const claim of arr(map.numericClaims)) {
  const groupId = claim.groupId || "UNGROUPED";
  if (!claimsByGroup.has(groupId)) claimsByGroup.set(groupId, []);
  claimsByGroup.get(groupId).push(claim);
}

function buildGroup(groupId, claims) {
  const formula = claims.find((claim) => claim.formula);
  const threshold = claims.find((claim) => ["upper-bound", "lower-bound"].includes(claim.role));
  const direct = claims.find((claim) => claim.role === "direct");
  const theoretical = claims.find((claim) => claim.role === "theoretical" || claim.role === "formula-result");
  const gap = claims.find((claim) => claim.role === "gap");
  const visualSegments = claims.filter((claim) => claim.visual?.segment).map((claim) => ({
    label: claim.visual.label || claim.subject,
    value: claim.value,
    unit: claim.unit,
    tone: claim.visual.tone || (claim.role === "gap" ? "gap" : claim.role === "remainder" ? "remainder" : "jade"),
    claimRef: claim.id
  }));
  const declaredTotal = claims.find((claim) => claim.visual?.total)?.visual.total ?? (visualSegments.every((segment) => segment.unit === "%") ? 100 : undefined);
  const segmentSum = visualSegments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
  if (Number.isFinite(Number(declaredTotal)) && segmentSum < Number(declaredTotal)) {
    visualSegments.push({ label: "其余", value: Number(declaredTotal) - segmentSum, unit: visualSegments[0]?.unit || "", tone: "remainder", showValue: false });
  }
  return {
    id: groupId,
    label: claims.find((claim) => claim.groupLabel)?.groupLabel || groupId,
    headline: (direct || theoretical) ? `${(direct || theoretical).subject} ${(direct || theoretical).value}${(direct || theoretical).unit || ""}` : "",
    formula: formula?.raw || "",
    formulaLabel: formula ? "权益换算" : "",
    total: declaredTotal,
    segments: visualSegments,
    threshold: threshold ? { value: threshold.value, unit: threshold.unit, label: threshold.subject, claimRef: threshold.id } : undefined,
    theoretical: theoretical?.value,
    direct: direct?.value,
    gap: gap?.value,
    implication: claims.find((claim) => claim.implication)?.implication || gap?.implication || theoretical?.implication || direct?.implication || ""
  };
}

function relevantClaims(slide) {
  const sources = new Set(arr(slide.sourceRefs));
  return arr(map.numericClaims).filter((claim) => sources.has(claim.sourceRef) || arr(slide.primaryVisual?.claimRefs).includes(claim.id));
}

const repairs = [];
for (let round = 1; round <= 2; round += 1) {
  let changed = false;
  for (const [index, slide] of arr(deck.slides).entries()) {
    const claims = relevantClaims(slide).filter((claim) => claim.materiality === "primary");
    if (!claims.length) continue;
    const roleSet = new Set(claims.map((claim) => claim.role));
    const needsNumericStory = ["formula-result", "upper-bound", "lower-bound", "theoretical", "direct", "gap", "part", "remainder", "actual", "target"].some((role) => roleSet.has(role));
    if (needsNumericStory && slide.type !== "quantitative-story") {
      const groups = [...new Set(claims.map((claim) => claim.groupId || "UNGROUPED"))].map((groupId) => buildGroup(groupId, claimsByGroup.get(groupId) || []));
      if (groups.every((group) => group.segments.length || group.formula || group.threshold)) {
        slide.type = "quantitative-story";
        slide.pageQuestion ||= "不同对象的核心数字关系是什么？";
        slide.pageAnswer ||= arr(slide.titleLines).join("，");
        slide.primaryVisual = {
          kind: roleSet.has("gap") ? "gap-bridge" : roleSet.has("upper-bound") || roleSet.has("lower-bound") ? "threshold-bar" : roleSet.has("part") || roleSet.has("remainder") ? "allocation-bar" : "formula-band",
          visualShare: 0.64,
          claimRefs: claims.map((claim) => claim.id),
          atomRefs: arr(map.contentAtoms).filter((atom) => claims.some((claim) => atom.sourceRef === claim.sourceRef)).map((atom) => atom.id),
          data: { groups }
        };
        slide.atomRefs = [...new Set([...arr(slide.atomRefs), ...slide.primaryVisual.atomRefs])];
        slide.readingOrder = ["title", "formula", "primary-visual", "implication"];
        slide.supportModules = arr(slide.supportModules).slice(0, 2);
        repairs.push({ round, slide: index + 1, action: "reroute-to-quantitative-story" });
        changed = true;
      }
    }
    const referenced = new Set(arr(slide.primaryVisual?.claimRefs));
    const missing = claims.filter((claim) => !referenced.has(claim.id));
    if (missing.length && round === 1) {
      slide.emphasis ||= {};
      slide.emphasis.callouts ||= [];
      for (const claim of missing.slice(0, 2 - slide.emphasis.callouts.length)) {
        slide.emphasis.callouts.push({ kind: claim.priorityKind || "evidence", label: claim.subject, value: `${claim.value}${claim.unit || ""}`, detail: claim.implication || "" });
        repairs.push({ round, slide: index + 1, action: "promote-numeric-callout", claimId: claim.id });
        changed = true;
      }
    }
  }
  const checks = [validateInformationCoverage(deck, map), validateNumericIntegrity(deck, map), validateVisualSalience(deck, map)];
  if (checks.every((check) => check.passed) || !changed) break;
}

deck.schemaVersion = "0.4";
deck.version = Number(deck.version || 0) + 1;
deck.repairLog = repairs;
const finalChecks = [validateInformationCoverage(deck, map), validateNumericIntegrity(deck, map), validateVisualSalience(deck, map)];
const passed = finalChecks.every((check) => check.passed);
fs.writeFileSync(output, `${JSON.stringify(deck, null, 2)}\n`);
console.log(JSON.stringify({ passed, status: passed ? "formal-ready" : "blocked", rounds: 2, repairs, errors: finalChecks.flatMap((check) => check.errors) }, null, 2));
process.exit(passed ? 0 : 1);
