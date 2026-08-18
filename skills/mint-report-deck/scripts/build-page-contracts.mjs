#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePageContracts } from "./validate-page-contracts.mjs";
import { cjkUnits, suggestTitleLines } from "./cjk-text-fit.mjs";

const arr = (value) => Array.isArray(value) ? value : [];
const units = cjkUnits;
const compact = (value) => String(value || "").trim().replace(/[。；;]+$/, "");

function splitTitle(value) {
  const result = suggestTitleLines(compact(value));
  if (result.status !== "fit") throw new Error(`页面行动标题不符合中文两行合同：${result.reasons.join("；")}`);
  return result.lines;
}

function fallbackPlanningPages(map) {
  const primary = arr(map.contentAtoms).filter((atom) => atom.materiality === "primary");
  if (!primary.length) throw new Error("无法规划页面：没有 primary contentAtoms");
  const threads = arr(map.decisionThreads);
  if (threads.length) return threads.map((thread, index) => ({
    pageId: thread.pageAssignment || `P${index + 1}`,
    actionTitle: thread.answer || map.communicationJob?.managementTakeaway,
    pageRole: index === threads.length - 1 ? "decision" : "evidence",
    managementQuestion: thread.managementQuestion,
    answer: thread.answer,
    atomRefs: thread.atomRefs,
    relationshipRefs: thread.relationshipRefs,
    evidenceRefs: [],
    transitionFromPrevious: index ? { fromPageId: threads[index - 1].pageAssignment || `P${index}`, bridge: "承接上一页判断" } : null,
    pageNecessity: { type: index ? "independent-decision" : "opening", reason: "承接已确认的管理问题", removalTest: { losesPrimaryEvidence: true, breaksDecisionChain: true, exceedsCapacityElsewhere: false } }
  }));
  if (map.pageBudget?.planned === 1) return [{
    pageId: "P1",
    actionTitle: map.communicationJob?.managementTakeaway,
    pageRole: "decision",
    managementQuestion: map.communicationJob?.purpose,
    answer: map.communicationJob?.managementTakeaway,
    atomRefs: primary.map((atom) => atom.id),
    relationshipRefs: [],
    evidenceRefs: [],
    transitionFromPrevious: null,
    pageNecessity: { type: "opening", reason: "强制一页承接全部主要信息", removalTest: { losesPrimaryEvidence: true, breaksDecisionChain: true, exceedsCapacityElsewhere: false } }
  }];
  throw new Error("无法安全规划多页材料：缺少 ghostDeck 或 decisionThreads");
}

function relationRefsForAtoms(map, atomRefs, declaredRefs) {
  const validEdges = new Map(arr(map.semanticGraph?.edges).map((edge) => [edge.id, edge]));
  const declared = arr(declaredRefs).filter((ref) => validEdges.has(ref));
  const discourseIds = new Set(arr(map.contentAtoms).filter((atom) => atomRefs.includes(atom.id)).flatMap((atom) => arr(atom.discourseRefs).map((id) => `DU:${id}`)));
  const inferred = arr(map.semanticGraph?.edges).filter((edge) => discourseIds.has(edge.source) || discourseIds.has(edge.target)).map((edge) => edge.id);
  return [...new Set([...declared, ...inferred])];
}

function readingAxis(map, relationRefs, role) {
  const edgeById = new Map(arr(map.semanticGraph?.edges).map((edge) => [edge.id, edge]));
  const types = new Set(relationRefs.map((ref) => edgeById.get(ref)?.relationType).filter(Boolean));
  if ([...types].some((type) => ["sequence", "temporal", "flow", "before-after"].includes(type))) return "left-to-right";
  if (types.has("parallel") || types.has("comparison")) return "left-to-right";
  if (role === "section-intro") return "top-to-bottom";
  return "top-to-bottom";
}

function densityForAtoms(atoms) {
  const size = atoms.reduce((sum, atom) => sum + units(atom.text), 0);
  if (atoms.length >= 7 || size > 180) return "compact";
  if (atoms.length >= 3 || size > 70) return "balanced";
  return "focused";
}

function proofKind(atoms, relationRefs, role) {
  if (atoms.some((atom) => atom.kind === "numeric")) return "numeric-evidence";
  if (relationRefs.length) return "semantic-relationship";
  if (["decision", "action", "risk"].includes(role)) return "decision-evidence";
  return "source-backed-claim";
}

function sectionIdForPage(map, page) {
  if (page.sectionId) return page.sectionId;
  for (const section of arr(map.sectionPlan?.sections)) if (arr(section.pageIds).includes(page.pageId)) return section.id;
  return "S1";
}

