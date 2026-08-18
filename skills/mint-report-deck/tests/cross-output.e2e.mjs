#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.resolve(here,"..");
const repo = path.resolve(skill,"../..");
const workspace = path.join(repo,".work","p109-cross-output");
fs.mkdirSync(workspace,{recursive:true});
const playwright = process.env.MINT_PLAYWRIGHT_MODULE || "/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const chrome = process.env.MINT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const python = process.env.MINT_PYTHON || "/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const env = {...process.env,MINT_PLAYWRIGHT_MODULE:playwright,MINT_CHROMIUM_EXECUTABLE:chrome,MINT_PYTHON:python};

function run(command,args,label,{expectFailure=false}={}) {
  const result = spawnSync(command,args,{cwd:repo,encoding:"utf8",env,maxBuffer:30_000_000});
  if (!expectFailure && result.status !== 0) throw new Error(`${label} failed\n${result.stdout}\n${result.stderr}`);
  if (expectFailure && result.status === 0) throw new Error(`${label} unexpectedly passed`);
  return result;
}
function writeJson(file,value) { fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`); }
function buildOutputs(name,deck,layoutPlan=null) {
  const dir = path.join(workspace,name);
  fs.mkdirSync(dir,{recursive:true});
  const deckFile=path.join(dir,"deck-spec.json"), html=path.join(dir,"report.html"), pdf=path.join(dir,"report.pdf"), pptx=path.join(dir,"report.pptx"), report=path.join(dir,"cross-output-report.json");
  writeJson(deckFile,deck);
  let layoutFile;
  if (layoutPlan) { layoutFile=path.join(dir,"layout-plan.json"); writeJson(layoutFile,layoutPlan); }
  run(process.execPath,[path.join(skill,"scripts/render-deck.mjs"),deckFile,html,...(layoutFile?[layoutFile]:[])],`${name}: render html`);
  run(process.execPath,[path.join(skill,"scripts/render-pptx.mjs"),deckFile,pptx],`${name}: render pptx`);
  run(process.execPath,[path.join(skill,"scripts/export-pdf.mjs"),html,pdf,path.join(dir,"export-manifest.json")],`${name}: export pdf`);
  const checked=run(process.execPath,[path.join(skill,"scripts/validate-cross-output.mjs"),deckFile,html,pdf,pptx,report,"--manifest",path.join(dir,"export-manifest.json")],`${name}: cross output`);
  const parsed=JSON.parse(checked.stdout);
  if (parsed.status!=="formal-ready") throw new Error(`${name}: expected formal-ready, got ${parsed.status}`);
  return {dir,deckFile,html,pdf,pptx,report,parsed};
}

run(process.execPath,[path.join(skill,"tests/weekly-kb.e2e.mjs")],"prepare weekly V0.6");
const weeklyDir=path.join(repo,"outputs","v06-weekly-kb-e2e");
const weekly=JSON.parse(fs.readFileSync(path.join(weeklyDir,"deck-spec.json"),"utf8"));
const weeklyLayout=JSON.parse(fs.readFileSync(path.join(weeklyDir,"layout-plan.json"),"utf8"));
const metricSlide=weekly.slides.find((slide)=>slide.id==="P4");
const metricLayout=weeklyLayout.pages.find((page)=>page.pageId==="P4");
const metricDeck={...weekly,id:"cross-output-metric",pageBudget:1,slides:[metricSlide]};
const metricPlan={...weeklyLayout,pages:[metricLayout]};
const metric=buildOutputs("metric-one-page",metricDeck,metricPlan);

const vodafoneDeck=JSON.parse(fs.readFileSync(path.join(skill,"tests/fixtures/vodafone-deck.json"),"utf8"));
const vodafone=buildOutputs("vodafone-one-page",vodafoneDeck);

const badHtml=path.join(metric.dir,"bad-number.html");
fs.writeFileSync(badHtml,fs.readFileSync(metric.html,"utf8").replaceAll("261.53","262.53"));
const badNumber=run(process.execPath,[path.join(skill,"scripts/validate-cross-output.mjs"),metric.deckFile,badHtml,metric.pdf,metric.pptx,path.join(metric.dir,"bad-number-report.json"),"--manifest",path.join(metric.dir,"export-manifest.json")],"changed number",{expectFailure:true});
if (!/内容哈希|缺少关键数字/.test(badNumber.stdout)) throw new Error("changed number was not diagnosed");

const twoPageDeck={...metricDeck,slides:[metricSlide,{...metricSlide,id:"P4-copy"}]};
const twoPageFile=path.join(metric.dir,"deleted-page-expected.json"); writeJson(twoPageFile,twoPageDeck);
const missingPage=run(process.execPath,[path.join(skill,"scripts/validate-cross-output.mjs"),twoPageFile,metric.html,metric.pdf,metric.pptx,path.join(metric.dir,"missing-page-report.json"),"--manifest",path.join(metric.dir,"export-manifest.json")],"deleted page",{expectFailure:true});
if (!/页数/.test(missingPage.stdout)) throw new Error("deleted page was not diagnosed");

const changedEntityDeck=JSON.parse(JSON.stringify(vodafoneDeck).replaceAll("Vodafone","Vodacom"));
const changedEntityFile=path.join(vodafone.dir,"changed-entity-deck.json"), changedEntityPptx=path.join(vodafone.dir,"changed-entity.pptx");
writeJson(changedEntityFile,changedEntityDeck);
run(process.execPath,[path.join(skill,"scripts/render-pptx.mjs"),changedEntityFile,changedEntityPptx],"render changed entity pptx");
const entityMismatch=run(process.execPath,[path.join(skill,"scripts/validate-cross-output.mjs"),vodafone.deckFile,vodafone.html,vodafone.pdf,changedEntityPptx,path.join(vodafone.dir,"entity-mismatch-report.json"),"--manifest",path.join(vodafone.dir,"export-manifest.json")],"changed entity",{expectFailure:true});
if (!/缺少关键实体/.test(entityMismatch.stdout)) throw new Error("changed entity was not diagnosed");

const invalidPptx=path.join(metric.dir,"invalid.pptx"); fs.writeFileSync(invalidPptx,"not a pptx");
const unverified=run(process.execPath,[path.join(skill,"scripts/validate-cross-output.mjs"),metric.deckFile,metric.html,metric.pdf,invalidPptx,path.join(metric.dir,"unverified-report.json"),"--manifest",path.join(metric.dir,"export-manifest.json")],"invalid pptx",{expectFailure:true});
const unverifiedReport=JSON.parse(unverified.stdout);
if (unverifiedReport.status!=="unverified") throw new Error(`parse failure must be unverified, got ${unverifiedReport.status}`);

console.log(JSON.stringify({passed:true,positiveCases:2,negativeCases:4,metricPages:metric.parsed.metrics,vodafonePages:vodafone.parsed.metrics,workspace},null,2));
