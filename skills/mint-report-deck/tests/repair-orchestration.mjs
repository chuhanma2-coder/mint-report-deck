#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { applyRepairRound, orchestrateRepairs } from "../scripts/repair-layout.mjs";

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const real=path.resolve(root,"../../outputs/v06-weekly-kb-e2e");
const read=(name)=>JSON.parse(fs.readFileSync(path.join(real,name),"utf8"));
const registry=JSON.parse(fs.readFileSync(path.join(root,"assets/layout-patterns.json"),"utf8"));
const makeBundle=()=>({map:read("content-map.json"),deck:read("deck-spec.json"),deckPlan:read("deck-plan.json"),layoutSelection:read("layout-selection.json"),layoutPlan:read("layout-plan.json")});

let bundle=makeBundle();
bundle.deck.slides[0].supportModules=[{kind:"note",data:{text:"重复说明"}},{kind:"note",data:{text:"重复说明"}}];
bundle.deckPlan.pageContracts[0].actionTitle="知识库从局部命中升级为全文可追溯，关键证据保留原始位置";
bundle.deck.slides[0].titleLines=[bundle.deckPlan.pageContracts[0].actionTitle];
const fixed=applyRepairRound(bundle,[{code:"DEDUP_SUPPORT",pageId:"P1"},{code:"TITLE_BREAK",pageId:"P1"}],registry,1);
assert.equal(fixed.status,"repair-required");assert.equal(fixed.bundle.deck.slides[0].supportModules.length,1);assert.ok(fixed.bundle.deck.slides[0].titleLines.length<=2);
assert.deepEqual(fixed.bundle.map.contentAtoms,bundle.map.contentAtoms);assert.deepEqual(fixed.bundle.map.semanticGraph,bundle.map.semanticGraph);

bundle=makeBundle();
const primary=bundle.layoutPlan.pages[0].zones.find((zone)=>zone.id==="primary");
const source=bundle.layoutPlan.pages[0].zones.find((zone)=>zone.id==="source");
bundle.layoutPlan.pages[0].zones.splice(-1,0,{id:"support",role:"support",bounds:{x:96,y:780,width:1728,height:120},readingOrder:4});source.readingOrder=5;primary.bounds.height=480;
const regrouped=applyRepairRound(bundle,[{code:"ZONE_REGROUP",pageId:"P1"}],registry,1);
assert.equal(regrouped.status,"repair-required");assert.equal(regrouped.bundle.layoutPlan.pages[0].zones.some((zone)=>zone.id==="support"),false);assert.ok(regrouped.bundle.layoutPlan.pages[0].zones.find((zone)=>zone.id==="primary").bounds.height>480);

bundle=makeBundle();bundle.layoutSelection.selections[0].patternId="horizontal-sequence";
const rerouted=applyRepairRound(bundle,[{code:"PATTERN_REROUTE",pageId:"P1"}],registry,1);
assert.equal(rerouted.status,"repair-required");assert.equal(rerouted.bundle.layoutSelection.selections[0].patternId,"parallel-columns");

