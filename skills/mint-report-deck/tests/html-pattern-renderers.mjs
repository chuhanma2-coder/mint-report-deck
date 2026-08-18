#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildLayoutPlan } from "../scripts/build-layout-plan.mjs";
import { registeredPatternIds, renderPatternPrimary } from "../scripts/renderers/html/registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "assets/layout-patterns.json"), "utf8"));
const patternIds = registry.patterns.map((pattern) => pattern.id);
if (JSON.stringify([...registeredPatternIds].sort()) !== JSON.stringify([...patternIds].sort())) throw new Error("Pattern Registry与HTML renderer注册不一致");

const relationPatterns = new Set(["horizontal-sequence","vertical-sequence","timeline","before-after","problem-cause-solution","risk-decision","summary-decision"]);
const genericSlide = (patternId, index) => {
  const items = [1,2,3].map((number) => ({id:`${patternId}-item-${number}`,title:`${patternId} 要点 ${number}`,detail:`说明 ${number}`,atomRefs:[`${patternId}-A${number}`]}));
  const slide = {
    id:`P${index + 1}`, type:"comparison", chapter:"Renderer QA", titleLines:[`${patternId} 中文标题`],
    pageQuestion:`${patternId} 回答什么？`, pageAnswer:`${patternId} 的页面答案`, lead:`${patternId} 的页面答案`,
    atomRefs:items.map((item)=>item.atomRefs[0]), sourceRefs:[`TEST:${patternId}`],
    visibleClaims:items.map((item)=>({text:item.title,atomRefs:item.atomRefs})), items, columns:items.map((item)=>({id:item.id,title:item.title,subtitle:"并列",items:[item.detail],atomRefs:item.atomRefs})),
    primaryVisual:{kind:patternId,atomRefs:items.flatMap((item)=>item.atomRefs),claimRefs:[],data:{}},
    supportModules:[{kind:"note",atomRefs:[items[0].atomRefs[0]],data:{label:"补充",value:"可追溯说明",detail:"仅消费已规划内容"}}],
    connectors:relationPatterns.has(patternId) ? [
      {id:`${patternId}-C1`,relationRef:`${patternId}-R1`,connectorType:"arrow",direction:"forward",fromElementId:items[0].id,toElementId:items[1].id},
      {id:`${patternId}-C2`,relationRef:`${patternId}-R2`,connectorType:"arrow",direction:"forward",fromElementId:items[1].id,toElementId:items[2].id}
    ] : [],
    rendererShouldIgnore:"UNKNOWN-FIELD-MUST-NOT-RENDER", source:`来源：${patternId}测试`
  };
  if (patternId === "numeric-story") slide.primaryVisual.data = {metrics:[{label:"覆盖页面",value:"140",unit:"页",detail:"真实数字结构",claimRefs:["N140"]}]};
  if (patternId === "chart-insight") slide.chart = {type:"bar",labels:["A","B"],series:[{name:"数量",values:[10,20]}],unit:"个"};
  if (["media-evidence","full-bleed-media"].includes(patternId)) { slide.image=""; slide.caption="媒体证据"; }
  if (patternId === "section-intro") { slide.sectionNumber="02"; slide.sectionTitle="知识库"; slide.sectionClaim="从局部命中升级为全文可追溯"; }
  if (["risk-decision","summary-decision"].includes(patternId)) slide.risk={label:"关键风险",judgment:"高价模型触发范围过宽",evidence:["二次复核占比偏高"],actions:["改为三级复核"]};
  return slide;
};

const slides = patternIds.map(genericSlide);
const pageContracts = slides.map((slide,index)=>({
  id:slide.id,sectionId:"S1",actionTitle:slide.titleLines[0],titleLines:slide.titleLines,pageQuestion:slide.pageQuestion,pageAnswer:slide.pageAnswer,pageRole:"evidence",
  proofObject:{kind:"source-backed-claim",primaryAtomRef:slide.atomRefs[0],atomRefs:slide.atomRefs,evidenceRefs:slide.sourceRefs},atomRefs:slide.atomRefs,relationGraphRefs:slide.connectors.map((connector)=>connector.relationRef),primaryRelationRef:slide.connectors[0]?.relationRef || null,
  readingAxis:patternIds[index].includes("vertical") ? "top-to-bottom" : "left-to-right",contentOrder:["title","page-answer","proof-object","implication"],focalAnchor:"proof-object",densityProfile:"balanced",transitionFromPrevious:index?{fromPageId:`P${index}`,bridge:"继续"}:null,pageNecessity:{type:index?"independent-decision":"opening",reason:"renderer test"}
}));
const selection = {schemaVersion:"0.6",status:"selected",selections:slides.map((slide,index)=>({pageId:slide.id,status:"selected",patternId:patternIds[index]}))};
const deckPlan = {schemaVersion:"0.6",pageContracts};
const deck = {schemaVersion:"0.6",id:"html-renderer-v06-test",version:1,title:"HTML Pattern Renderer QA",confidentiality:"内部测试",deckPlan,layoutSelection:selection,slides};
const layoutPlan = buildLayoutPlan(deckPlan,selection,registry,deck);

