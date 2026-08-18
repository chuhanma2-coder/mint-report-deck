#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildPageContracts } from "../scripts/build-page-contracts.mjs";
import { compileSemanticGraph } from "../scripts/compile-semantic-graph.mjs";
import { validatePageContracts } from "../scripts/validate-page-contracts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-page-contract-v06-"));
const load = (name) => JSON.parse(fs.readFileSync(path.join(fixtures, name), "utf8"));
const graphForAtoms = (map) => ({
  schemaVersion:"0.6", sourceContentMapVersion:String(map.schemaVersion || "legacy"),
  nodes:map.contentAtoms.map((atom) => ({ id:`ATOM:${atom.id}`, kind:"atom", label:atom.text, sourceRefs:[atom.sourceRef], materiality:atom.materiality, needsReview:false })),
  edges:[], migrationWarnings:[]
});

const forcedSource = load("forced-one-page-content-map.json");
const forced = { ...forcedSource, schemaVersion:"0.6", semanticGraph:graphForAtoms(forcedSource) };
const onePage = buildPageContracts(forced);
const onePageValidation = validatePageContracts(onePage, forced);
if (!onePageValidation.passed) throw new Error(`forced one-page contract failed: ${onePageValidation.errors.join(" | ")}`);
if (onePage.pageContracts.length !== 1 || onePage.pageContracts[0].atomRefs.length !== 4) throw new Error("forced one-page content was split or lost");
if (onePage.pageContracts[0].contentOrder.slice(0, 3).join(",") !== "title,page-answer,proof-object") throw new Error("one-page reading order is unclear");

const illegalSplit = structuredClone(forced);
illegalSplit.pageBudget.planned = 2;
illegalSplit.decisionThreads.push({ ...illegalSplit.decisionThreads[0], id:"DT2", pageAssignment:"P2" });
let splitBlocked = false;
try { buildPageContracts(illegalSplit); } catch (error) { splitBlocked = String(error.message).includes("不得擅自拆页"); }
if (!splitBlocked) throw new Error("exact-one-page material was allowed to split");

const narrativeSource = load("chinese-narrative-content-map.json");
const narrative = { ...narrativeSource, schemaVersion:"0.6" };
narrative.semanticGraph = compileSemanticGraph(narrative);
const narrativePlan = buildPageContracts(narrative);
const narrativeValidation = validatePageContracts(narrativePlan, narrative);
if (!narrativeValidation.passed || narrativePlan.pageContracts.length !== 2) throw new Error(`two-page narrative contract failed: ${narrativeValidation.errors.join(" | ")}`);

const fullDeck = load("full-deck-three-sections.json");
const fullAtoms = fullDeck.slides.map((slide, index) => ({ id:`A${index + 1}`, kind:slide.type === "timeline" ? "relationship" : slide.type === "risk-spotlight" ? "judgment" : "fact", text:slide.titleLines.join(""), materiality:"primary", displayRequirement:"primary-visual", coverageStatus:"planned", sourceRef:slide.sourceRefs[0] }));
const fullMap = {
  schemaVersion:"0.6",
  communicationJob:{ audience:"管理层", purpose:"说明三部分工作", desiredOutcome:"形成推进判断", managementTakeaway:"业务、牌照和风险形成一条决策主线" },
  contentAtoms:fullAtoms, numericClaims:[], facts:[], entities:[], relationships:[], numbers:[], actions:[], priorities:[], unknowns:[], conflicts:[], riskLevel:"ordinary",
  semanticGraph:graphForAtoms({ schemaVersion:"0.6", contentAtoms:fullAtoms }),
  pageBudget:{ requested:null, minimum:6, planned:6, constraint:"minimum-needed", overflowPolicy:"recompose-then-split", reason:"三部分各含引言和内容页" },
  sectionPlan:{ introFamily:"section-intro", sections:fullDeck.deckPlan.sections.map((section, index) => ({ ...section, pageIds:[`P${index * 2 + 1}`, `P${index * 2 + 2}`] })) },
  ghostDeck:fullDeck.slides.map((slide, index) => ({
    pageId:`P${index + 1}`, sectionId:slide.sectionId, actionTitle:slide.titleLines.join(""), pageRole:slide.pageRole === "relationship" ? "mechanism" : slide.pageRole,
    managementQuestion:`${slide.titleLines.join("")}要说明什么？`, answer:slide.type === "section-intro" ? slide.sectionClaim : slide.titleLines.join(""), atomRefs:[`A${index + 1}`], evidenceRefs:[slide.sourceRefs[0]], relationshipRefs:[],
    transitionFromPrevious:index ? { fromPageId:`P${index}`, bridge:"承接上一页" } : null,
    pageNecessity:{ type:slide.type === "section-intro" ? "section-intro" : "opening", reason:"章节叙事需要", removalTest:{ losesPrimaryEvidence:true, breaksDecisionChain:true, exceedsCapacityElsewhere:false } }
  }))
};
const fullPlan = buildPageContracts(fullMap);
const fullValidation = validatePageContracts(fullPlan, fullMap);
if (!fullValidation.passed) throw new Error(`three-section contract failed: ${fullValidation.errors.join(" | ")}`);
const intros = fullPlan.pageContracts.filter((page) => page.pageRole === "section-intro");
if (intros.length !== 3 || new Set(intros.map((page) => `${page.introFamily}|${page.readingAxis}|${page.contentOrder.join(",")}`)).size !== 1) throw new Error("section intro family or reading structure drifted");

const blankPlan = structuredClone(onePage);
blankPlan.pageContracts[0].atomRefs = [];
blankPlan.pageContracts[0].proofObject.atomRefs = [];
const blankResult = validatePageContracts(blankPlan, forced);
if (blankResult.passed || !blankResult.errors.some((error) => error.includes("空内容页"))) throw new Error("blank content page was not blocked");

const planPath = path.join(tmp, "deck-plan.json");
const mapPath = path.join(tmp, "content-map.json");
fs.writeFileSync(planPath, `${JSON.stringify(onePage, null, 2)}\n`);
fs.writeFileSync(mapPath, `${JSON.stringify(forced, null, 2)}\n`);
const cli = spawnSync(process.execPath, [path.join(root, "scripts/validate-page-contracts.mjs"), planPath, mapPath], { encoding:"utf8" });
if (cli.status !== 0) throw new Error(`page contract CLI failed:\n${cli.stdout}${cli.stderr}`);

console.log(JSON.stringify({
  passed:true,
  exactOnePageContracts:onePage.pageContracts.length,
  exactOnePagePrimaryAtoms:onePageValidation.metrics.coveredPrimaryAtoms,
  illegalSplitsBlocked:1,
  narrativePages:narrativePlan.pageContracts.length,
  sectionIntros:intros.length,
  blankPagesBlocked:1,
  output:tmp
}, null, 2));
