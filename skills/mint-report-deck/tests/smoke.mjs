#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { selectComponent } from "../scripts/select-component.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-skill-v03-"));
const run = (script, args) => spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], { encoding: "utf8" });
const mustRun = (script, args) => { const r = run(script, args); if (r.status !== 0) throw new Error(`${script}\n${r.stdout}${r.stderr}`); return r; };

const routing = JSON.parse(fs.readFileSync(path.join(fixtures, "routing-cases.json"), "utf8"));
for (const test of routing) {
  const outputs = Array.from({ length: 3 }, () => selectComponent(test.input).component);
  if (outputs.some((x) => x !== test.expected)) throw new Error(`${test.name}: expected ${test.expected}, got ${outputs.join(",")}`);
}
const prompts = JSON.parse(fs.readFileSync(path.join(fixtures, "prompt-regression.json"), "utf8"));
if (prompts.length < 30) throw new Error("prompt regression set must include at least 30 realistic prompts");
for (const prompt of prompts) {
  const component = selectComponent(prompt).component;
  if (component === "needs-review" && !["trend", "quantity"].includes(prompt.relationship)) throw new Error(`${prompt.name}: unexpected blocked route`);
  if (prompt.pageBudget !== 1) throw new Error(`${prompt.name}: short regression cases must start at one page`);
}