bundle=makeBundle();bundle.deck.slides=bundle.deck.slides.slice(0,1);bundle.deck.pageBudget=1;bundle.deckPlan.pageContracts=bundle.deckPlan.pageContracts.slice(0,1);bundle.deckPlan.sections[0].pageIds=["P1"];bundle.layoutSelection.selections=bundle.layoutSelection.selections.slice(0,1);bundle.layoutPlan.pages=bundle.layoutPlan.pages.slice(0,1);bundle.map.contentAtoms=bundle.map.contentAtoms.filter((atom)=>bundle.deck.slides[0].atomRefs.includes(atom.id));bundle.map.pageBudget={requested:1,planned:1,constraint:"exact"};bundle.deckPlan.pageBudget={requested:1,planned:1,constraint:"exact"};
const split=applyRepairRound(bundle,[{code:"PAGE_SPLIT",pageId:"P1",approvedPages:{slides:[],contracts:[]}}],registry,1);
assert.equal(split.status,"blocked");assert.match(split.blockedReasons.join(" "),/禁止拆页/);
bundle=makeBundle();
const oldSlide=bundle.deck.slides[0],oldContract=bundle.deckPlan.pageContracts[0],oldSelection=bundle.layoutSelection.selections[0],oldLayout=bundle.layoutPlan.pages[0],cut=Math.ceil(oldSlide.atomRefs.length/2),groups=[oldSlide.atomRefs.slice(0,cut),oldSlide.atomRefs.slice(cut)];
const approved={
  slides:groups.map((atomRefs,index)=>({...structuredClone(oldSlide),id:`P1${index?"B":"A"}`,atomRefs,visibleClaims:oldSlide.visibleClaims.filter((claim)=>claim.atomRefs.some((ref)=>atomRefs.includes(ref)))})),
  contracts:groups.map((atomRefs,index)=>({...structuredClone(oldContract),id:`P1${index?"B":"A"}`,atomRefs,proofObject:{...structuredClone(oldContract.proofObject),primaryAtomRef:atomRefs[0],atomRefs}})),
  selections:groups.map((_,index)=>({...structuredClone(oldSelection),pageId:`P1${index?"B":"A"}`})),
  layoutPages:groups.map((_,index)=>({...structuredClone(oldLayout),pageId:`P1${index?"B":"A"}`}))
};
const allowedSplit=applyRepairRound(bundle,[{code:"PAGE_SPLIT",pageId:"P1",approvedPages:approved}],registry,1);assert.equal(allowedSplit.status,"repair-required");assert.equal(allowedSplit.bundle.deck.slides.length,bundle.deck.slides.length+1);assert.deepEqual(allowedSplit.bundle.deck.slides.slice(0,2).flatMap((slide)=>slide.atomRefs).sort(),oldSlide.atomRefs.slice().sort());
const unsafe=applyRepairRound(makeBundle(),[{code:"UNSAFE",pageId:"P1",message:"并列关系错误使用箭头"}],registry,1);assert.equal(unsafe.status,"blocked");

const exhausted=orchestrateRepairs(makeBundle(),[
  {status:"repair-required",repairIssues:[{code:"LIMITED_SCALE",pageId:"P1",scale:.95}]},
  {status:"repair-required",repairIssues:[{code:"LIMITED_SCALE",pageId:"P2",scale:.95}]},
  {status:"repair-required",repairIssues:[{code:"UNSAFE",pageId:"P3",message:"仍未通过"}]}
],registry,2);
assert.equal(exhausted.status,"blocked");assert.equal(exhausted.rounds,2);assert.match(exhausted.blockedReasons.join(" "),/最多2轮/);

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"mint-repair-v06-"));
bundle=makeBundle();bundle.deckPlan.pageContracts[0].actionTitle="知识库从局部命中升级为全文可追溯，关键证据保留原始位置";bundle.deckPlan.pageContracts[0].titleLines=[bundle.deckPlan.pageContracts[0].actionTitle];bundle.deck.slides[0].titleLines=[bundle.deckPlan.pageContracts[0].actionTitle];bundle.deck.deckPlan=bundle.deckPlan;
const deckFile=path.join(temp,"deck.json"),mapFile=path.join(temp,"map.json"),layoutFile=path.join(temp,"layout.json"),qaFile=path.join(temp,"qa.json"),outFile=path.join(temp,"repaired.json");
fs.writeFileSync(deckFile,JSON.stringify(bundle.deck));fs.writeFileSync(mapFile,JSON.stringify(bundle.map));fs.writeFileSync(layoutFile,JSON.stringify(bundle.layoutPlan));
const qaRun=spawnSync(process.execPath,[path.join(root,"scripts/qa-deck.mjs"),deckFile,mapFile,qaFile],{encoding:"utf8"});
assert.notEqual(qaRun.status,0);const qa=JSON.parse(fs.readFileSync(qaFile,"utf8"));assert.equal(qa.status,"repair-required");assert.ok(qa.repairIssues.some((item)=>item.code==="TITLE_BREAK"));assert.equal(qa.blockingErrors.length,0);
const repairRun=spawnSync(process.execPath,[path.join(root,"scripts/repair-deck.mjs"),deckFile,mapFile,outFile,qaFile,layoutFile],{encoding:"utf8"});
assert.notEqual(repairRun.status,0);const cliResult=JSON.parse(repairRun.stdout),repairedDeck=JSON.parse(fs.readFileSync(outFile,"utf8"));assert.equal(cliResult.status,"repair-required");assert.equal(repairedDeck.schemaVersion,"0.6");assert.ok(repairedDeck.repairState.requiredNextChecks.includes("visual-qa"));assert.ok(repairedDeck.slides[0].titleLines.length<=2);
console.log(JSON.stringify({passed:true,repairableCases:5,blockedCases:3,maxRounds:2,invariantsPreserved:true,v06CliPreservedSchema:true,output:temp},null,2));
