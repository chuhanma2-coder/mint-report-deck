import crypto from "node:crypto";
import { suggestTitleLines } from "./cjk-text-fit.mjs";
import { selectLayout } from "./select-layout.mjs";
import { buildLayoutPlan } from "./build-layout-plan.mjs";

const arr = (value) => Array.isArray(value) ? value : [];
const clone = (value) => JSON.parse(JSON.stringify(value));
const hash = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const REPAIR_ORDER = ["DEDUP_SUPPORT", "TITLE_BREAK", "ZONE_REGROUP", "PATTERN_REROUTE", "PAGE_SPLIT", "LIMITED_SCALE"];
export const REPAIRABLE_CODES = new Set(REPAIR_ORDER);

export function classifyQaMessages(messages = []) {
  return arr(messages).map((message) => {
    const text = typeof message === "string" ? message : message.message || "";
    const chinesePage = text.match(/第\s*(\d+)\s*页/), contractIndex = text.match(/pageContracts\[(\d+)\]/), directPage = text.match(/(?:页面|page\s*)(P?\d+)/i);
    const pageId = chinesePage ? `P${chinesePage[1]}` : contractIndex ? `P${Number(contractIndex[1]) + 1}` : directPage?.[1];
    if (/重复.*支持|duplicate support/i.test(text)) return { code:"DEDUP_SUPPORT", pageId, message:text, repairable:true };
    if ((/标题|title/i.test(text) && /两行|断行|字符宽|line/i.test(text)) || /第\d+行.*超过.*中文字符宽/.test(text)) return { code:"TITLE_BREAK", pageId, message:text, repairable:true };
    if (/假留白|有效内容包络|最大空区/i.test(text)) return { code:"ZONE_REGROUP", pageId, message:text, repairable:true };
    if (/Pattern.*不兼容|pattern mismatch/i.test(text)) return { code:"PATTERN_REROUTE", pageId, message:text, repairable:true };
    if (/允许拆页|approved split/i.test(text)) return { code:"PAGE_SPLIT", pageId, message:text, repairable:true };
    if (/有限缩放|limited scale/i.test(text)) return { code:"LIMITED_SCALE", pageId, message:text, repairable:true };
    return { code:"UNSAFE", pageId, message:text, repairable:false };
  });
}

function invariants(bundle) {
  const map = bundle.map || {};
  return {
    primaryAtoms: arr(map.contentAtoms).filter((atom) => atom.materiality === "primary").map((atom) => atom.id).sort(),
    facts: hash(arr(map.facts)), entities:hash(arr(map.entities)), numbers:hash(arr(map.numericClaims)),
    relations: hash(arr(map.semanticGraph?.edges).map((edge) => ({id:edge.id,type:edge.relationType,source:edge.source,target:edge.target,direction:edge.direction}))),
    pageConstraint: map.pageBudget?.constraint || "minimum-needed", requested:map.pageBudget?.requested ?? null
  };
}

function verifyInvariants(before, bundle) {
  const after = invariants(bundle), errors = [];
  for (const key of ["facts","entities","numbers","relations"]) if (before[key] !== after[key]) errors.push(`修复改变了${key}语义源`);
  const visible = new Set(arr(bundle.deck?.slides).flatMap((slide) => arr(slide.atomRefs)));
  for (const atom of before.primaryAtoms) if (!visible.has(atom)) errors.push(`修复丢失primary atom：${atom}`);
  if (before.pageConstraint === "exact" && arr(bundle.deck?.slides).length !== before.requested) errors.push(`exact-one-page/页数合同被改变：要求${before.requested}页`);
  return errors;
}

function pageIdFor(issue, bundle) {
  if (issue.pageId) return String(issue.pageId).startsWith("P") ? String(issue.pageId) : `P${issue.pageId}`;
  return bundle.deck?.slides?.[0]?.id || bundle.deckPlan?.pageContracts?.[0]?.id;
}

function dedupeSupport(bundle, pageId) {
  const slide = arr(bundle.deck?.slides).find((item) => item.id === pageId);
  if (!slide) return false;
  const seen = new Set(), before = arr(slide.supportModules).length;
  slide.supportModules = arr(slide.supportModules).filter((item) => { const key = JSON.stringify(item); if (seen.has(key)) return false; seen.add(key); return true; });
  return slide.supportModules.length !== before;
}