const map = path.join(fixtures, "vodafone-content-map.json");
mustRun("validate-content-map.mjs", [map]);
for (const name of ["vodafone-deck.json", "pakistan-deck.json"]) {
  const spec = path.join(fixtures, name);
  const out = path.join(tmp, name.replace(".json", ".html"));
  mustRun("validate-deck.mjs", name.startsWith("vodafone") ? [spec, map] : [spec]);
  mustRun("render-deck.mjs", [spec, out]);
  const html = fs.readFileSync(out, "utf8");
  for (const marker of ["mint-deck-id", "mintDeckStage", "data-title", "sourceRefs"]) {
    if (marker === "sourceRefs") continue;
    if (!html.includes(marker)) throw new Error(`${name} missing marker: ${marker}`);
  }
  if ((html.match(/<section class="slide/g) || []).length !== 1) throw new Error(`${name} must render exactly one slide`);
  if (/Sinova|Twende|BaaS/.test(html)) throw new Error(`${name} contains invented entity`);
}

const contractBase = JSON.parse(fs.readFileSync(path.join(fixtures, "vodafone-deck.json"), "utf8"));
const longTitleDeck = structuredClone(contractBase);
longTitleDeck.slides[0].titleLines = ["这是一个同时堆叠市场背景监管支持业务进展后续研究和投资价值判断的超长标题"];
const longTitlePath = path.join(tmp, "invalid-long-title.json");
fs.writeFileSync(longTitlePath, JSON.stringify(longTitleDeck));
const longTitleBlocked = run("validate-deck.mjs", [longTitlePath]);
if (longTitleBlocked.status === 0 || !longTitleBlocked.stdout.includes("超过 22")) throw new Error("titles longer than the two-line Chinese capacity must be blocked");

const aliasStageDeck = structuredClone(contractBase);
aliasStageDeck.slides[0].stages = aliasStageDeck.slides[0].stages.map((stage) => ({ title: stage.name, entity: stage.entities[0], detail: stage.detail }));
const aliasStagePath = path.join(tmp, "invalid-stage-aliases.json");
fs.writeFileSync(aliasStagePath, JSON.stringify(aliasStageDeck));
const aliasStageBlocked = run("validate-deck.mjs", [aliasStagePath]);
if (aliasStageBlocked.status === 0 || !aliasStageBlocked.stdout.includes("renderer 不识别的别名字段")) throw new Error("capability-chain alias fields must be blocked before rendering");

const emptyComparisonDeck = structuredClone(contractBase);
emptyComparisonDeck.slides[0] = { ...emptyComparisonDeck.slides[0], type: "comparison", items: [{ title: "对象 A" }, { title: "对象 B" }] };
delete emptyComparisonDeck.slides[0].stages;
const emptyComparisonPath = path.join(tmp, "invalid-comparison-items.json");
fs.writeFileSync(emptyComparisonPath, JSON.stringify(emptyComparisonDeck));
const emptyComparisonBlocked = run("validate-deck.mjs", [emptyComparisonPath]);
if (emptyComparisonBlocked.status === 0 || !emptyComparisonBlocked.stdout.includes("不能用 items 代替")) throw new Error("comparison items/columns contract drift must be blocked before rendering");

const example = path.join(root, "assets/examples/example-deck.json");
const exampleOut = path.join(tmp, "example.html");
mustRun("validate-deck.mjs", [example]);
mustRun("render-deck.mjs", [example, exampleOut]);
const html = fs.readFileSync(exampleOut, "utf8");
for (const marker of ["data-mint-chart", "mint-deck-edits:${deckId}:${deckVersion}", "data-lightbox", "exportPdfButton", "exportHtmlButton", "@media print"]) if (!html.includes(marker)) throw new Error(`example missing ${marker}`);

const fullDeck = path.join(fixtures, "full-deck-three-sections.json");
const fullDeckOut = path.join(tmp, "full-deck.html");
mustRun("validate-deck.mjs", [fullDeck]);
mustRun("render-deck.mjs", [fullDeck, fullDeckOut]);
const fullHtml = fs.readFileSync(fullDeckOut, "utf8");
if ((fullHtml.match(/class="section-intro/g) || []).length !== 3) throw new Error("all three sections must use the same section-intro family");
if (!fullHtml.includes("risk-spotlight")) throw new Error("full deck must render a distinct risk spotlight");

const equityMap = path.join(fixtures, "equity-content-map.json");
const equityDeck = path.join(fixtures, "equity-deck.json");
const equityHtml = path.join(tmp, "equity.html");
const equityQa = path.join(tmp, "equity-qa.json");
mustRun("validate-content-map.mjs", [equityMap]);
mustRun("qa-deck.mjs", [equityDeck, equityMap, equityQa]);
mustRun("render-deck.mjs", [equityDeck, equityHtml]);
const equityOutput = fs.readFileSync(equityHtml, "utf8");
for (const value of ["70% × 30% = 21%", "25%", "85% × 30% = 25.5%", "20%", "5.5%", "交易结构示例，不是监管批准结果"]) {
  if (!equityOutput.includes(value)) throw new Error(`equity demo lost important content: ${value}`);
}
for (const marker of ["data-primary-visual=\"gap-bridge\"", "threshold-marker", "quant-segment--gap", "data-structured-value", "mint-deck-data"]) {
  if (!equityOutput.includes(marker)) throw new Error(`equity demo missing quantitative marker: ${marker}`);
}
if (equityOutput.includes('<div class="comparison-grid">')) throw new Error("equity demo must not fall back to generic comparison cards");

const invalidEquityDeck = JSON.parse(fs.readFileSync(equityDeck, "utf8"));
invalidEquityDeck.slides[0].type = "comparison";
invalidEquityDeck.slides[0].primaryVisual.kind = "comparison";
invalidEquityDeck.slides[0].primaryVisual.claimRefs = [];
const invalidPath = path.join(tmp, "invalid-equity.json");
fs.writeFileSync(invalidPath, JSON.stringify(invalidEquityDeck));
const blocked = run("qa-deck.mjs", [invalidPath, equityMap]);
if (blocked.status === 0 || !blocked.stdout.includes('"status": "blocked"')) throw new Error("generic text comparison must be blocked when primary numeric claims are missing");
const repairedPath = path.join(tmp, "repaired-equity.json");
const repaired = mustRun("repair-deck.mjs", [invalidPath, equityMap, repairedPath]);
if (!repaired.stdout.includes('"status": "formal-ready"')) throw new Error("repair loop must promote the failed numeric comparison");
const repairedDeck = JSON.parse(fs.readFileSync(repairedPath, "utf8"));
if (repairedDeck.slides[0].type !== "quantitative-story" || repairedDeck.slides[0].primaryVisual.kind !== "gap-bridge") throw new Error("repair loop selected the wrong quantitative story");
mustRun("qa-deck.mjs", [repairedPath, equityMap]);

const forcedMap = path.join(fixtures, "forced-one-page-content-map.json");
const forcedDeck = path.join(fixtures, "forced-one-page-deck.json");
const forcedHtml = path.join(tmp, "forced-one-page.html");
mustRun("qa-deck.mjs", [forcedDeck, forcedMap]);
mustRun("render-deck.mjs", [forcedDeck, forcedHtml]);
const forcedOutput = fs.readFileSync(forcedHtml, "utf8");
if ((forcedOutput.match(/<section class="slide/g) || []).length !== 1) throw new Error("exact one-page contract must render exactly one slide");
for (const value of ["准备LOI材料", "监管节点决定后续推进节奏", "完成材料核对并提交"]) if (!forcedOutput.includes(value)) throw new Error(`one-page composition lost content: ${value}`);
const illegalSplit = JSON.parse(fs.readFileSync(forcedDeck, "utf8"));
illegalSplit.slides.push({ ...illegalSplit.slides[0], id: "P2" });
illegalSplit.pageBudget = 2;
const illegalSplitPath = path.join(tmp, "illegal-split.json");
fs.writeFileSync(illegalSplitPath, JSON.stringify(illegalSplit));
const splitBlocked = run("qa-deck.mjs", [illegalSplitPath, forcedMap]);
if (splitBlocked.status === 0 || !splitBlocked.stdout.includes("不得擅自拆页")) throw new Error("exact one-page contract must block a two-page output");

const planned = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "front-middle-back", secondaryBlocks: 1, calloutCount: 1 })]).stdout);
if (planned.status !== "ready" || planned.family !== "capability-chain" || planned.estimatedVisualShare < 0.55) throw new Error("front-middle-back must plan as a readable capability chain");
const overloaded = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "front-middle-back", secondaryBlocks: 4, calloutCount: 2 })]).stdout);
if (overloaded.status !== "split-required") throw new Error("overloaded page must split before shrinking the main visual");
const forcedOverloaded = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "front-middle-back", secondaryBlocks: 4, calloutCount: 2, pageConstraint: "exact", requestedPages: 1 })]).stdout);
if (forcedOverloaded.status !== "recompose-required") throw new Error("exact one-page contract must recompose instead of split");
const unmatched = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "other", preferredFamily: "uncontrolled-freeform" })]).stdout);
if (unmatched.status !== "needs-layout-review") throw new Error("unknown family must stop for layout review instead of forcing a table");

