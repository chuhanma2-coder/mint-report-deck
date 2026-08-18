#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectLayout } from "../scripts/select-layout.mjs";
import { validateDeckRhythm } from "../scripts/qa-deck-rhythm.mjs";

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const fixture=JSON.parse(fs.readFileSync(path.join(here,"fixtures/ten-page-deck.json"),"utf8"));
const registry=JSON.parse(fs.readFileSync(path.join(root,"assets/layout-patterns.json"),"utf8"));
const edges=fixture.pages.filter((page)=>page.relation!=="none").map((page)=>({id:`E-${page.id}`,relationType:page.relation,source:`${page.id}-A1`,target:`${page.id}-A2`,direction:["parallel","comparison","composition","hierarchy"].includes(page.relation)?"none":"forward",confidence:1,needsReview:false,connectorPolicy:["sequence","temporal"].includes(page.relation)?"arrow":page.relation==="hierarchy"||(page.relation==="composition"&&page.proof!=="numeric-evidence")?"branch":"none"}));
const graph={nodes:[],edges};
const contracts=fixture.pages.map((page)=>({id:page.id,pageRole:page.role,relationGraphRefs:page.relation==="none"?[]:[`E-${page.id}`],primaryRelationRef:page.relation==="none"?null:`E-${page.id}`,atomRefs:Array.from({length:page.nodes},(_,i)=>`${page.id}-A${i+1}`),proofObject:{kind:page.proof,dataShape:page.shape},densityProfile:"balanced",readingAxis:page.axis,contentOrder:["title","page-answer","proof-object"],focalAnchor:"proof-object",introFamily:page.role==="section-intro"?"section-intro":undefined}));
let adjacent={recentPatternIds:[]};const selections=[];
for(const contract of contracts){const selected=selectLayout(contract,graph,registry,adjacent);assert.equal(selected.status,"selected",contract.id);selections.push({pageId:contract.id,...selected});const pattern=registry.patterns.find((item)=>item.id===selected.patternId);adjacent={lastPatternId:selected.patternId,lastRendererKey:pattern.rendererKeys.html,recentPatternIds:[...adjacent.recentPatternIds,selected.patternId].slice(-2)};}
const good=validateDeckRhythm({pageContracts:contracts},{selections},registry,graph);assert.equal(good.passed,true,good.errors.join(" | "));assert.ok(good.metrics.familyCount>=4);assert.ok(good.metrics.maxConsecutivePattern<=2);

const parallelEdges=Array.from({length:10},(_,i)=>({id:`EP${i+1}`,relationType:"parallel",source:`P${i+1}-A1`,target:`P${i+1}-A2`,direction:"none",confidence:1,needsReview:false,connectorPolicy:"none"}));
const parallelGraph={nodes:[],edges:parallelEdges},parallelContracts=contracts.map((page,i)=>({...page,pageRole:"evidence",relationGraphRefs:[`EP${i+1}`],primaryRelationRef:`EP${i+1}`,atomRefs:[`${page.id}-A1`,`${page.id}-A2`,`${page.id}-A3`],proofObject:{kind:"semantic-relationship",dataShape:"independent-items"},readingAxis:"left-to-right"}));
const repeated={selections:parallelContracts.map((page)=>({pageId:page.id,status:"selected",patternId:"parallel-columns",selectionReason:"语义兼容",candidates:[{patternId:"parallel-columns"},{patternId:"parallel-bands"}]}))};
const repeatedResult=validateDeckRhythm({pageContracts:parallelContracts},repeated,registry,parallelGraph);assert.equal(repeatedResult.passed,false);assert.ok(repeatedResult.errors.some((error)=>error.includes("连续第3页")));assert.ok(repeatedResult.errors.some((error)=>error.includes("10页材料")));
repeated.deckRhythmException={type:"semantic-constraint",reason:"只有并列关系"};repeated.selections.slice(2).forEach((selection)=>{selection.rhythmException={type:"no-compatible-alternative",reason:"示例约束"};});const exception=validateDeckRhythm({pageContracts:parallelContracts},repeated,registry,parallelGraph);assert.equal(exception.passed,true,exception.errors.join(" | "));

const intros=contracts.slice(0,3).map((page,i)=>({...page,pageRole:"section-intro",introFamily:i===2?"different":"section-intro",readingAxis:"top-to-bottom",relationGraphRefs:[],primaryRelationRef:null,proofObject:{kind:"source-backed-claim",dataShape:"text"}}));
const introSelections={selections:intros.map((page,i)=>({pageId:page.id,status:"selected",patternId:i===2?"hero":"section-intro",selectionReason:"章节引言"}))};const introResult=validateDeckRhythm({pageContracts:intros},introSelections,registry,{nodes:[],edges:[]});assert.equal(introResult.passed,false);assert.ok(introResult.errors.some((error)=>error.includes("章节引言")));
console.log(JSON.stringify({passed:true,tenPageFamilies:good.metrics.familyCount,maxRun:good.metrics.maxConsecutivePattern,repeatedDeckBlocked:true,semanticExceptionAllowed:true,inconsistentIntrosBlocked:true},null,2));
