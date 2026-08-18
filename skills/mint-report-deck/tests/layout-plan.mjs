#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLayoutPlan, validateLayoutPlan } from "../scripts/build-layout-plan.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registry = JSON.parse(fs.readFileSync(path.join(root,"assets/layout-patterns.json"),"utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root,"schemas/layout-plan.schema.json"),"utf8"));
if (schema.properties?.schemaVersion?.const !== "0.6" || !schema.$defs?.zone || !schema.$defs?.page) throw new Error("layout-plan schema缺少V0.6 zone/page合同");
for (const pattern of registry.patterns) if (!registry.layoutTemplates?.[registry.patternTemplates?.[pattern.id]]) throw new Error(`${pattern.id} 未映射到有效layout template`);

const cases = [
  {id:"parallel",patternId:"parallel-columns",axis:"left-to-right",role:"evidence",atoms:3,support:0},
  {id:"five-step-flow",patternId:"horizontal-sequence",axis:"left-to-right",role:"action",atoms:5,support:0},
  {id:"before-after",patternId:"before-after",axis:"left-to-right",role:"contrast",atoms:2,support:0},
  {id:"single-risk",patternId:"risk-decision",axis:"top-to-bottom",role:"risk",atoms:1,support:2},
  {id:"chart-insight",patternId:"chart-insight",axis:"left-to-right",role:"evidence",atoms:4,support:1}
];
const pageContracts = cases.map((item,index)=>({id:`P${index+1}`,sectionId:"S1",actionTitle:item.id,titleLines:[item.id],pageQuestion:`${item.id}?`,pageAnswer:`${item.id} answer`,pageRole:item.role,proofObject:{kind:"source-backed-claim",primaryAtomRef:`${item.id}-A1`,atomRefs:Array.from({length:item.atoms},(_,i)=>`${item.id}-A${i+1}`),evidenceRefs:[`${item.id}:source`]},atomRefs:Array.from({length:item.atoms},(_,i)=>`${item.id}-A${i+1}`),relationGraphRefs:[],primaryRelationRef:null,readingAxis:item.axis,contentOrder:["title","page-answer","proof-object","implication"],focalAnchor:"proof-object",densityProfile:item.atoms>4?"compact":"balanced",transitionFromPrevious:index?{fromPageId:`P${index}`,bridge:"next"}:null,pageNecessity:{type:index?"independent-decision":"opening",reason:"test"}}));
const plan = {schemaVersion:"0.6",pageContracts};
const selection = {schemaVersion:"0.6",status:"selected",selections:cases.map((item,index)=>({pageId:`P${index+1}`,status:"selected",patternId:item.patternId}))};
const deck = {slides:cases.map((item,index)=>({id:`P${index+1}`,supportModules:Array.from({length:item.support},(_,i)=>({kind:"note",data:{text:`S${i+1}`}}))}))};
const first = buildLayoutPlan(plan,selection,registry,deck);
const second = buildLayoutPlan(plan,selection,registry,deck);
if (JSON.stringify(first)!==JSON.stringify(second)) throw new Error("layout plan不是确定性的");
const validation = validateLayoutPlan(first);
if (!validation.passed) throw new Error(validation.errors.join(" | "));
for (const page of first.pages) {
  if (page.status!=="planned") throw new Error(`${page.pageId} unexpectedly blocked`);
  if (page.readingPath[0].zoneId!=="title" || page.readingPath.at(-1).zoneId!=="source") throw new Error(`${page.pageId} reading path endpoints invalid`);
  const spatial = page.readingPath.map((item)=>item.y*first.canvas.width+item.x);
  if (spatial.some((value,index)=>index>0&&value<spatial[index-1])) throw new Error(`${page.pageId} reading coordinates are not monotonic`);
  if (!Object.values(page.semanticZoneBindings).every((zoneId)=>page.zones.some((zone)=>zone.id===zoneId))) throw new Error(`${page.pageId} has unbound semantic zone`);
  if (page.primaryVisualShare<.55 || page.primaryVisualShare>.70) throw new Error(`${page.pageId} primary share invalid`);
}
const bad = structuredClone(first);
bad.pages[0].zones[1].bounds = {...bad.pages[0].zones[0].bounds};
const badResult = validateLayoutPlan(bad);
if (badResult.passed || !badResult.errors.some((error)=>error.includes("重叠"))) throw new Error("overlapping zones were not blocked");
const missingTemplateRegistry = structuredClone(registry);
delete missingTemplateRegistry.patternTemplates["parallel-columns"];
const blocked = buildLayoutPlan({schemaVersion:"0.6",pageContracts:[pageContracts[0]]},{schemaVersion:"0.6",selections:[selection.selections[0]]},missingTemplateRegistry,{slides:[deck.slides[0]]});
if (blocked.pages[0].status!=="layout-blocked") throw new Error("missing template did not block layout");

console.log(JSON.stringify({passed:true,schemaVersion:schema.properties.schemaVersion.const,pages:first.pages.length,zones:validation.metrics.zones,registeredPatterns:registry.patterns.length,deterministicRuns:2,monotonicReadingPaths:first.pages.length,overlapsBlocked:1,missingTemplatesBlocked:1,patterns:cases.map((item)=>item.patternId)},null,2));