const structures = new Set();
for (let index=0; index<slides.length; index+=1) {
  const patternId = patternIds[index];
  const html = renderPatternPrimary(patternId,slides[index],{pageIndex:index,mediaUrl:()=>""});
  if (!html.trim() || !html.includes(`data-pattern-structure="${patternId}"`)) throw new Error(`${patternId} 没有独立语义DOM`);
  if (html.includes("UNKNOWN-FIELD-MUST-NOT-RENDER")) throw new Error(`${patternId} 渲染了未知字段`);
  structures.add(html.match(/data-pattern-structure="([^"]+)"/)?.[1]);
  if (!relationPatterns.has(patternId) && html.includes("data-relation-ref=")) throw new Error(`${patternId} 不应自行添加连接器`);
  if (relationPatterns.has(patternId) && !["risk-decision","summary-decision"].includes(patternId) && !html.includes(`data-relation-ref="${patternId}-R1"`)) throw new Error(`${patternId} 连接器未绑定关系`);
}
if (structures.size !== patternIds.length) throw new Error(`不同Pattern语义DOM未完全区分：${structures.size}/${patternIds.length}`);

const temp = fs.mkdtempSync(path.join(os.tmpdir(),"mint-html-renderers-"));
const deckFile=path.join(temp,"deck-spec.json"), layoutFile=path.join(temp,"layout-plan.json"), htmlFile=path.join(temp,"report.html");
fs.writeFileSync(deckFile,`${JSON.stringify(deck,null,2)}\n`);
fs.writeFileSync(layoutFile,`${JSON.stringify(layoutPlan,null,2)}\n`);
const rendered = spawnSync(process.execPath,[path.join(root,"scripts/render-deck.mjs"),deckFile,htmlFile,layoutFile],{encoding:"utf8"});
if (rendered.status !== 0) throw new Error(`render-deck failed\n${rendered.stdout}\n${rendered.stderr}`);
const html = fs.readFileSync(htmlFile,"utf8");
if ((html.match(/class="slide slide--v06/g)||[]).length !== patternIds.length) throw new Error("V0.6页面数量不一致");
const renderedDom = html.split('<script type="application/json" id="mint-deck-data">')[0];
if (renderedDom.includes("UNKNOWN-FIELD-MUST-NOT-RENDER")) throw new Error("standalone DOM渲染了未知字段");
for (const [index,patternId] of patternIds.entries()) {
  const pageStart=html.indexOf(`data-slide-id="P${index+1}"`), pageEnd=index===patternIds.length-1?html.length:html.indexOf(`data-slide-id="P${index+2}"`);
  const pageHtml=html.slice(pageStart,pageEnd);
  for (const zoneId of ["title","primary","source"]) if (!pageHtml.includes(`data-zone-id="${zoneId}"`)) throw new Error(`${patternId} 缺少${zoneId} zone`);
  if (!pageHtml.includes("data-reading-order=")) throw new Error(`${patternId} 缺少阅读顺序`);
  if (!pageHtml.includes(`data-primary-atom-refs="${slides[index].atomRefs.join(" ")}"`)) throw new Error(`${patternId} 丢失primary atom覆盖`);
  if (!pageHtml.includes(`data-pattern-structure="${patternId}"`)) throw new Error(`${patternId} standalone DOM漂移`);
  if (!relationPatterns.has(patternId) && pageHtml.includes("data-relation-ref=")) throw new Error(`${patternId} standalone HTML错误显示箭头`);
}
for (const runtimeId of ["editButton","downloadButton","fullscreenButton","deckNav"]) if (!html.includes(`id="${runtimeId}"`)) throw new Error(`互动功能退化：${runtimeId}`);
if (!html.includes("data-mint-chart") || !html.includes("data-lightbox")) throw new Error("图表或媒体互动合同退化");
const blockedDir=path.join(temp,"missing-layout");
fs.mkdirSync(blockedDir);
const blockedDeck=path.join(blockedDir,"deck-spec.json"), blockedHtml=path.join(blockedDir,"report.html");
fs.writeFileSync(blockedDeck,`${JSON.stringify(deck,null,2)}\n`);
const blocked=spawnSync(process.execPath,[path.join(root,"scripts/render-deck.mjs"),blockedDeck,blockedHtml],{encoding:"utf8"});
if (blocked.status===0 || fs.existsSync(blockedHtml) || !blocked.stderr.includes("requires a validated layout-plan.json")) throw new Error("缺少Layout Plan的V0.6页面没有被阻断");

console.log(JSON.stringify({passed:true,patterns:patternIds.length,uniqueSemanticStructures:structures.size,zonedPages:layoutPlan.pages.length,relationBoundConnectors:slides.reduce((sum,slide)=>sum+slide.connectors.length,0),parallelPagesWithoutArrows:patternIds.filter((id)=>!relationPatterns.has(id)).length,missingLayoutPlansBlocked:1,interactionContracts:["edit","download","fullscreen","navigation","chart","lightbox"]},null,2));