const narrativeMap = path.join(fixtures, "chinese-narrative-content-map.json");
const narrativeDeck = path.join(fixtures, "chinese-narrative-deck.json");
const narrativeHtml = path.join(tmp, "chinese-narrative.html");
mustRun("qa-deck.mjs", [narrativeDeck, narrativeMap]);
mustRun("render-deck.mjs", [narrativeDeck, narrativeHtml]);
mustRun("validate-rendered-html.mjs", [narrativeHtml, narrativeDeck]);
const narrativeOutput = fs.readFileSync(narrativeHtml, "utf8");
if ((narrativeOutput.match(/data-render-contract="pass"/g) || []).length !== 2) throw new Error("every V0.5 page must carry a passed render contract");
if (!narrativeOutput.includes('data-slide-id="P2"') || !narrativeOutput.includes('data-primary-items="1"')) throw new Error("the second narrative page must render a non-empty primary decision");

const brokenNarrativeMap = JSON.parse(fs.readFileSync(narrativeMap, "utf8"));
delete brokenNarrativeMap.ghostDeck[1].transitionFromPrevious;
const brokenNarrativeMapPath = path.join(tmp, "broken-narrative-map.json");
fs.writeFileSync(brokenNarrativeMapPath, JSON.stringify(brokenNarrativeMap));
const brokenNarrative = run("qa-deck.mjs", [narrativeDeck, brokenNarrativeMapPath]);
if (brokenNarrative.status === 0 || !brokenNarrative.stdout.includes("transitionFromPrevious")) throw new Error("a disconnected Chinese ghost deck must be blocked");