function repairTitle(bundle, pageId) {
  const slide = arr(bundle.deck?.slides).find((item) => item.id === pageId);
  const contract = arr(bundle.deckPlan?.pageContracts).find((item) => item.id === pageId);
  const source = contract?.actionTitle || arr(slide?.titleLines).join("");
  const fit = suggestTitleLines(source);
  if (fit.status !== "fit") return { changed:false, blocked:fit.reasons.join("；") };
  const changed = JSON.stringify(slide?.titleLines) !== JSON.stringify(fit.lines);
  if (slide) slide.titleLines = fit.lines;
  if (contract) contract.titleLines = fit.lines;
  return { changed };
}

function regroupZones(bundle, pageId) {
  const page = arr(bundle.layoutPlan?.pages).find((item) => item.pageId === pageId);
  const slide = arr(bundle.deck?.slides).find((item) => item.id === pageId);
  if (!page) return false;
  const support = arr(page.zones).find((zone) => zone.id === "support"), primary = arr(page.zones).find((zone) => zone.id === "primary"), source = arr(page.zones).find((zone) => zone.id === "source");
  if (!support || arr(slide?.supportModules).length || !primary || !source) return false;
  page.zones = page.zones.filter((zone) => zone.id !== "support");
  primary.bounds.height = Math.max(primary.bounds.height, source.bounds.y - primary.bounds.y - 18);
  page.primaryVisualShare = Math.min(.70, Math.max(.55, page.primaryVisualShare || .64));
  page.zones.sort((a,b)=>a.readingOrder-b.readingOrder).forEach((zone,index)=>{zone.readingOrder=index+1;});
  page.readingPath = page.zones.map((zone) => ({zoneId:zone.id,order:zone.readingOrder,x:zone.bounds.x+zone.bounds.width/2,y:zone.bounds.y+zone.bounds.height/2}));
  return true;
}

function reroutePattern(bundle, pageId, registry) {
  const contract = arr(bundle.deckPlan?.pageContracts).find((item) => item.id === pageId);
  const selection = arr(bundle.layoutSelection?.selections).find((item) => item.pageId === pageId);
  if (!contract || !selection || !registry) return { changed:false, blocked:"缺少页面合同、选择结果或Pattern Registry" };
  const next = selectLayout(contract, bundle.map?.semanticGraph, registry, {});
  if (next.status !== "selected") return { changed:false, blocked:next.reason };
  const changed = selection.patternId !== next.patternId || selection.status !== "selected";
  Object.assign(selection, next);
  if (changed) bundle.layoutPlan = buildLayoutPlan(bundle.deckPlan, bundle.layoutSelection, registry, bundle.deck);
  return { changed };
}

function approvedSplit(bundle, issue) {
  const budget = bundle.map?.pageBudget || {};
  if (budget.constraint === "exact") return { changed:false, blocked:`exact ${budget.requested}页合同禁止拆页` };
  if (!issue.approvedPages?.slides || !issue.approvedPages?.contracts || !issue.approvedPages?.selections || !issue.approvedPages?.layoutPages) return { changed:false, blocked:"缺少上游批准的完整拆页计划、Pattern选择或Layout Plan" };
  const oldPageId = pageIdFor(issue,bundle), oldSlide = arr(bundle.deck.slides).find((page)=>page.id===oldPageId), oldAtoms = new Set(arr(oldSlide?.atomRefs));
  const newAtoms = issue.approvedPages.slides.flatMap((page)=>arr(page.atomRefs));
  if (new Set(newAtoms).size !== newAtoms.length || newAtoms.some((atom)=>!oldAtoms.has(atom)) || [...oldAtoms].some((atom)=>!newAtoms.includes(atom))) return {changed:false,blocked:"批准拆页未形成primary atom的互斥完整分区"};
  const pageIds=issue.approvedPages.slides.map((page)=>page.id), contractIds=issue.approvedPages.contracts.map((page)=>page.id), selectionIds=issue.approvedPages.selections.map((page)=>page.pageId), layoutIds=issue.approvedPages.layoutPages.map((page)=>page.pageId);
  if(!pageIds.length||new Set(pageIds).size!==pageIds.length||JSON.stringify(pageIds)!==JSON.stringify(contractIds)||JSON.stringify(pageIds)!==JSON.stringify(selectionIds)||JSON.stringify(pageIds)!==JSON.stringify(layoutIds)) return{changed:false,blocked:"批准拆页的slide/contract/selection/layout页面ID不一致"};
  bundle.deck.slides.splice(bundle.deck.slides.findIndex((page)=>page.id===oldPageId),1,...clone(issue.approvedPages.slides));
  bundle.deckPlan.pageContracts.splice(bundle.deckPlan.pageContracts.findIndex((page)=>page.id===oldPageId),1,...clone(issue.approvedPages.contracts));
  bundle.layoutSelection.selections.splice(bundle.layoutSelection.selections.findIndex((page)=>page.pageId===oldPageId),1,...clone(issue.approvedPages.selections));
  bundle.layoutPlan.pages.splice(bundle.layoutPlan.pages.findIndex((page)=>page.pageId===oldPageId),1,...clone(issue.approvedPages.layoutPages));
  for(const section of arr(bundle.deckPlan.sections)){const index=arr(section.pageIds).indexOf(oldPageId);if(index>=0)section.pageIds.splice(index,1,...pageIds);}
  bundle.map.pageBudget.planned = bundle.deck.slides.length;
  bundle.deckPlan.pageBudget.planned = bundle.deck.slides.length;
  bundle.deck.pageBudget = bundle.deck.slides.length;
  return { changed:true };
}