export function buildPageContracts(map) {
  const budget = map.pageBudget || {};
  const planningPages = arr(map.ghostDeck).length ? arr(map.ghostDeck) : fallbackPlanningPages(map);
  if (budget.constraint === "exact" && planningPages.length !== budget.requested) throw new Error(`强制 ${budget.requested} 页，但页面计划为 ${planningPages.length} 页；不得擅自拆页`);
  if (budget.constraint === "maximum" && planningPages.length > budget.requested) throw new Error(`页面计划超过最多 ${budget.requested} 页`);
  if (planningPages.length !== budget.planned) throw new Error(`页面计划 ${planningPages.length} 页与 pageBudget.planned ${budget.planned} 不一致`);

  const atomById = new Map(arr(map.contentAtoms).map((atom) => [atom.id, atom]));
  const sectionIntroFamily = map.sectionPlan?.introFamily || "section-intro";
  const pageContracts = planningPages.map((page, index) => {
    const atoms = arr(page.atomRefs).map((ref) => atomById.get(ref)).filter(Boolean);
    const primaryAtoms = atoms.filter((atom) => atom.materiality === "primary");
    if (!primaryAtoms.length) throw new Error(`页面 ${page.pageId || index + 1} 没有 primary atom，禁止生成空内容页`);
    const relationGraphRefs = relationRefsForAtoms(map, arr(page.atomRefs), page.relationshipRefs);
    const sourceEvidence = atoms.map((atom) => atom.sourceRef).filter(Boolean);
    const evidenceRefs = [...new Set([...arr(page.evidenceRefs), ...sourceEvidence])];
    if (!evidenceRefs.length) throw new Error(`页面 ${page.pageId || index + 1} 没有可追溯证据`);
    const role = page.pageRole || (index === planningPages.length - 1 ? "decision" : "evidence");
    const contentOrder = role === "section-intro" ? ["title", "page-answer", "proof-object"] : role === "decision" ? ["title", "page-answer", "proof-object", "decision"] : ["title", "page-answer", "proof-object", "implication"];
    const title = page.actionTitle || page.answer;
    return {
      id: page.pageId || `P${index + 1}`,
      sectionId: sectionIdForPage(map, page),
      actionTitle: compact(title),
      titleLines: splitTitle(title),
      pageQuestion: page.managementQuestion,
      pageAnswer: page.answer,
      pageRole: role,
      proofObject: {
        kind: proofKind(atoms, relationGraphRefs, role),
        primaryAtomRef: primaryAtoms[0].id,
        atomRefs: atoms.map((atom) => atom.id),
        evidenceRefs,
        description: `用可追溯证据回答：${page.answer}`
      },
      atomRefs: atoms.map((atom) => atom.id),
      relationGraphRefs,
      primaryRelationRef: relationGraphRefs[0] || null,
      readingAxis: readingAxis(map, relationGraphRefs, role),
      contentOrder,
      focalAnchor: "proof-object",
      densityProfile: densityForAtoms(atoms),
      ...(role === "section-intro" ? { introFamily: sectionIntroFamily } : {}),
      transitionFromPrevious: index === 0 ? null : (page.transitionFromPrevious || { fromPageId: planningPages[index - 1].pageId, bridge: "承接上一页结论" }),
      pageNecessity: page.pageNecessity || { type: index ? "independent-decision" : "opening", reason: "承接独立管理问题" }
    };
  });

  const configuredSections = arr(map.sectionPlan?.sections);
  const sectionIds = [...new Set(pageContracts.map((page) => page.sectionId))];
  const sections = sectionIds.map((id) => {
    const configured = configuredSections.find((section) => section.id === id);
    const pageIds = pageContracts.filter((page) => page.sectionId === id).map((page) => page.id);
    return { id, title: configured?.title || (sectionIds.length === 1 ? map.communicationJob?.purpose : id), introFamily: sectionIntroFamily, pageIds };
  });
  const plan = {
    schemaVersion: "0.6",
    communicationJob: map.communicationJob,
    narrativeSpine: arr(map.narrativeCommitment?.narrativeSpine).length ? map.narrativeCommitment.narrativeSpine : pageContracts.map((page) => page.pageRole),
    pageBudget: { requested: budget.requested ?? null, planned: budget.planned, constraint: budget.constraint || "minimum-needed", overflowPolicy: budget.overflowPolicy || "recompose-then-split" },
    sectionIntroFamily,
    sections,
    ...(budget.constraint === "exact" && budget.requested === 1 ? {
      onePagePlan: {
        managementQuestion: pageContracts[0].pageQuestion,
        pageAnswer: pageContracts[0].pageAnswer,
        primaryRelationship: pageContracts[0].relationGraphRefs.join(",") || pageContracts[0].proofObject.kind,
        readingPath: pageContracts[0].contentOrder,
        atomPlacement: pageContracts[0].atomRefs.map((atomRef) => ({ atomRef, zone: atomById.get(atomRef)?.displayRequirement === "callout" ? "decision-callout" : "primary-visual" }))
      }
    } : {}),
    pageContracts
  };
  const validation = validatePageContracts(plan, map);
  if (!validation.passed) throw new Error(`page contract validation failed: ${validation.errors.join(" | ")}`);
  return plan;
}

function runCli() {
  const mapFile = path.resolve(process.argv[2] || "");
  const outputFile = path.resolve(process.argv[3] || "deck-plan.json");
  if (!process.argv[2] || !fs.existsSync(mapFile)) {
    console.error("Usage: node build-page-contracts.mjs /absolute/path/content-map.json /absolute/path/deck-plan.json");
    process.exit(2);
  }
  const plan = buildPageContracts(JSON.parse(fs.readFileSync(mapFile, "utf8")));
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(JSON.stringify({ passed: true, pages: plan.pageContracts.length, sections: plan.sections.length, output: outputFile }, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