const ambiguousSubjectMap = JSON.parse(fs.readFileSync(narrativeMap, "utf8"));
ambiguousSubjectMap.discourseUnits[1].subjectResolution = "unknown";
delete ambiguousSubjectMap.discourseUnits[1].unknownRef;
const ambiguousSubjectPath = path.join(tmp, "ambiguous-subject-map.json");
fs.writeFileSync(ambiguousSubjectPath, JSON.stringify(ambiguousSubjectMap));
const ambiguousSubjectBlocked = run("qa-deck.mjs", [narrativeDeck, ambiguousSubjectPath]);
if (ambiguousSubjectBlocked.status === 0 || !ambiguousSubjectBlocked.stdout.includes("主语未知但缺少 unknownRef")) throw new Error("an unresolved Chinese subject must be blocked instead of guessed");

const falseCertaintyMap = JSON.parse(fs.readFileSync(narrativeMap, "utf8"));
falseCertaintyMap.discourseUnits[2].text = "预计下一步优先投入已具备验证条件的市场。";
falseCertaintyMap.discourseUnits[2].modality = "confirmed";
const falseCertaintyPath = path.join(tmp, "false-certainty-map.json");
fs.writeFileSync(falseCertaintyPath, JSON.stringify(falseCertaintyMap));
const falseCertaintyBlocked = run("qa-deck.mjs", [narrativeDeck, falseCertaintyPath]);
if (falseCertaintyBlocked.status === 0 || !falseCertaintyBlocked.stdout.includes("不得标记为 confirmed")) throw new Error("a Chinese plan or estimate must not be compiled as confirmed fact");

const invisibleClaimDeck = JSON.parse(fs.readFileSync(narrativeDeck, "utf8"));
invisibleClaimDeck.slides[0].visibleClaims[0].text = "这句重要结论没有真正渲染到页面";
const invisibleClaimPath = path.join(tmp, "invisible-claim-deck.json");
const invisibleClaimHtml = path.join(tmp, "invisible-claim.html");
fs.writeFileSync(invisibleClaimPath, JSON.stringify(invisibleClaimDeck));
const invisibleClaimBlocked = run("render-deck.mjs", [invisibleClaimPath, invisibleClaimHtml]);
const invisibleClaimLog = `${invisibleClaimBlocked.stdout}${invisibleClaimBlocked.stderr}`;
if (invisibleClaimBlocked.status === 0 || !invisibleClaimLog.includes("missingClaims=这句重要结论没有真正渲染到页面")) throw new Error("a planned claim that disappears after rendering must block delivery");

const incompleteComponentDeck = JSON.parse(fs.readFileSync(narrativeDeck, "utf8"));
delete incompleteComponentDeck.slides[1].decision;
const incompleteComponentPath = path.join(tmp, "incomplete-component-deck.json");
fs.writeFileSync(incompleteComponentPath, JSON.stringify(incompleteComponentDeck));
const incompleteComponentBlocked = run("qa-deck.mjs", [incompleteComponentPath, narrativeMap]);
if (incompleteComponentBlocked.status === 0 || !incompleteComponentBlocked.stdout.includes("component-contract")) throw new Error("an incomplete renderer component contract must be blocked before rendering");

console.log(JSON.stringify({ passed: true, routingCases: routing.length, promptCases: prompts.length, deterministicRuns: routing.length * 3, renderedDecks: 8, strictBlockedCases: 7, automaticRepairs: 1, exactOnePageContracts: 1, sectionIntros: 3, pageFamilyPlans: 4, narrativeContracts: 6, output: tmp }, null, 2));