function limitedScale(bundle, issue, pageId) {
  const page = arr(bundle.layoutPlan?.pages).find((item)=>item.pageId===pageId);
  const requested = Number(issue.scale ?? .94);
  if (!page || requested < .90 || requested > 1) return {changed:false,blocked:"有限缩放必须在90%–100%之间且页面存在"};
  page.typographyScale = requested;
  return {changed:true};
}

export function applyRepairRound(inputBundle, issues, registry, round = 1) {
  const bundle = clone(inputBundle), beforeInvariant = invariants(bundle), beforeHash = hash(bundle), repairs = [], blockedReasons = [];
  const ordered = [...arr(issues)].sort((a,b)=>(REPAIR_ORDER.indexOf(a.code)<0?99:REPAIR_ORDER.indexOf(a.code))-(REPAIR_ORDER.indexOf(b.code)<0?99:REPAIR_ORDER.indexOf(b.code)));
  const handled = new Set();
  for (const issue of ordered) {
    const pageId = pageIdFor(issue,bundle);
    const issueKey = `${issue.code}:${pageId}`;
    if (handled.has(issueKey)) continue;
    handled.add(issueKey);
    if (!REPAIRABLE_CODES.has(issue.code)) { blockedReasons.push(`${issue.code}: ${issue.message || "不允许自动修复"}`); continue; }
    let result = {changed:false};
    if (issue.code === "DEDUP_SUPPORT") result = {changed:dedupeSupport(bundle,pageId)};
    if (issue.code === "TITLE_BREAK") result = repairTitle(bundle,pageId);
    if (issue.code === "ZONE_REGROUP") result = {changed:regroupZones(bundle,pageId)};
    if (issue.code === "PATTERN_REROUTE") result = reroutePattern(bundle,pageId,registry);
    if (issue.code === "PAGE_SPLIT") result = approvedSplit(bundle,issue);
    if (issue.code === "LIMITED_SCALE") result = limitedScale(bundle,issue,pageId);
    if (result.blocked) blockedReasons.push(`${issue.code}: ${result.blocked}`);
    else if (result.changed) repairs.push({round,pageId,action:issue.code});
    else blockedReasons.push(`${issue.code}: 没有产生可验证的结构变化`);
  }
  blockedReasons.push(...verifyInvariants(beforeInvariant,bundle));
  const afterHash = hash(bundle);
  return {bundle,status:blockedReasons.length?"blocked":repairs.length?"repair-required":"formal-ready",repairs,blockedReasons,diff:{round,beforeHash,afterHash,changed:beforeHash!==afterHash}};
}

export function orchestrateRepairs(inputBundle, qaRounds, registry, maxRounds = 2) {
  let bundle=clone(inputBundle);const history=[];
  for(let round=1;round<=Math.min(maxRounds,arr(qaRounds).length);round+=1){
    const report=qaRounds[round-1]||{};
    if(report.status==="formal-ready"||(!arr(report.repairIssues).length&&!arr(report.errors).length)) return{status:"formal-ready",bundle,rounds:round-1,history};
    const issues=arr(report.repairIssues).length?report.repairIssues:classifyQaMessages(report.errors);
    const result=applyRepairRound(bundle,issues,registry,round);history.push({qaStatus:report.status,issues,repairs:result.repairs,blockedReasons:result.blockedReasons,diff:result.diff});bundle=result.bundle;
    if(result.status==="blocked")return{status:"blocked",bundle,rounds:round,history};
  }
  const unresolved=qaRounds[Math.min(maxRounds,arr(qaRounds).length)] || qaRounds.at(-1);
  return{status:unresolved?.status==="formal-ready"?"formal-ready":"blocked",bundle,rounds:Math.min(maxRounds,arr(qaRounds).length),history,blockedReasons:unresolved?.status==="formal-ready"?[]:[`最多${maxRounds}轮后仍未通过QA`]};
}
